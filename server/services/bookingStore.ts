import mongoose from 'mongoose';
import { db } from '../models/db.js';
import { DonDatSanModel, IDonDatSan } from '../models/mongoose.models.js';
import { IBooking, BookingStatus, PaymentStatus, FieldType } from '../types/index.js';

/*
 * Lưu đơn đặt sân vào MongoDB (collection `don_dat_san`).
 * `db.bookings` vẫn là bản sao trong bộ nhớ để các controller đọc nhanh;
 * khi khởi động sẽ nạp từ MongoDB, mỗi lần tạo / sửa đơn sẽ ghi xuống MongoDB.
 */

type DonDatSanDoc = IDonDatSan & { ngay_tao?: Date | string; ngay_cap_nhat?: Date | string };

const STATUS_TO_DB: Record<BookingStatus, IDonDatSan['trang_thai_don']> = {
  PENDING: 'CHO_DUYET',
  CONFIRMED: 'DA_XAC_NHAN',
  CANCELLED: 'DA_HUY',
  COMPLETED: 'HOAN_THANH'
};

const PAYMENT_STATUS_TO_DB: Record<PaymentStatus, IDonDatSan['trang_thai_thanh_toan']> = {
  UNPAID: 'CHUA_THANH_TOAN',
  PAID: 'DA_THANH_TOAN',
  REFUNDED: 'HOAN_TIEN'
};

const invert = <K extends string, V extends string>(obj: Record<K, V>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k])) as Record<V, K>;

const STATUS_FROM_DB = invert(STATUS_TO_DB);
const PAYMENT_STATUS_FROM_DB = invert(PAYMENT_STATUS_TO_DB);

const isConnected = () => mongoose.connection.readyState === 1;

const toIso = (val: Date | string | undefined, fallback: string) =>
  val ? new Date(val).toISOString() : fallback;

export const toBookingDoc = (b: IBooking): DonDatSanDoc => ({
  ma_don_dat: b.id,
  ma_khach_hang: b.userId,
  ten_khach_hang: b.userName || 'Khách hàng',
  so_dien_thoai: b.userPhone,
  email: b.userEmail,
  ma_cum_san: b.venueId,
  ten_cum_san: b.venueName || '',
  dia_chi_san: b.venueAddress,
  ma_san_con: b.fieldId,
  ten_san_con: b.fieldName || '',
  loai_san: b.fieldType || '',
  ngay_dat: b.bookingDate,
  gio_bat_dau: b.startTime,
  gio_ket_thuc: b.endTime,
  thoi_luong_gio: b.durationHours,
  tong_tien: b.totalPrice,
  trang_thai_don: STATUS_TO_DB[b.status],
  trang_thai_thanh_toan: PAYMENT_STATUS_TO_DB[b.paymentStatus],
  phuong_thuc_thanh_toan: !b.paymentMethod || b.paymentMethod === 'CASH' ? 'TIEN_MAT' : b.paymentMethod,
  ghi_chu: b.note,
  ly_do_huy: b.cancellationReason,
  ngay_tao: new Date(b.createdAt),
  ngay_cap_nhat: new Date(b.updatedAt)
});

export const fromBookingDoc = (doc: DonDatSanDoc): IBooking => {
  const createdAt = toIso(doc.ngay_tao, new Date().toISOString());
  const method = doc.phuong_thuc_thanh_toan as string;
  return {
    id: doc.ma_don_dat,
    userId: doc.ma_khach_hang,
    userName: doc.ten_khach_hang,
    userPhone: doc.so_dien_thoai,
    userEmail: doc.email,
    venueId: doc.ma_cum_san,
    venueName: doc.ten_cum_san,
    venueAddress: doc.dia_chi_san,
    fieldId: doc.ma_san_con,
    fieldName: doc.ten_san_con,
    fieldType: (doc.loai_san || undefined) as FieldType | undefined,
    bookingDate: doc.ngay_dat,
    startTime: doc.gio_bat_dau,
    endTime: doc.gio_ket_thuc,
    durationHours: doc.thoi_luong_gio,
    totalPrice: doc.tong_tien,
    status: STATUS_FROM_DB[doc.trang_thai_don] || 'PENDING',
    paymentStatus: PAYMENT_STATUS_FROM_DB[doc.trang_thai_thanh_toan] || 'UNPAID',
    paymentMethod: method === 'TIEN_MAT' || method === 'CASH' ? 'CASH' : (method as IBooking['paymentMethod']),
    note: doc.ghi_chu,
    cancellationReason: doc.ly_do_huy,
    createdAt,
    updatedAt: toIso(doc.ngay_cap_nhat, createdAt)
  };
};

// Ghi (thêm mới hoặc cập nhật) một đơn xuống MongoDB. Lỗi chỉ ghi log, không làm hỏng request.
export async function persistBooking(booking: IBooking): Promise<void> {
  if (!isConnected()) return;
  try {
    await DonDatSanModel.updateOne(
      { ma_don_dat: booking.id },
      { $set: toBookingDoc(booking) },
      { upsert: true, timestamps: false }
    );
  } catch (error) {
    console.error(`⚠️ Khong luu duoc don dat san ${booking.id} vao MongoDB:`, error);
  }
}

// Nạp đơn đặt sân từ MongoDB vào bộ nhớ khi khởi động server.
export async function loadBookingsFromMongo(): Promise<void> {
  if (!isConnected()) return;
  try {
    const docs = await DonDatSanModel.find().lean<DonDatSanDoc[]>();
    if (docs.length === 0) {
      await Promise.all(db.bookings.map(persistBooking));
      console.log(`📦 Collection 'don_dat_san' trong, da dua ${db.bookings.length} don mau len MongoDB.`);
      return;
    }
    db.bookings = docs.map(fromBookingDoc);
    console.log(`📦 Da nap ${docs.length} don dat san tu MongoDB.`);
  } catch (error) {
    console.error('⚠️ Khong nap duoc don dat san tu MongoDB, dung du lieu trong bo nho:', error);
  }
}
