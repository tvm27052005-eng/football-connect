import type { IBooking } from '../types/index.js';

export class BookingError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const matchStart = (b: IBooking) => Date.parse(`${b.bookingDate}T${b.startTime}:00+07:00`);
export const cancellationDeadline = (b: IBooking) => b.payment?.cancelBefore
  ? Date.parse(b.payment.cancelBefore)
  : matchStart(b) - 2 * 60 * 60_000;

export function audit(b: IBooking, action: string, actor: string, now: number, note?: string) {
  b.updatedAt = new Date(now).toISOString();
  b.audit = [...(b.audit || []), { action, actor, at: b.updatedAt, note }];
}

export function receivedAmount(b: IBooking) {
  return b.payment ? b.payment.receipts.reduce((sum, r) => sum + r.amount, 0)
    : b.paymentStatus === 'PAID' || b.paymentStatus === 'REFUNDED' ? b.totalPrice : 0;
}

function updateRefund(b: IBooking) {
  const amount = b.status === 'CANCELLED' ? receivedAmount(b) : Math.max(0, receivedAmount(b) - b.totalPrice);
  const refundedAmount = b.refund?.refundedAmount || 0;
  if (amount > 0) b.refund = { ...b.refund, amount, refundedAmount, status: amount > refundedAmount ? 'PENDING' : 'REFUNDED' };
}

export function expireBooking(b: IBooking, now = Date.now()): boolean {
  if (!b.payment || b.status !== 'PENDING' || b.paymentStatus !== 'UNPAID' || Date.parse(b.payment.expiresAt) > now) return false;
  b.status = 'CANCELLED';
  b.cancellationReason = 'Hết thời hạn thanh toán';
  b.payment.cancelSyncPending = true;
  updateRefund(b);
  audit(b, 'PAYMENT_EXPIRED', 'system', now);
  return true;
}

export function applyReceipt(b: IBooking, receipt: { reference: string; amount: number; paidAt: string }, now = Date.now()): boolean {
  if (!b.payment) throw new BookingError(400, 'Đơn chưa có giao dịch trực tuyến.');
  const duplicate = b.payment.receipts.find(r => r.reference === receipt.reference);
  if (duplicate) {
    if (duplicate.amount !== receipt.amount || duplicate.paidAt !== receipt.paidAt) throw new BookingError(409, 'Giao dịch trùng có dữ liệu khác.');
    return false;
  }
  if (!receipt.reference || !Number.isSafeInteger(receipt.amount) || receipt.amount <= 0 || !Number.isFinite(Date.parse(receipt.paidAt))) {
    throw new BookingError(400, 'Thông tin giao dịch không hợp lệ.');
  }
  // Use the bank's verified payment time. A delayed webhook must not expire a
  // still-held booking that was paid before its deadline. Never revive a slot
  // already released by an earlier cancellation.
  if (Date.parse(receipt.paidAt) >= Date.parse(b.payment.expiresAt)) expireBooking(b, now);
  b.payment.receipts.push(receipt);
  const late = Date.parse(receipt.paidAt) >= Date.parse(b.payment.expiresAt);
  if (b.status === 'PENDING' && late) {
    b.status = 'CANCELLED';
    b.cancellationReason = 'Thanh toán sau hạn giữ chỗ';
    b.payment.cancelSyncPending = true;
  }
  const total = receivedAmount(b);
  if (b.status === 'CANCELLED') {
    b.payment.exception = 'Đã nhận tiền cho đơn bị hủy. Liên hệ chủ sân để đối soát và hoàn tiền; ca sân không được khôi phục.';
    b.paymentStatus = 'PAID';
  } else if (total >= b.totalPrice) {
    b.status = 'COMPLETED';
    b.paymentStatus = 'PAID';
    b.payment.paidAt = receipt.paidAt;
    b.payment.exception = total > b.totalPrice ? 'Nhận dư tiền. Chủ sân cần hoàn lại phần tiền dư.' : undefined;
  }
  updateRefund(b);
  audit(b, 'PAYMENT_RECEIVED', 'payos', now, receipt.reference);
  return true;
}

export function cancelBookingState(b: IBooking, actor: string, isManager: boolean, reason: string, now = Date.now()) {
  if (b.status === 'CANCELLED') return;
  const hasMoney = b.paymentStatus === 'PAID' || receivedAmount(b) > 0;
  if (hasMoney && !isManager) throw new BookingError(400, 'Đơn đã nhận tiền. Vui lòng liên hệ chủ sân để hủy và hoàn tiền.');
  if (hasMoney && now >= cancellationDeadline(b)) throw new BookingError(400, 'Đã quá hạn hủy có hoàn tiền trước giờ bắt đầu ca.');
  b.status = 'CANCELLED';
  b.cancellationReason = reason || 'Hủy theo yêu cầu khách hàng';
  if (b.payment) b.payment.cancelSyncPending = true;
  updateRefund(b);
  audit(b, 'BOOKING_CANCELLED', actor, now, b.cancellationReason);
}

export function confirmRefundState(b: IBooking, actor: string, reference: string, now = Date.now()) {
  if (!b.refund || b.refund.status !== 'PENDING') throw new BookingError(409, 'Đơn không có khoản chờ hoàn tiền.');
  if (reference.trim().length < 4 || reference.length > 150) throw new BookingError(400, 'Nhập mã giao dịch hoàn tiền thực tế (4–150 ký tự).');
  b.refund = { ...b.refund, status: 'REFUNDED', refundedAmount: b.refund.amount, reference: reference.trim(), confirmedAt: new Date(now).toISOString(), confirmedBy: actor };
  if (b.status === 'CANCELLED') b.paymentStatus = 'REFUNDED';
  audit(b, 'REFUND_CONFIRMED_MANUALLY', actor, now, reference.trim());
}
