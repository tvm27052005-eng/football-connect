import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { db } from '../models/db.js';
import type { IBooking } from '../types/index.js';
import { generateAccessToken } from '../utils/jwt.js';
import { applyReceipt, cancelBookingState, confirmRefundState, expireBooking } from '../services/booking-payment.state.js';
import { expirePendingBookings, syncCancelledPayment } from '../services/booking-payment.service.js';
import { bankTimestamp } from '../services/payos.service.js';

const now = Date.parse('2030-01-01T09:00:00+07:00');
function booking(): IBooking {
  return { id: 'test-booking', userId: 'customer', venueId: 'venue', fieldId: 'field',
    bookingDate: '2030-01-02', startTime: '18:00', endTime: '19:30', durationHours: 1.5,
    totalPrice: 300000, status: 'PENDING', paymentStatus: 'UNPAID', createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
    payment: { provider: 'PAYOS', channelId: 'owner', orderCode: 123456789, linkId: 'link-test',
      expiresAt: new Date(now + 15 * 60000).toISOString(), cancelBefore: '2030-01-02T09:00:00.000Z', receipts: [] } };
}
const receipt = (amount = 300000, reference = 'bank-ref-1') => ({ reference, amount, paidAt: new Date(now + 1000).toISOString() });

test('Vietnam bank timestamps do not depend on server timezone', () => {
  assert.equal(bankTimestamp('2030-01-01 09:00:00'), '2030-01-01T02:00:00.000Z');
  assert.equal(bankTimestamp('2030-01-01T02:00:00Z'), '2030-01-01T02:00:00.000Z');
});
test('only a receipt completes a booking; duplicate webhook has no side effects', () => {
  const b = booking();
  assert.equal(applyReceipt(b, receipt(), now + 1000), true);
  assert.equal(b.status, 'COMPLETED'); assert.equal(b.paymentStatus, 'PAID');
  assert.equal(applyReceipt(b, receipt(), now + 2000), false);
  assert.equal(b.payment!.receipts.length, 1);
  assert.throws(() => applyReceipt(b, receipt(1), now + 2000), /dữ liệu khác/);
});
test('expiry at the exact boundary releases unpaid bookings but never paid bookings', () => {
  const b = booking();
  assert.equal(expireBooking(b, now + 15 * 60000 - 1), false);
  assert.equal(expireBooking(b, now + 15 * 60000), true);
  assert.equal(b.status, 'CANCELLED');
  assert.equal(expireBooking(b, now + 16 * 60000), false);
  const paid = booking(); applyReceipt(paid, receipt(), now + 1000);
  assert.equal(expireBooking(paid, now + 16 * 60000), false);
});
test('late confirmation never revives a released slot and tracks refund instead', () => {
  const b = booking();
  applyReceipt(b, receipt(), now + 16 * 60000);
  assert.equal(b.status, 'CANCELLED'); assert.equal(b.paymentStatus, 'PAID');
  assert.equal(b.refund?.status, 'PENDING'); assert.equal(b.refund?.amount, 300000);
});
test('partial payment holds until expiry, overpayment completes with excess refund', () => {
  const partial = booking(); applyReceipt(partial, receipt(100000), now + 1000);
  assert.equal(partial.status, 'PENDING');
  expireBooking(partial, now + 16 * 60000);
  assert.equal(partial.refund?.amount, 100000);
  const excess = booking(); applyReceipt(excess, receipt(310000), now + 1000);
  assert.equal(excess.status, 'COMPLETED'); assert.equal(excess.refund?.amount, 10000);
  confirmRefundState(excess, 'owner', 'bank-refund-1', now + 2000);
  assert.equal(excess.paymentStatus, 'PAID');
});
test('paid customer contacts owner; owner cutoff and actual refund confirmation are enforced', () => {
  const b = booking(); applyReceipt(b, receipt(), now + 1000);
  assert.throws(() => cancelBookingState(b, 'customer', false, '', now + 2000), /liên hệ chủ sân/);
  assert.throws(() => cancelBookingState(b, 'owner', true, '', Date.parse(b.payment!.cancelBefore)), /quá hạn/);
  cancelBookingState(b, 'owner', true, 'Khách đã liên hệ', now + 3000);
  assert.equal(b.status, 'CANCELLED'); assert.equal(b.paymentStatus, 'PAID');
  assert.equal(b.refund?.status, 'PENDING');
  assert.throws(() => confirmRefundState(b, 'owner', '', now + 4000), /mã giao dịch/);
  confirmRefundState(b, 'owner', 'bank-refund-2', now + 5000);
  assert.equal(b.paymentStatus, 'REFUNDED');
  assert.equal(b.refund?.confirmedBy, 'owner');
  assert.equal(applyReceipt(b, receipt(), now + 6000), false);
  assert.equal(b.paymentStatus, 'REFUNDED');
});
test('invalid and negative amounts cannot complete bookings', () => {
  for (const amount of [0, -1, 0.5, Number.NaN]) assert.throws(() => applyReceipt(booking(), receipt(amount), now + 1000));
});

function signature(data: Record<string, unknown>, secret = 'test-checksum-owner') {
  // Independent implementation of payOS canonical signing for these fixtures.
  const value = (v: any) => Array.isArray(v) ? JSON.stringify(v.map(o => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]])))) : v == null ? '' : String(v);
  return createHmac('sha256', secret).update(Object.keys(data).sort().map(k => `${k}=${value(data[k])}`).join('&')).digest('hex');
}

test('HTTP booking/payment workflow with isolated durable repository and signed provider fixtures', async t => {
  const original = { users: db.users, venues: db.venues, fields: db.fields, bookings: db.bookings, mongo: db.isMongoConnected, sync: db.syncBooking, syncUser: db.syncUser };
  const env = { channels: process.env.PAYOS_CHANNELS_JSON, url: process.env.APP_URL };
  process.env.PAYOS_CHANNELS_JSON = JSON.stringify({ owner: { clientId: 'client-owner', apiKey: 'test-key-owner', checksumKey: 'test-checksum-owner' }, other: { clientId: 'client-other', apiKey: 'test-key-other', checksumKey: 'test-checksum-other' } });
  process.env.APP_URL = 'http://localhost:3000';
  db.users = ['customer', 'owner', 'other'].map((id, i) => ({ ...original.users[0], id, name: id, email: `${id}@example.test`, role: i ? 'OWNER' : 'USER', isActive: true }));
  db.venues = [{ ...original.venues[0], id: 'venue', name: 'Sân kiểm thử', ownerId: 'owner', status: 'ACTIVE' }];
  db.fields = [{ ...original.fields[0], id: 'field', venueId: 'venue', name: 'Sân 7', fieldType: '7_vs_7', status: 'ACTIVE', timeSlots: [{ startTime: '18:00', endTime: '19:30', price: 300000, isActive: true }] }];
  db.bookings = []; db.isMongoConnected = true;
  const persisted = new Map<string, IBooking>();
  let failSave = false;
  db.syncBooking = async b => {
    if (failSave) throw Error('simulated database outage');
    const saved = structuredClone(b); persisted.set(b.id, saved);
    db.bookings = [...db.bookings.filter(x => x.id !== b.id), structuredClone(saved)];
  };
  db.syncUser = async user => {
    db.users = [...db.users.filter(item => item.id !== user.id), structuredClone(user)];
  };
  const realFetch = globalThis.fetch;
  let providerCreates = 0;
  let providerUnavailable = false;
  const remote = new Map<number, any>();
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith('https://api-merchant.payos.vn/')) return realFetch(input, init);
    if (providerUnavailable) return Response.json({ code: '99', desc: 'test unavailable' }, { status: 503 });
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    let data;
    if (url.endsWith('/confirm-webhook')) {
      assert.equal(new Headers(init?.headers).get('x-client-id'), 'client-owner');
      assert.equal(body.webhookUrl, `${base}/payments/payos/webhook/owner`);
      data = { webhookUrl: body.webhookUrl, accountNumber: 'test-account', accountName: 'TEST OWNER', name: 'Test channel', shortName: 'TEST' };
    } else if (url.endsWith('/v2/payment-requests')) {
      providerCreates++;
      assert.equal(new Headers(init?.headers).get('x-client-id'), 'client-owner');
      assert.equal(body.amount, 300000); assert.ok(body.expiredAt > Date.now() / 1000);
      data = { bin: '970452', accountName: 'TEST OWNER', accountNumber: 'test-account', amount: body.amount,
        description: body.description, orderCode: body.orderCode, currency: 'VND', paymentLinkId: `link-${body.orderCode}`,
        status: 'PENDING', checkoutUrl: `https://pay.payos.vn/web/link-${body.orderCode}`, qrCode: 'test-payload-not-for-payment' };
      remote.set(body.orderCode, { id: data.paymentLinkId, orderCode: body.orderCode, amount: body.amount, amountPaid: 0, amountRemaining: body.amount, status: 'PENDING', createdAt: new Date().toISOString(), transactions: [], cancellationReason: null, canceledAt: null });
    } else {
      const code = Number(url.match(/payment-requests\/(\d+)/)?.[1]);
      data = remote.get(code);
      if (!data) return Response.json({ code: '404', desc: 'not found' }, { status: 404 });
      if (url.endsWith('/cancel')) data = { ...data, status: 'CANCELLED' };
    }
    return Response.json({ code: '00', desc: 'success', data, signature: signature(data) });
  };
  const app = createApp(); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const request = async (path: string, method = 'GET', body?: unknown, actor = 'customer') => {
    const user = db.users.find(u => u.id === actor);
    const result = await realFetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${generateAccessToken(user)}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: result.status, body: await result.json() as any };
  };
  const input = { venueId: 'venue', fieldId: 'field', bookingDate: '2099-01-02', startTime: '18:00', endTime: '19:30', paymentMethod: 'BANK_TRANSFER', totalPrice: 1, paymentStatus: 'PAID' };
  let id = '';
  const event = (b: IBooking, reference = 'http-bank-ref', amount = b.totalPrice) => ({ orderCode: b.payment!.orderCode, paymentLinkId: b.payment!.linkId!, amount, reference, transactionDateTime: new Date().toISOString(), currency: 'VND', accountNumber: 'test-account', code: '00' });
  const webhook = (data: ReturnType<typeof event>, channel = 'owner', sig = signature(data)) => request(`/payments/payos/webhook/${channel}`, 'POST', { code: '00', success: true, data, signature: sig }, 'anonymous');
  try {
    await t.test('owner connection validates the payment channel via webhook without payout access', async () => {
      process.env.APP_URL = base.replace(/\/api$/, '');
      const connected = await request('/payments/owner/config', 'PUT', {
        clientId: 'client-owner', apiKey: 'test-key-owner', checksumKey: 'test-checksum-owner', bankBin: '970452'
      }, 'owner');
      assert.equal(connected.status, 200);
      assert.equal(connected.body.data.connected, true);
      assert.equal(connected.body.data.accountNumber, 'test-account');
      assert.equal(db.users.find(user => user.id === 'owner')?.payos?.accountName, 'TEST OWNER');

      providerUnavailable = true;
      const rejected = await request('/payments/owner/config', 'PUT', {
        clientId: 'client-owner', apiKey: 'wrong-key', checksumKey: 'wrong-checksum'
      }, 'owner');
      assert.equal(rejected.status, 502);
      assert.equal(db.users.find(user => user.id === 'owner')?.payos?.accountName, 'TEST OWNER');
      providerUnavailable = false;
    });

    await t.test('concurrent creates reserve one slot, ignore client price/payment claims', async () => {
      const results = await Promise.all([request('/bookings', 'POST', input), request('/bookings', 'POST', input)]);
      assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
      const created = results.find(r => r.status === 201)!.body.data; id = created.id;
      assert.equal(created.status, 'PENDING'); assert.equal(created.paymentStatus, 'UNPAID'); assert.equal(created.totalPrice, 300000);
      assert.equal(created.payment.channelId, 'owner'); assert.equal(persisted.size, 1);
    });
    await t.test('QR uses owner channel and existing order; repeated request reuses link', async () => {
      assert.equal((await request(`/bookings/${id}/payment`, 'POST')).status, 200);
      assert.equal((await request(`/bookings/${id}/payment`, 'POST')).status, 200);
      assert.equal(providerCreates, 1);
      assert.equal(db.bookings[0].payment!.accountName, 'TEST OWNER');
    });
    await t.test('authentication, other-owner access, manual PAID and fake return params cannot pay', async () => {
      assert.equal((await request(`/bookings/${id}`, 'GET', undefined, 'anonymous')).status, 401);
      assert.equal((await request(`/bookings/${id}/payment`, 'POST', {}, 'other')).status, 403);
      assert.equal((await request(`/bookings/${id}/status`, 'PUT', { status: 'COMPLETED', paymentStatus: 'PAID' }, 'owner')).status, 400);
      await request(`/bookings/${id}?status=PAID&code=00`);
      assert.equal(db.bookings[0].paymentStatus, 'UNPAID');
    });
    await t.test('forged signature, wrong recipient and wrong channel cannot complete booking', async () => {
      const data = event(db.bookings[0]);
      assert.equal((await webhook(data, 'owner', 'fake')).status, 401);
      const wrong = { ...data, accountNumber: 'wrong-account' };
      assert.equal((await webhook(wrong)).status, 400);
      assert.equal((await webhook(data, 'other', signature(data, 'test-checksum-other'))).status, 200);
      assert.equal(db.bookings[0].paymentStatus, 'UNPAID');
    });
    await t.test('database failure returns retryable error without changing live state', async () => {
      failSave = true;
      assert.equal((await webhook(event(db.bookings[0]))).status, 503);
      assert.equal(db.bookings[0].paymentStatus, 'UNPAID'); failSave = false;
    });
    await t.test('signed payment is idempotent across simulated restart and retains occupied slot', async () => {
      const data = event(db.bookings[0]);
      assert.equal((await webhook(data)).status, 200);
      db.bookings = [...persisted.values()].map(b => structuredClone(b));
      assert.equal((await webhook(data)).status, 200);
      assert.equal(db.bookings[0].status, 'COMPLETED'); assert.equal(db.bookings[0].payment!.receipts.length, 1);
      const availability = await request('/fields/field/availability?date=2099-01-02');
      assert.equal(availability.body.data.slots[0].status, 'BOOKED');
      assert.equal((await request('/bookings', 'POST', input)).status, 409);
    });
    await t.test('owner cancel and recorded refund require permissions and bank reference', async () => {
      assert.equal((await request(`/bookings/${id}/cancel`, 'PUT', {})).status, 400);
      assert.equal((await request(`/bookings/${id}/cancel`, 'PUT', {}, 'other')).status, 403);
      assert.equal((await request(`/bookings/${id}/cancel`, 'PUT', { reason: 'Khách yêu cầu hủy' }, 'owner')).status, 200);
      assert.equal(db.bookings[0].refund?.status, 'PENDING'); assert.equal(db.bookings[0].paymentStatus, 'PAID');
      assert.equal((await request(`/bookings/${id}/refund`, 'POST', { reference: 'refund-test' })).status, 403);
      assert.equal((await request(`/bookings/${id}/refund`, 'POST', {}, 'owner')).status, 400);
      assert.equal((await request(`/bookings/${id}/refund`, 'POST', { reference: 'refund-test' }, 'owner')).status, 200);
      assert.equal(db.bookings[0].paymentStatus, 'REFUNDED');
      assert.equal((await request(`/bookings/${id}/status`, 'PUT', { status: 'CONFIRMED' }, 'owner')).status, 400);
    });
    await t.test('expiry survives reload, releases slot and late payment stays cancelled', async () => {
      const res = await request('/bookings', 'POST', input); assert.equal(res.status, 201);
      id = res.body.data.id; await request(`/bookings/${id}/payment`, 'POST');
      const b = structuredClone(db.bookings.find(b => b.id === id)!);
      b.payment!.expiresAt = new Date(Date.now() - 1).toISOString(); await db.syncBooking(b);
      db.bookings = [...persisted.values()].map(b => structuredClone(b));
      await expirePendingBookings();
      assert.equal(db.bookings.find(b => b.id === id)!.status, 'CANCELLED');
      assert.equal((await request('/fields/field/availability?date=2099-01-02')).body.data.slots[0].status, 'AVAILABLE');
      await webhook(event(b, 'late-bank-ref'));
      const cancelled = db.bookings.find(b => b.id === id)!;
      assert.equal(cancelled.status, 'CANCELLED'); assert.equal(cancelled.refund?.status, 'PENDING');
      await syncCancelledPayment(id);
      assert.equal(db.bookings.find(b => b.id === id)!.payment?.cancelSyncPending, false);
    });
    await t.test('reconciliation recovers a missed webhook using signed provider response', async () => {
      const res = await request('/bookings', 'POST', input); id = res.body.data.id;
      await request(`/bookings/${id}/payment`, 'POST');
      const b = db.bookings.find(b => b.id === id)!;
      const remoteOrder = remote.get(b.payment!.orderCode);
      remoteOrder.transactions = [{ reference: 'reconciled-bank-ref', amount: b.totalPrice, accountNumber: 'test-account', description: 'FC', transactionDateTime: new Date().toISOString() }];
      remoteOrder.status = 'PAID'; remoteOrder.amountPaid = b.totalPrice; remoteOrder.amountRemaining = 0;
      const refreshed = await request('/bookings?refresh=1');
      assert.equal(refreshed.status, 200);
      assert.equal(refreshed.body.data.find((booking: IBooking) => booking.id === id)?.status, 'COMPLETED');
      assert.equal(db.bookings.find(b => b.id === id)!.status, 'COMPLETED');
    });
    await t.test('unconfigured owner and field/venue mismatch fail before creating any hold', async () => {
      assert.equal((await request('/bookings', 'POST', { ...input, venueId: 'wrong' })).status, 404);
      db.venues[0].ownerId = 'unconfigured';
      const count = db.bookings.length;
      assert.equal((await request('/bookings', 'POST', { ...input, bookingDate: '2099-01-03' })).status, 503);
      assert.equal(db.bookings.length, count); db.venues[0].ownerId = 'owner';
    });
    await t.test('provider outage preserves one unpaid booking for retry', async () => {
      const res = await request('/bookings', 'POST', { ...input, bookingDate: '2099-01-03' }); id = res.body.data.id;
      providerUnavailable = true;
      assert.equal((await request(`/bookings/${id}/payment`, 'POST')).status, 503);
      assert.equal(db.bookings.find(b => b.id === id)!.paymentStatus, 'UNPAID');
      providerUnavailable = false;
      assert.equal((await request(`/bookings/${id}/payment`, 'POST')).status, 200);
    });
  } finally {
    globalThis.fetch = realFetch; db.users = original.users; db.venues = original.venues; db.fields = original.fields;
    db.bookings = original.bookings; db.isMongoConnected = original.mongo; db.syncBooking = original.sync; db.syncUser = original.syncUser;
    if (env.channels === undefined) delete process.env.PAYOS_CHANNELS_JSON; else process.env.PAYOS_CHANNELS_JSON = env.channels;
    if (env.url === undefined) delete process.env.APP_URL; else process.env.APP_URL = env.url;
    server.close(); await once(server, 'close');
  }
});
