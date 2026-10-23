import { randomInt } from 'node:crypto';
import { db } from '../models/db.js';
import type { IBooking } from '../types/index.js';
import { applyReceipt, audit, BookingError, expireBooking, matchStart } from './booking-payment.state.js';
import { bankTimestamp, getPayOS, paymentAppUrl, paymentChannelForOwner, paymentPolicy } from './payos.service.js';

// The application's database cache has one writer (one Node process). All booking
// writes share this queue, including expiry, webhook, creation and owner actions.
let writeQueue: Promise<unknown> = Promise.resolve();
export function withBookingLock<T>(work: () => Promise<T>): Promise<T> {
  const task = writeQueue.then(work);
  writeQueue = task.catch(() => undefined);
  return task;
}

export function bookingCopy(id: string) {
  const booking = db.bookings.find(b => b.id === id);
  if (!booking) throw new BookingError(404, 'Không tìm thấy đơn đặt sân.');
  return structuredClone(booking);
}

export function preparePayment(booking: IBooking, ownerId: string) {
  const channelId = paymentChannelForOwner(ownerId);
  paymentAppUrl();
  const policy = paymentPolicy();
  booking.payment = {
    provider: 'PAYOS', channelId,
    orderCode: randomInt(1_000_000_000, 281_474_976_710_655),
    expiresAt: new Date(Math.min(Date.now() + policy.holdMinutes * 60_000, matchStart(booking))).toISOString(),
    cancelBefore: new Date(matchStart(booking) - policy.cancelBeforeHours * 3_600_000).toISOString(),
    receipts: []
  };
  audit(booking, 'PAYMENT_PENDING', booking.userId, Date.now());
}

export async function expirePendingBookings() {
  const overdue = db.bookings.filter(b => b.status === 'PENDING' && b.payment?.linkId &&
    Date.parse(b.payment.expiresAt) <= Date.now());
  // Render may wake after a bank transfer but before its webhook was delivered.
  // Reconcile the provider first so a timely payment is not released as unpaid.
  const checked = await Promise.allSettled(overdue.map(b => reconcilePayment(b.id, true)));
  const unresolved = new Set(overdue.filter((b, index) => checked[index].status === 'rejected' ||
    (checked[index].status === 'fulfilled' && checked[index].value?.status === 'PAID' &&
      db.bookings.find(current => current.id === b.id)?.status === 'PENDING')).map(b => b.id));
  return withBookingLock(async () => {
    for (const existing of db.bookings) {
      // A provider outage or a paid order missing transaction detail requires
      // manual/retry reconciliation before we release a possibly paid slot.
      if (unresolved.has(existing.id)) continue;
      const booking = structuredClone(existing);
      if (expireBooking(booking)) await db.syncBooking(booking);
    }
  });
}

/** Called only after a booking is durably stored. Reuses its order code on retry. */
export async function ensurePaymentLink(id: string) {
  return withBookingLock(async () => {
    const booking = bookingCopy(id);
    if (expireBooking(booking)) await db.syncBooking(booking);
    const payment = booking.payment;
    if (!payment || booking.status !== 'PENDING' || payment.linkId) return booking;
    const appUrl = paymentAppUrl();
    const client = getPayOS(payment.channelId);
    let result;
    try { result = await client.paymentRequests.create({
      orderCode: payment.orderCode, amount: booking.totalPrice,
      description: `FC${payment.orderCode}`,
      returnUrl: `${appUrl}/booking/create?bookingId=${encodeURIComponent(id)}`,
      cancelUrl: `${appUrl}/booking/create?bookingId=${encodeURIComponent(id)}`,
      expiredAt: Math.floor(Date.parse(payment.expiresAt) / 1000)
    }); } catch (creationError) {
      // Recover a successful remote creation whose response/local save was lost.
      // Do not issue a new order code and risk collecting two payments.
      let existing;
      try { existing = await client.paymentRequests.get(payment.orderCode); }
      catch { throw creationError; }
      if (existing.orderCode !== payment.orderCode || existing.amount !== booking.totalPrice || !/^[a-zA-Z0-9-]{1,100}$/.test(existing.id)) throw creationError;
      payment.linkId = existing.id;
      payment.checkoutUrl = `https://pay.payos.vn/web/${existing.id}`;
      if (existing.status === 'CANCELLED' || existing.status === 'EXPIRED' || existing.status === 'FAILED') payment.expiresAt = new Date().toISOString();
      expireBooking(booking);
      await db.syncBooking(booking);
      return booking;
    }
    if (result.orderCode !== payment.orderCode || result.amount !== booking.totalPrice || result.currency !== 'VND') {
      throw new BookingError(502, 'Thông tin thanh toán trả về không khớp đơn đặt sân.');
    }
    Object.assign(payment, {
      linkId: result.paymentLinkId, qrCode: result.qrCode, checkoutUrl: result.checkoutUrl,
      accountName: result.accountName, accountNumber: result.accountNumber, bankBin: result.bin, description: result.description
    });
    // External calls can cross the deadline; do not display a QR for an expired hold.
    expireBooking(booking);
    await db.syncBooking(booking);
    return booking;
  });
}

export async function receivePayment(channelId: string, data: {
  orderCode: number; paymentLinkId: string; amount: number; reference: string;
  transactionDateTime: string; currency: string; accountNumber: string; code: string;
}) {
  return withBookingLock(async () => {
    const existing = db.bookings.find(b => b.payment?.orderCode === data.orderCode && b.payment.channelId === channelId);
    // Unknown/signed sample events are acknowledged without changing any booking.
    if (!existing || data.code !== '00') return;
    const booking = structuredClone(existing);
    const payment = booking.payment!;
    const reused = db.bookings.some(b => b.id !== booking.id && b.payment?.channelId === channelId && b.payment.receipts.some(r => r.reference === data.reference));
    if (reused) throw new BookingError(409, 'Giao dịch đã được ghi nhận cho đơn khác.');
    if (data.currency !== 'VND' || (payment.linkId && payment.linkId !== data.paymentLinkId) ||
        (payment.accountNumber && payment.accountNumber !== data.accountNumber)) {
      throw new BookingError(400, 'Thông tin người nhận hoặc đơn thanh toán không khớp.');
    }
    // An event can arrive after creation succeeded remotely but before local save.
    if (!payment.linkId) {
      const verified = await getPayOS(channelId).paymentRequests.get(payment.orderCode);
      if (verified.id !== data.paymentLinkId || verified.orderCode !== payment.orderCode || verified.amount !== booking.totalPrice) {
        throw new BookingError(400, 'Giao dịch không khớp đơn đặt sân.');
      }
      payment.linkId = data.paymentLinkId;
      payment.accountNumber = data.accountNumber;
    }
    if (applyReceipt(booking, { reference: data.reference, amount: data.amount, paidAt: bankTimestamp(data.transactionDateTime) })) {
      await db.syncBooking(booking);
    }
  });
}

const lastChecked = new Map<string, number>();
/** Server-to-server reconciliation also recovers missed webhooks. */
export async function reconcilePayment(id: string, force = false) {
  const current = db.bookings.find(b => b.id === id);
  const elapsed = Date.now() - (lastChecked.get(id) || 0);
  // A payOS return requests one prompt refresh. Normal background checks use 30s.
  if (!current?.payment || (!force && elapsed < 30_000)) return;
  const payment = current.payment;
  const result = await getPayOS(payment.channelId).paymentRequests.get(payment.orderCode);
  if (result.orderCode !== payment.orderCode || result.amount !== current.totalPrice || (payment.linkId && result.id !== payment.linkId)) {
    throw new BookingError(502, 'Không đối soát được giao dịch thanh toán.');
  }
  for (const transaction of result.transactions || []) {
    await receivePayment(payment.channelId, {
      ...transaction, orderCode: payment.orderCode, paymentLinkId: result.id, currency: 'VND', code: '00'
    });
  }
  if (result.status === 'CANCELLED' || result.status === 'EXPIRED' || result.status === 'FAILED') {
    await withBookingLock(async () => {
      const booking = bookingCopy(id);
      if (booking.status === 'PENDING') {
        // Force expiry of a payment cancelled at the provider, releasing its hold.
        booking.payment!.expiresAt = new Date().toISOString();
        expireBooking(booking);
        await db.syncBooking(booking);
      }
    });
  }
  lastChecked.set(id, Date.now());
  return result;
}

export async function syncCancelledPayment(id: string) {
  const current = db.bookings.find(b => b.id === id);
  if (!current?.payment?.cancelSyncPending) return;
  const payment = current.payment;
  // Reconcile first so a transfer racing with cancellation is recorded for refund.
  const result = await reconcilePayment(id, true);
  if (result && !['PAID', 'CANCELLED', 'EXPIRED', 'FAILED'].includes(result.status)) {
    await getPayOS(payment.channelId).paymentRequests.cancel(payment.orderCode, current.cancellationReason || 'Hủy giữ chỗ');
  }
  await withBookingLock(async () => {
    const booking = bookingCopy(id);
    booking.payment!.cancelSyncPending = false;
    await db.syncBooking(booking);
  });
}

export function startPaymentWorker() {
  let running = false;
  const tick = async () => {
    if (running || !db.isMongoConnected) return;
    running = true;
    try {
      await expirePendingBookings();
      for (const booking of [...db.bookings]) {
        try {
          if (booking.payment?.cancelSyncPending) await syncCancelledPayment(booking.id);
          else if (booking.payment && booking.status === 'PENDING') await reconcilePayment(booking.id);
        } catch { console.warn('Payment reconciliation pending for booking', booking.id); }
      }
    } catch { console.error('Payment expiry worker failed; will retry.'); }
    finally { running = false; }
  };
  void tick();
  const timer = setInterval(() => void tick(), 10_000);
  timer.unref();
  return () => clearInterval(timer);
}
