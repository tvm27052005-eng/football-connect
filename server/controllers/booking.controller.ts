import { Response } from 'express';
import { z } from 'zod';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import type { IBooking } from '../types/index.js';
import { getFieldTimeSlots } from './field.controller.js';
import { BookingError, audit, cancelBookingState, confirmRefundState } from '../services/booking-payment.state.js';
import { bookingCopy, ensurePaymentLink, expirePendingBookings, preparePayment, reconcilePayment, withBookingLock } from '../services/booking-payment.service.js';

const createInput = z.object({
  venueId: z.string().min(1).max(100), fieldId: z.string().min(1).max(100),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  paymentMethod: z.literal('BANK_TRANSFER').default('BANK_TRANSFER'), note: z.string().max(1000).default('')
});

function fail(res: Response, error: unknown) {
  res.status(error instanceof BookingError ? error.status : 503).json({ success: false,
    message: error instanceof BookingError ? error.message : 'Chưa xử lý được yêu cầu. Vui lòng thử lại.' });
}
function canManage(req: AuthenticatedRequest, b: IBooking) {
  return req.user?.role === 'ADMIN' || (req.user?.role === 'OWNER' && db.venues.some(v => v.id === b.venueId && v.ownerId === req.user!.id));
}
function authorize(req: AuthenticatedRequest, b: IBooking, managerOnly = false) {
  if (!req.user) throw new BookingError(401, 'Chưa đăng nhập.');
  if (!canManage(req, b) && (managerOnly || req.user.id !== b.userId)) throw new BookingError(403, 'Bạn không có quyền thao tác đơn đặt sân này.');
}
function publicBooking(b: IBooking) {
  const venue = db.venues.find(v => v.id === b.venueId);
  return { ...b, ownerPhone: db.users.find(u => u.id === venue?.ownerId)?.phone,
    hasReviewed: db.reviews.some(r => r.bookingId === b.id) };
}

export const bookingController = {
  getBookings: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) throw new BookingError(401, 'Chưa đăng nhập.');
      await expirePendingBookings();
      const visiblePending = db.bookings.filter(b => b.status === 'PENDING' && b.payment && (
        req.user!.role === 'ADMIN' || (req.user!.role === 'OWNER' ? canManage(req, b) : b.userId === req.user!.id)
      ));
      const forceReconciliation = req.query.refresh === '1';
      await Promise.allSettled(visiblePending.map(b => reconcilePayment(b.id, forceReconciliation)));
      let bookings = db.bookings.filter(b => req.user!.role === 'ADMIN' ||
        (req.user!.role === 'OWNER' ? canManage(req, b) : b.userId === req.user!.id));
      const { status, venueId, date, search, sort } = req.query;
      if (typeof status === 'string' && status !== 'ALL') bookings = bookings.filter(b => b.status === status);
      if (typeof venueId === 'string' && venueId !== 'ALL') bookings = bookings.filter(b => b.venueId === venueId);
      if (typeof date === 'string') bookings = bookings.filter(b => b.bookingDate === date);
      if (typeof search === 'string') {
        const q = search.toLocaleLowerCase('vi');
        bookings = bookings.filter(b => [b.userName, b.venueName, b.fieldName, b.userPhone, b.id].some(v => v?.toLocaleLowerCase('vi').includes(q)));
      }
      bookings.sort((a, b) => {
        if (sort === 'price_asc') return a.totalPrice - b.totalPrice;
        if (sort === 'price_desc') return b.totalPrice - a.totalPrice;
        if (sort === 'alpha_asc') return (a.venueName || '').localeCompare(b.venueName || '');
        if (sort === 'time_asc') return a.startTime.localeCompare(b.startTime) || a.bookingDate.localeCompare(b.bookingDate);
        if (sort === 'time_desc') return b.startTime.localeCompare(a.startTime) || b.bookingDate.localeCompare(a.bookingDate);
        const order = a.bookingDate.localeCompare(b.bookingDate) || a.startTime.localeCompare(b.startTime);
        return sort === 'date_asc' ? order : -order;
      });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, count: bookings.length, data: bookings.map(publicBooking) });
    } catch (error) { fail(res, error); }
  },

  getBookingById: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      authorize(req, bookingCopy(req.params.id));
      await expirePendingBookings();
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, serverTime: new Date().toISOString(), data: publicBooking(bookingCopy(req.params.id)) });
    } catch (error) { fail(res, error); }
  },

  createBooking: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) throw new BookingError(401, 'Chưa đăng nhập.');
      const parsed = createInput.safeParse(req.body);
      if (!parsed.success) throw new BookingError(400, 'Kiểm tra thông tin sân, ngày giờ và phương thức chuyển khoản.');
      await expirePendingBookings();
      const booking = await withBookingLock(async () => {
        const { venueId, fieldId, bookingDate, startTime, endTime, note, paymentMethod } = parsed.data;
        const start = Date.parse(`${bookingDate}T${startTime}:00+07:00`);
        if (!Number.isFinite(start) || start <= Date.now() + 60_000 || endTime <= startTime ||
          new Date(`${bookingDate}T00:00:00Z`).toISOString().slice(0, 10) !== bookingDate) {
          throw new BookingError(400, 'Chọn ngày và ca đá hợp lệ, còn ít nhất 1 phút để thanh toán.');
        }
        const venue = db.venues.find(v => v.id === venueId);
        const field = db.fields.find(f => f.id === fieldId && f.venueId === venueId);
        if (!venue || !field) throw new BookingError(404, 'Sân bóng không tồn tại trong cụm sân đã chọn.');
        if (venue.status !== 'ACTIVE' || field.status !== 'ACTIVE') throw new BookingError(400, 'Sân chưa hoạt động hoặc đang bảo trì.');
        const slot = getFieldTimeSlots(field).find(s => s.startTime === startTime && s.endTime === endTime);
        if (!slot || !Number.isSafeInteger(slot.price) || slot.price <= 0) throw new BookingError(400, 'Khung giờ hoặc giá sân không hợp lệ.');
        if (db.checkBookingConflict(fieldId, bookingDate, startTime, endTime)) throw new BookingError(409, 'Ca sân đã được đặt hoặc đang giữ chỗ. Vui lòng chọn ca khác.');
        const user = req.user!;
        const b: IBooking = {
          id: db.generateId('book'), userId: user.id, userName: user.name,
          userPhone: db.users.find(u => u.id === user.id)?.phone, userEmail: user.email,
          venueId, venueName: venue.name, venueAddress: venue.address,
          ownerPhone: db.users.find(u => u.id === venue.ownerId)?.phone,
          fieldId, fieldName: field.name, fieldType: field.fieldType, bookingDate, startTime, endTime,
          durationHours: (Date.parse(`${bookingDate}T${endTime}:00+07:00`) - start) / 3_600_000,
          totalPrice: slot.price, status: 'PENDING', paymentStatus: 'UNPAID', paymentMethod, note,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        preparePayment(b, venue.ownerId);
        await db.syncBooking(b);
        return b;
      });
      // The durable ID is returned even when the payment provider is unavailable.
      res.status(201).json({ success: true, message: 'Đã giữ chỗ, chờ thanh toán.', data: publicBooking(booking) });
    } catch (error) { fail(res, error); }
  },

  createPayment: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      authorize(req, bookingCopy(req.params.id));
      const booking = await ensurePaymentLink(req.params.id);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, serverTime: new Date().toISOString(), data: publicBooking(booking) });
    } catch (error) { fail(res, error); }
  },

  checkPayment: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      authorize(req, bookingCopy(req.params.id));
      await expirePendingBookings();
      let reconciliationPending = false;
      const forceReconciliation = req.query.refresh === '1';
      try { await reconcilePayment(req.params.id, forceReconciliation); } catch { reconciliationPending = true; }
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, reconciliationPending, serverTime: new Date().toISOString(), data: publicBooking(bookingCopy(req.params.id)) });
    } catch (error) { fail(res, error); }
  },

  cancelBooking: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const booking = await withBookingLock(async () => {
        const b = bookingCopy(req.params.id);
        authorize(req, b);
        const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
        cancelBookingState(b, req.user!.id, canManage(req, b), reason);
        await db.syncBooking(b);
        return b;
      });
      res.json({ success: true, data: publicBooking(booking) });
    } catch (error) { fail(res, error); }
  },

  updateBookingStatus: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.body.status === 'CANCELLED' && !req.body.paymentStatus) {
      try { authorize(req, bookingCopy(req.params.id), true); } catch (error) { fail(res, error); return; }
      await bookingController.cancelBooking(req, res);
      return;
    }
    try {
      const booking = await withBookingLock(async () => {
        const b = bookingCopy(req.params.id);
        authorize(req, b, true);
        if (req.body.paymentStatus || req.body.status !== 'COMPLETED' || b.paymentStatus !== 'PAID' || b.status === 'CANCELLED') {
          throw new BookingError(400, 'Thanh toán được xác nhận tự động. Chủ sân có thể hủy đơn còn hạn hoặc xác nhận hoàn tiền.');
        }
        b.status = 'COMPLETED';
        audit(b, 'STATUS_COMPLETED', req.user!.id, Date.now());
        await db.syncBooking(b);
        return b;
      });
      res.json({ success: true, data: publicBooking(booking) });
    } catch (error) { fail(res, error); }
  },

  confirmRefund: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const booking = await withBookingLock(async () => {
        const b = bookingCopy(req.params.id);
        authorize(req, b, true);
        confirmRefundState(b, req.user!.id, typeof req.body.reference === 'string' ? req.body.reference : '');
        await db.syncBooking(b);
        return b;
      });
      res.json({ success: true, data: publicBooking(booking) });
    } catch (error) { fail(res, error); }
  }
};
