import { PayOS } from '@payos/node';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { db } from '../models/db.js';
import { BookingError } from './booking-payment.state.js';

type Channel = { clientId: string; apiKey: string; checksumKey: string };

const secretKey = () => createHash('sha256')
  .update(process.env.PAYOS_CREDENTIAL_SECRET || process.env.JWT_SECRET || 'football-connect-payos-secret')
  .digest();

export function encryptPayOSSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptPayOSSecret(value: string): string {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new BookingError(503, 'Thông tin kết nối payOS không hợp lệ.');
  try {
    const decipher = createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    throw new BookingError(503, 'Không thể giải mã thông tin kết nối payOS.');
  }
}

function channels(): Record<string, Channel> {
  try {
    const configured = JSON.parse(process.env.PAYOS_CHANNELS_JSON || '{}');
    if (!configured || typeof configured !== 'object' || Array.isArray(configured)) throw Error();
    return configured;
  } catch { throw new BookingError(503, 'Cấu hình kênh thanh toán chưa hợp lệ.'); }
}

export function paymentChannelForOwner(ownerId: string): string {
  getPayOS(ownerId); // Fail closed before reserving a slot if no verified receiver exists.
  return ownerId;
}

export function getPayOS(channelId: string): PayOS {
  const owner = db.users.find(user => user.id === channelId);
  if (owner?.payos) {
    return new PayOS({
      clientId: owner.payos.clientId,
      apiKey: decryptPayOSSecret(owner.payos.apiKeyEncrypted),
      checksumKey: decryptPayOSSecret(owner.payos.checksumKeyEncrypted),
      timeout: 10_000,
      maxRetries: 0
    });
  }
  const config = channels()[channelId];
  if (!config || ![config.clientId, config.apiKey, config.checksumKey].every(v => typeof v === 'string' && v.trim())) {
    throw new BookingError(503, 'Chủ sân chưa kết nối thanh toán tự động. Vui lòng liên hệ chủ sân hoặc chọn sân khác.');
  }
  return new PayOS({ ...config, timeout: 10_000, maxRetries: 0 });
}

export function ownerPaymentSummary(ownerId: string) {
  const owner = db.users.find(user => user.id === ownerId);
  if (!owner?.payos) return { connected: false };
  return {
    connected: true,
    accountNumber: owner.payos.accountNumber,
    accountName: owner.payos.accountName,
    bankBin: owner.payos.bankBin,
    connectedAt: owner.payos.connectedAt
  };
}

export function paymentAppUrl() {
  try {
    const url = new URL(process.env.APP_URL || '');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error();
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw Error();
    return url.origin;
  } catch { throw new BookingError(503, 'Chưa cấu hình địa chỉ website thanh toán.'); }
}

export function paymentPolicy() {
  const minutes = Number(process.env.PAYMENT_HOLD_MINUTES || 15);
  const hours = Number(process.env.BOOKING_CANCEL_BEFORE_HOURS || 2);
  return {
    holdMinutes: Number.isFinite(minutes) && minutes >= 1 && minutes <= 60 ? minutes : 15,
    cancelBeforeHours: Number.isFinite(hours) && hours >= 1 && hours <= 72 ? hours : 2
  };
}

/** payOS bank timestamps without an offset are Vietnam local time. */
export function bankTimestamp(value: string): string {
  const normalized = value.replace(' ', 'T');
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}+07:00`;
  const time = Date.parse(withZone);
  if (!Number.isFinite(time)) throw new BookingError(400, 'Thời điểm thanh toán không hợp lệ.');
  return new Date(time).toISOString();
}
