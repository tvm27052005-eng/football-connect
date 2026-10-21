import { Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

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
      const ownerBookings = db.bookings.filter(b => ownerVenueIds.has(b.venueId));

      const now = new Date();
      const toDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const todayStr = toDateString(now);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const isRevenueBooking = (booking: typeof db.bookings[number]): boolean =>
        booking.status === 'CONFIRMED' || booking.status === 'COMPLETED';
      const confirmedOwnerBookings = ownerBookings.filter(isRevenueBooking);

      const todayBookings = ownerBookings.filter(b => b.bookingDate === todayStr);
      const totalRevenue = confirmedOwnerBookings.reduce((sum, b) => sum + b.totalPrice, 0);

      const todayRevenue = todayBookings
        .filter(isRevenueBooking)
        .reduce((sum, b) => sum + b.totalPrice, 0);

      // Revenue by month (Last 6 months)
      const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        const month = monthDate.getMonth();
        const year = monthDate.getFullYear();
        const monthBookings = confirmedOwnerBookings.filter((booking) => {
          const bookingDate = new Date(`${booking.bookingDate}T00:00:00`);
          return bookingDate.getFullYear() === year && bookingDate.getMonth() === month;
        });

        return {
          month: `T${String(month + 1).padStart(2, '0')}`,
          revenue: monthBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
          bookings: monthBookings.length
        };
      });

      // Daily revenue for the last 7 days
      const dailyRevenue = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfToday);
        date.setDate(startOfToday.getDate() - (6 - index));
        const dateString = toDateString(date);
        const dateBookings = confirmedOwnerBookings.filter((booking) => booking.bookingDate === dateString);
        return {
          day: date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
          revenue: dateBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
          bookings: dateBookings.length
        };
      });

      // Popular time slot utilization
      const slots = ['06:00-07:30', '07:30-09:00', '09:00-10:30', '14:30-16:00', '16:00-17:30', '17:30-19:00', '19:00-20:30', '20:30-22:00', '22:00-23:30'];
      const periodStart = new Date(startOfToday);
      periodStart.setDate(periodStart.getDate() - 29);
      const periodStartString = toDateString(periodStart);
      const periodBookings = confirmedOwnerBookings.filter((booking) =>
        booking.bookingDate >= periodStartString && booking.bookingDate <= todayStr
      );
      const activeFieldCount = ownerFields.filter((field) => field.status === 'ACTIVE').length;
      const timeSlotStats = slots.map((slot) => {
        const [startTime, endTime] = slot.split('-');
        const slotBookings = periodBookings.filter((booking) =>
          booking.startTime === startTime && booking.endTime === endTime
        );
        const possibleBookings = activeFieldCount * 30;
        const rate = possibleBookings > 0
          ? Math.min(100, Math.round((slotBookings.length / possibleBookings) * 100))
          : 0;
        return { slot, bookings: slotBookings.length, rate: `${rate}%` };
      });
      const peakSlot = [...timeSlotStats].sort((a, b) => b.bookings - a.bookings)[0];

      // Field performance
      const fieldStats = ownerFields.map(f => {
        const fieldBookings = ownerBookings.filter(b => b.fieldId === f.id);
        const fRevenue = fieldBookings
          .filter(isRevenueBooking)
          .reduce((s, b) => s + b.totalPrice, 0);
        const fieldPeriodBookings = fieldBookings.filter((booking) =>
          isRevenueBooking(booking) &&
          booking.bookingDate >= periodStartString &&
          booking.bookingDate <= todayStr
        );
        const utilization = activeFieldCount > 0
          ? Math.min(100, Math.round((fieldPeriodBookings.length / (30 * slots.length)) * 100))
          : 0;
        return {
          id: f.id,
          name: f.name,
          fieldType: f.fieldType,
          totalBookings: fieldBookings.length,
          revenue: fRevenue,
          utilization: `${utilization}%`
        };
      });

      const ownerReviews = db.reviews.filter((review) => ownerVenueIds.has(review.venueId));
      const avgRating = ownerReviews.length > 0
        ? Number((ownerReviews.reduce((sum, review) => sum + review.rating, 0) / ownerReviews.length).toFixed(1))
        : 0;
      const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1].revenue;
      const previousMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2].revenue;
      const revenueChangePercent = previousMonthRevenue > 0
        ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
        : currentMonthRevenue > 0 ? 100 : 0;
      const recentBookings = [...ownerBookings]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          summary: {
            totalRevenue,
            todayRevenue,
            totalVenues: ownerVenues.length,
            totalFields: ownerFields.length,
            totalBookings: ownerBookings.length,
            todayBookings: todayBookings.length,
            pendingBookings: ownerBookings.filter(b => b.status === 'PENDING').length,
            avgRating,
            reviewCount: ownerReviews.length,
            utilizationRate: `${activeFieldCount > 0
              ? Math.min(100, Math.round((periodBookings.length / (activeFieldCount * 30 * slots.length)) * 100))
              : 0}%`,
            revenueChangePercent,
            peakSlot: peakSlot?.slot || 'Chưa có dữ liệu'
          },
          monthlyRevenue,
          dailyRevenue,
          timeSlotStats,
          fieldStats,
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

      const now = new Date();
      const getMonthLabel = (date: Date): string =>
        `T${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      const isSameMonth = (value: string, date: Date): boolean => {
        const parsed = new Date(value);
        return !Number.isNaN(parsed.getTime()) &&
          parsed.getFullYear() === date.getFullYear() &&
          parsed.getMonth() === date.getMonth();
      };
      const recentMonths = Array.from({ length: 6 }, (_, index) =>
        new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      );

      const userGrowth = recentMonths.map((month) => ({
        month: getMonthLabel(month),
        users: db.users.filter((user) => user.role === 'USER' && isSameMonth(user.createdAt, month)).length,
        owners: db.users.filter((user) => user.role === 'OWNER' && isSameMonth(user.createdAt, month)).length
      }));

      const revenueTrend = recentMonths.map((month) => ({
        month: getMonthLabel(month),
        gmv: db.bookings
          .filter((booking) =>
            (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') &&
            isSameMonth(booking.bookingDate, month)
          )
          .reduce((sum, booking) => sum + booking.totalPrice, 0)
      }));
      const completedOrConfirmedCount = db.bookings.filter(
        (booking) => booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
      ).length;
      const completionRate = totalBookings > 0
        ? Math.round((completedOrConfirmedCount / totalBookings) * 1000) / 10
        : 0;

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
            pendingReports,
            completionRate
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
            systemHealth: 'Đang hoạt động',
            activeSockets: null
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
