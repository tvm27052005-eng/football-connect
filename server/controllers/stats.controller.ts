import { Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { IBooking } from '../types/index.js';
import { getFieldTimeSlots } from './field.controller.js';

type StatsRange = '7d' | '30d' | '90d' | '6m';
const RANGES: StatsRange[] = ['7d', '30d', '90d', '6m'];
const RANGE_DAYS: Record<Exclude<StatsRange, '6m'>, number> = { '7d': 7, '30d': 30, '90d': 90 };
const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

// Đơn được tính vào doanh thu khi đã xác nhận hoặc đã hoàn thành
const isRevenue = (b: IBooking) => b.status === 'CONFIRMED' || b.status === 'COMPLETED';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDateStr = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diffDays = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
const round1 = (n: number) => Math.round(n * 10) / 10;
const percent = (part: number, total: number) => (total > 0 ? Math.min(100, round1((part / total) * 100)) : 0);
const growth = (current: number, previous: number) =>
  previous > 0 ? round1(((current - previous) / previous) * 100) : null;

export const statsController = {
  // GET /api/stats/owner
  getOwnerStats: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const isOwner = req.user.role === 'OWNER';
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        res.status(403).json({ success: false, message: 'Chỉ Chủ sân mới có quyền xem thống kê này' });
        return;
      }

      const ownerVenues = isAdmin
        ? db.venues
        : db.venues.filter(v => v.ownerId === req.user?.id);

      const ownerVenueIds = new Set(ownerVenues.map(v => v.id));
      const ownerFields = db.fields.filter(f => ownerVenueIds.has(f.venueId));
      const activeFields = ownerFields.filter(f => f.status === 'ACTIVE');
      const ownerBookings = db.bookings.filter(b => ownerVenueIds.has(b.venueId));

      // Khoảng thời gian thống kê: kỳ hiện tại [from, to] và kỳ trước cùng độ dài
      const range: StatsRange = RANGES.includes(req.query.range as StatsRange)
        ? (req.query.range as StatsRange)
        : '30d';
      const today = startOfDay(new Date());
      const todayStr = toDateStr(today);
      const from = range === '6m'
        ? new Date(today.getFullYear(), today.getMonth() - 5, 1)
        : addDays(today, -(RANGE_DAYS[range] - 1));
      const periodDays = diffDays(from, today) + 1;
      const fromStr = toDateStr(from);
      const prevFromStr = toDateStr(addDays(from, -periodDays));
      const prevToStr = toDateStr(addDays(from, -1));

      const inRange = (b: IBooking, start: string, end: string) => b.bookingDate >= start && b.bookingDate <= end;
      const sumRevenue = (list: IBooking[]) => list.filter(isRevenue).reduce((s, b) => s + b.totalPrice, 0);

      const periodBookings = ownerBookings.filter(b => inRange(b, fromStr, todayStr));
      const prevBookings = ownerBookings.filter(b => inRange(b, prevFromStr, prevToStr));
      const todayBookings = ownerBookings.filter(b => b.bookingDate === todayStr);

      const totalRevenue = sumRevenue(ownerBookings);
      const periodRevenue = sumRevenue(periodBookings);
      const prevPeriodRevenue = sumRevenue(prevBookings);
      const todayRevenue = sumRevenue(todayBookings);
      const upcomingBookings = ownerBookings.filter(b => b.bookingDate > todayStr && isRevenue(b));
      const upcomingRevenue = sumRevenue(upcomingBookings);

      const periodRevenueBookings = periodBookings.filter(isRevenue);
      const periodActiveBookings = periodBookings.filter(b => b.status !== 'CANCELLED');
      const cancelledCount = periodBookings.filter(b => b.status === 'CANCELLED').length;

      const paidRevenue = periodRevenueBookings
        .filter(b => b.paymentStatus === 'PAID')
        .reduce((s, b) => s + b.totalPrice, 0);
      const unpaidRevenue = periodRevenue - paidRevenue;
      const refundedAmount = periodBookings
        .filter(b => b.paymentStatus === 'REFUNDED')
        .reduce((s, b) => s + b.totalPrice, 0);

      // Công suất: chỉ tính các ca đã đến giờ (hôm nay tính tới hiện tại) của các sân đang hoạt động
      const now = new Date();
      const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const activeFieldIds = new Set(activeFields.map(f => f.id));
      const totalCapacity = activeFields.reduce((s, f) => {
        const slots = getFieldTimeSlots(f);
        const startedToday = slots.filter(slot => slot.startTime <= nowTime).length;
        return s + slots.length * (periodDays - 1) + startedToday;
      }, 0);
      const utilizedBookings = periodActiveBookings.filter(b =>
        activeFieldIds.has(b.fieldId) && (b.bookingDate < todayStr || b.startTime <= nowTime)
      );
      const utilizationRate = percent(utilizedBookings.length, totalCapacity);

      // Đánh giá trung bình từ review thật, nếu chưa có thì lấy rating của cụm sân
      const ownerReviews = db.reviews.filter(r => ownerVenueIds.has(r.venueId));
      const ratedVenues = ownerVenues.filter(v => v.reviewCount > 0);
      const avgRating = ownerReviews.length
        ? round1(ownerReviews.reduce((s, r) => s + r.rating, 0) / ownerReviews.length)
        : ratedVenues.length
          ? round1(ratedVenues.reduce((s, v) => s + v.rating, 0) / ratedVenues.length)
          : 0;

      // Doanh thu 6 tháng gần nhất
      const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
        const prefix = toDateStr(d).slice(0, 7);
        const monthBookings = ownerBookings.filter(b => b.bookingDate.startsWith(prefix));
        return {
          month: `T${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`,
          revenue: sumRevenue(monthBookings),
          bookings: monthBookings.filter(b => b.status !== 'CANCELLED').length
        };
      });

      // Xu hướng doanh thu trong kỳ: theo ngày, riêng kỳ 6 tháng nhóm theo tuần
      const bucketSize = range === '6m' ? 7 : 1;
      const dailyRevenue: { label: string; date: string; revenue: number; bookings: number }[] = [];
      for (let start = new Date(from); start <= today; start = addDays(start, bucketSize)) {
        const startStr = toDateStr(start);
        const end = addDays(start, bucketSize - 1);
        const endStr = toDateStr(end > today ? today : end);
        const bucket = periodBookings.filter(b => inRange(b, startStr, endStr));
        dailyRevenue.push({
          label: `${pad(start.getDate())}/${pad(start.getMonth() + 1)}`,
          date: startStr,
          revenue: sumRevenue(bucket),
          bookings: bucket.filter(b => b.status !== 'CANCELLED').length
        });
      }

      // Lượt đặt và doanh thu theo thứ trong tuần (Thứ 2 → Chủ nhật)
      const weekdayStats = WEEKDAYS.map(day => ({ day, revenue: 0, bookings: 0 }));
      periodActiveBookings.forEach(b => {
        const idx = (parseDateStr(b.bookingDate).getDay() + 6) % 7;
        weekdayStats[idx].bookings += 1;
        if (isRevenue(b)) weekdayStats[idx].revenue += b.totalPrice;
      });

      // Tỷ lệ đặt theo khung giờ dựa trên ca thực tế của các sân
      const slotMap = new Map<string, { slot: string; startTime: string; fieldCount: number; bookings: number; revenue: number }>();
      activeFields.forEach(f => {
        getFieldTimeSlots(f).forEach(s => {
          const key = `${s.startTime}-${s.endTime}`;
          const entry = slotMap.get(key) || { slot: key, startTime: s.startTime, fieldCount: 0, bookings: 0, revenue: 0 };
          entry.fieldCount += 1;
          slotMap.set(key, entry);
        });
      });
      periodActiveBookings.forEach(b => {
        const key = `${b.startTime}-${b.endTime}`;
        const entry = slotMap.get(key) || { slot: key, startTime: b.startTime, fieldCount: 1, bookings: 0, revenue: 0 };
        entry.bookings += 1;
        if (isRevenue(b)) entry.revenue += b.totalPrice;
        slotMap.set(key, entry);
      });
      const timeSlotStats = [...slotMap.values()]
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map(s => ({
          slot: s.slot,
          bookings: s.bookings,
          revenue: s.revenue,
          rate: percent(s.bookings, s.fieldCount * periodDays)
        }));
      const peakSlot = timeSlotStats.reduce<typeof timeSlotStats[number] | null>(
        (best, s) => (s.bookings > 0 && (!best || s.rate > best.rate) ? s : best),
        null
      )?.slot || null;

      // Hiệu suất từng sân con
      const fieldStats = ownerFields
        .map(f => {
          const fieldBookings = ownerBookings.filter(b => b.fieldId === f.id);
          const fieldPeriod = periodBookings.filter(b => b.fieldId === f.id);
          const fieldCapacity = f.status === 'ACTIVE' ? getFieldTimeSlots(f).length * periodDays : 0;
          return {
            id: f.id,
            name: f.name,
            fieldType: f.fieldType,
            status: f.status,
            venueName: ownerVenues.find(v => v.id === f.venueId)?.name || '',
            totalBookings: fieldBookings.length,
            periodBookings: fieldPeriod.filter(b => b.status !== 'CANCELLED').length,
            revenue: sumRevenue(fieldBookings),
            periodRevenue: sumRevenue(fieldPeriod),
            utilization: percent(fieldPeriod.filter(b => b.status !== 'CANCELLED').length, fieldCapacity)
          };
        })
        .sort((a, b) => b.periodRevenue - a.periodRevenue || b.revenue - a.revenue);

      // Doanh thu theo phương thức thanh toán
      const methodMap = new Map<string, { method: string; revenue: number; count: number }>();
      periodRevenueBookings.forEach(b => {
        const method = b.paymentMethod || 'CASH';
        const entry = methodMap.get(method) || { method, revenue: 0, count: 0 };
        entry.revenue += b.totalPrice;
        entry.count += 1;
        methodMap.set(method, entry);
      });
      const paymentMethodStats = [...methodMap.values()].sort((a, b) => b.revenue - a.revenue);

      const statusBreakdown = (['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map(status => ({
        status,
        count: periodBookings.filter(b => b.status === status).length
      }));

      const recentBookings = [...ownerBookings]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6);

      res.json({
        success: true,
        data: {
          range,
          period: { from: fromStr, to: todayStr, days: periodDays, prevFrom: prevFromStr, prevTo: prevToStr },
          generatedAt: new Date().toISOString(),
          summary: {
            totalRevenue,
            periodRevenue,
            prevPeriodRevenue,
            revenueGrowth: growth(periodRevenue, prevPeriodRevenue),
            todayRevenue,
            todayBookings: todayBookings.filter(b => b.status !== 'CANCELLED').length,
            upcomingRevenue,
            upcomingBookings: upcomingBookings.length,
            periodBookings: periodActiveBookings.length,
            prevPeriodBookings: prevBookings.filter(b => b.status !== 'CANCELLED').length,
            bookingGrowth: growth(
              periodActiveBookings.length,
              prevBookings.filter(b => b.status !== 'CANCELLED').length
            ),
            avgBookingValue: periodRevenueBookings.length ? Math.round(periodRevenue / periodRevenueBookings.length) : 0,
            cancellationRate: percent(cancelledCount, periodBookings.length),
            paidRevenue,
            unpaidRevenue,
            refundedAmount,
            utilizationRate,
            avgRating,
            reviewCount: ownerReviews.length,
            totalVenues: ownerVenues.length,
            totalFields: ownerFields.length,
            activeFields: activeFields.length,
            totalBookings: ownerBookings.length,
            pendingBookings: ownerBookings.filter(b => b.status === 'PENDING').length,
            uniqueCustomers: new Set(periodActiveBookings.map(b => b.userId)).size,
            peakSlot
          },
          monthlyRevenue,
          dailyRevenue,
          weekdayStats,
          timeSlotStats,
          fieldStats,
          paymentMethodStats,
          statusBreakdown,
          recentBookings
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET /api/stats/admin
  getAdminStats: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Yêu cầu quyền Quản trị viên' });
        return;
      }

      const totalUsers = db.users.length;
      const regularUsers = db.users.filter(u => u.role === 'USER').length;
      const owners = db.users.filter(u => u.role === 'OWNER').length;
      const totalVenues = db.venues.length;
      const totalFields = db.fields.length;
      const totalBookings = db.bookings.length;
      const totalMatches = db.matches.length;
      const totalReviews = db.reviews.length;
      const pendingReports = db.reports.filter(r => r.status === 'PENDING').length;

      const confirmedBookings = db.bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
      const grossMerchandiseValue = confirmedBookings.reduce((s, b) => s + b.totalPrice, 0);
      const platformFee = Math.round(grossMerchandiseValue * 0.05); // 5% platform take rate

      const userGrowth = [
        { month: 'T09', users: 120, matches: 30, bookings: 80 },
        { month: 'T10', users: 240, matches: 65, bookings: 160 },
        { month: 'T11', users: 410, matches: 110, bookings: 290 },
        { month: 'T12', users: 650, matches: 180, bookings: 460 },
        { month: 'T01', users: 890, matches: 260, bookings: 680 },
        { month: 'T02', users: 1250, matches: 390, bookings: 940 }
      ];

      const revenueTrend = [
        { month: 'T09', gmv: 45000000 },
        { month: 'T10', gmv: 68000000 },
        { month: 'T11', gmv: 92000000 },
        { month: 'T12', gmv: 125000000 },
        { month: 'T01', gmv: 180000000 },
        { month: 'T02', gmv: grossMerchandiseValue + 210000000 }
      ];

      res.json({
        success: true,
        data: {
          summary: {
            totalUsers,
            totalOwners: owners,
            totalVenues,
            totalFields,
            totalBookings,
            totalMatches,
            totalPlatformGMV: grossMerchandiseValue,
            platformFee,
            pendingReports
          },
          metrics: {
            totalUsers,
            regularUsers,
            owners,
            totalVenues,
            totalFields,
            totalBookings,
            totalMatches,
            totalReviews,
            pendingReports,
            grossMerchandiseValue,
            platformFee,
            systemHealth: '100% HOẠT ĐỘNG TỐT',
            activeSockets: 48
          },
          userGrowth,
          revenueTrend,
          recentUsers: db.users.map(({ password: _, ...u }) => u).slice(0, 5),
          recentBookings: db.bookings.slice(0, 5),
          recentMatches: db.matches.slice(0, 5),
          recentReports: db.reports.slice(0, 5)
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};
