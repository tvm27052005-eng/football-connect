import { Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { IBooking, BookingStatus, PaymentStatus } from '../types/index.js';

export const bookingController = {
  // GET /api/bookings
  getBookings: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const { status, venueId, date, search, sort } = req.query;
      let bookings = [...db.bookings];

      // Role filter
      if (req.user.role === 'USER') {
        bookings = bookings.filter(b => b.userId === req.user?.id);
      } else if (req.user.role === 'OWNER') {
        // Owner only sees bookings of their venues
        const ownerVenueIds = new Set(db.venues.filter(v => v.ownerId === req.user?.id).map(v => v.id));
        bookings = bookings.filter(b => ownerVenueIds.has(b.venueId));
      }
      // ADMIN sees all

      // Query filters
      if (status && typeof status === 'string' && status !== 'ALL') {
        bookings = bookings.filter(b => b.status === status);
      }
      if (venueId && typeof venueId === 'string' && venueId !== 'ALL') {
        bookings = bookings.filter(b => b.venueId === venueId);
      }
      if (date && typeof date === 'string') {
        bookings = bookings.filter(b => b.bookingDate === date);
      }
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        bookings = bookings.filter(b =>
          (b.userName && b.userName.toLowerCase().includes(q)) ||
          (b.venueName && b.venueName.toLowerCase().includes(q)) ||
          (b.fieldName && b.fieldName.toLowerCase().includes(q)) ||
          (b.userPhone && b.userPhone.includes(q))
        );
      }

      // Sorting
      if (sort === 'date_asc') {
        bookings.sort((a, b) => a.bookingDate.localeCompare(b.bookingDate) || a.startTime.localeCompare(b.startTime));
      } else if (sort === 'time_asc') {
        bookings.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.bookingDate.localeCompare(b.bookingDate));
      } else if (sort === 'time_desc') {
        bookings.sort((a, b) => b.startTime.localeCompare(a.startTime) || b.bookingDate.localeCompare(a.bookingDate));
      } else if (sort === 'alpha_asc') {
        bookings.sort((a, b) => (a.venueName || '').localeCompare(b.venueName || ''));
      } else if (sort === 'price_desc') {
        bookings.sort((a, b) => b.totalPrice - a.totalPrice);
      } else if (sort === 'price_asc') {
        bookings.sort((a, b) => a.totalPrice - b.totalPrice);
      } else {
        // Default sort: latest bookingDate and startTime descending
        bookings.sort((a, b) => {
          const timeA = new Date(`${a.bookingDate}T${a.startTime}`).getTime();
          const timeB = new Date(`${b.bookingDate}T${b.startTime}`).getTime();
          return timeB - timeA;
        });
      }

      bookings = bookings.map(b => {
        if (!b.ownerPhone) {
          const venue = db.venues.find(v => v.id === b.venueId);
          const owner = db.users.find(u => u.id === venue?.ownerId);
          return {
            ...b,
            ownerPhone: owner?.phone || '0903456789'
          };
        }
        return b;
      });

      res.json({ success: true, count: bookings.length, data: bookings });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET /api/bookings/:id
  getBookingById: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const booking = db.bookings.find(b => b.id === id);
      if (!booking) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông tin đặt sân' });
        return;
      }

      // Authorization check
      if (req.user?.role === 'USER' && booking.userId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn đặt sân này' });
        return;
      }

      if (req.user?.role === 'OWNER') {
        const venue = db.venues.find(v => v.id === booking.venueId);
        if (venue?.ownerId !== req.user.id) {
          res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn đặt sân này' });
          return;
        }
      }

      const review = db.reviews.find(r => r.bookingId === booking.id);

      res.json({
        success: true,
        data: {
          ...booking,
          hasReviewed: !!review,
          review
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // POST /api/bookings (Create booking with strict anti-conflict lock)
  createBooking: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const {
        venueId,
        fieldId,
        bookingDate,
        startTime,
        endTime,
        note,
        paymentMethod = 'BANK_TRANSFER'
      } = req.body;

      if (paymentMethod === 'CASH') {
        res.status(400).json({
          success: false,
          message: 'Phương thức thanh toán tiền mặt tại sân đã ngừng áp dụng để chống bùng sân. Vui lòng thanh toán chuyển khoản hoặc ví điện tử.'
        });
        return;
      }

      if (!venueId || !fieldId || !bookingDate || !startTime || !endTime) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin đặt sân' });
        return;
      }

      // Kiểm tra ngày và thời gian thi đấu không được nhỏ hơn thời điểm hiện tại
      const bookingStartDateTime = new Date(`${bookingDate}T${startTime}:00`);
      const now = new Date();
      if (isNaN(bookingStartDateTime.getTime()) || bookingStartDateTime <= now) {
        res.status(400).json({
          success: false,
          message: 'Không thể đặt sân vì ngày và thời gian thi đấu đã trôi qua rồi!'
        });
        return;
      }

      const venue = db.venues.find(v => v.id === venueId);
      const field = db.fields.find(f => f.id === fieldId);

      if (!venue || !field) {
        res.status(404).json({ success: false, message: 'Sân bóng không tồn tại' });
        return;
      }

      if (field.status !== 'ACTIVE') {
        res.status(400).json({ success: false, message: 'Sân con này hiện đang bảo trì hoặc tạm ngưng' });
        return;
      }

      // CRITICAL: Double-booking verification
      const isConflict = db.checkBookingConflict(fieldId, bookingDate, startTime, endTime);
      if (isConflict) {
        res.status(409).json({
          success: false,
          message: 'Khung giờ này đã có người đặt trước hoặc đang được giữ chỗ. Vui lòng chọn khung giờ khác!'
        });
        return;
      }

      // Calculate price
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const durationHours = Math.max(1, (eh * 60 + em - (sh * 60 + sm)) / 60);

      let price = Math.round(field.pricePerHour * durationHours);
      if (startTime === '17:30' || startTime === '19:00' || startTime === '20:30') {
        price = Math.round(price * 1.15); // Peak hour surcharge
      }

      const newBooking: IBooking = {
        id: db.generateId('book'),
        userId: req.user.id,
        userName: req.user.name,
        userPhone: db.users.find(u => u.id === req.user?.id)?.phone,
        userEmail: req.user.email,
        venueId: venue.id,
        venueName: venue.name,
        venueAddress: venue.address,
        ownerPhone: db.users.find(u => u.id === venue.ownerId)?.phone,
        fieldId: field.id,
        fieldName: field.name,
        fieldType: field.fieldType,
        bookingDate,
        startTime,
        endTime,
        durationHours,
        totalPrice: price,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod,
        note: note || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.bookings.push(newBooking);

      // Create notification for User
      db.notifications.push({
        id: db.generateId('notif'),
        userId: req.user.id,
        title: 'Đặt sân thành công!',
        message: `Bạn đã đặt thành công ${field.name} tại ${venue.name} (${startTime} - ${endTime}, ngày ${bookingDate}).`,
        type: 'BOOKING_CONFIRMED',
        link: '/bookings',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // Create notification for Owner
      db.notifications.push({
        id: db.generateId('notif'),
        userId: venue.ownerId,
        title: 'Có lượt đặt sân mới',
        message: `${req.user.name} vừa đặt ${field.name} (${startTime} - ${endTime}, ngày ${bookingDate}).`,
        type: 'SYSTEM',
        link: '/owner/bookings',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Đặt sân thành công!',
        data: newBooking
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi đặt sân' });
    }
  },

  // PUT /api/bookings/:id/cancel
  cancelBooking: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const booking = db.bookings.find(b => b.id === id);

      if (!booking) {
        res.status(404).json({ success: false, message: 'Đơn đặt sân không tồn tại' });
        return;
      }

      // Check permissions
      const venue = db.venues.find(v => v.id === booking.venueId);
      const isOwner = venue?.ownerId === req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';
      const isBooker = booking.userId === req.user?.id;

      if (!isBooker && !isOwner && !isAdmin) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn đặt sân này' });
        return;
      }

      if (booking.status === 'CANCELLED') {
        res.status(400).json({ success: false, message: 'Đơn đặt sân này đã bị hủy trước đó' });
        return;
      }

      // Kiểm tra sát giờ thi đấu (dưới 2 tiếng hoặc đã diễn ra)
      if (isBooker && !isOwner && !isAdmin) {
        const matchStart = new Date(`${booking.bookingDate}T${booking.startTime}`);
        const now = new Date();
        const hoursUntilMatch = (matchStart.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilMatch <= 2) {
          res.status(400).json({
            success: false,
            message: 'Không thể hủy đặt sân do đã quá sát giờ thi đấu (dưới 2 tiếng).'
          });
          return;
        }
      }

      const createdAt = booking.createdAt ? new Date(booking.createdAt).getTime() : 0;
      const minutesSinceBooking = (Date.now() - createdAt) / (1000 * 60);
      const isWithin1Hour = minutesSinceBooking <= 60;

      booking.status = 'CANCELLED';
      booking.cancellationReason = reason || (isWithin1Hour ? 'Người dùng hủy trong vòng 1 giờ cho phép' : 'Người dùng hủy sau 1 giờ (không hoàn tiền sân)');
      if (booking.paymentStatus === 'PAID') {
        if (isWithin1Hour) {
          booking.paymentStatus = 'REFUNDED';
        } else {
          // Quá 1 tiếng: không hoàn tiền sân
          booking.note = (booking.note ? booking.note + ' | ' : '') + 'Đã hủy nhưng không được hoàn tiền sân (quá 1 giờ từ lúc đặt).';
        }
      }
      booking.updatedAt = new Date().toISOString();

      // Notify the user if cancelled by owner
      if (isOwner || isAdmin) {
        db.notifications.push({
          id: db.generateId('notif'),
          userId: booking.userId,
          title: 'Đơn đặt sân đã bị hủy',
          message: `Đơn đặt ${booking.fieldName} tại ${booking.venueName} ngày ${booking.bookingDate} đã bị hủy bởi chủ sân. Lý do: ${booking.cancellationReason}`,
          type: 'BOOKING_CANCELLED',
          link: '/bookings',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Hủy đơn đặt sân thành công',
        data: booking
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // PUT /api/bookings/:id/status (Owner / Admin)
  updateBookingStatus: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;
      const booking = db.bookings.find(b => b.id === id);

      if (!booking) {
        res.status(404).json({ success: false, message: 'Đơn đặt sân không tồn tại' });
        return;
      }

      const venue = db.venues.find(v => v.id === booking.venueId);
      if (req.user?.role !== 'ADMIN' && venue?.ownerId !== req.user?.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật trạng thái đơn này' });
        return;
      }

      if (status) booking.status = status as BookingStatus;
      if (paymentStatus) booking.paymentStatus = paymentStatus as PaymentStatus;
      booking.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: booking
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};
