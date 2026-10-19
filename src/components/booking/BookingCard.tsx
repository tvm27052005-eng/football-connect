import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Star,
  Sparkles
} from 'lucide-react';
import { IBooking } from '../../types/index.js';
import { Badge } from '../common/Badge.js';

interface BookingCardProps {
  booking: IBooking;
  onCancel?: (booking: IBooking) => void;
  onReview?: (booking: IBooking) => void;
}

export const formatBookingDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month - 1, day);
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[dateObj.getDay()] || '';
  const dStr = String(day).padStart(2, '0');
  const mStr = String(month).padStart(2, '0');
  return `${dayName}, ${dStr}/${mStr}/${year}`;
};

export const formatBookingCreationTime = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancel,
  onReview
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = booking.bookingDate === todayStr;
  const isUpcoming = booking.bookingDate >= todayStr;

  const statusBadge = {
    CONFIRMED: { variant: 'emerald' as const, label: 'Đã xác nhận', icon: CheckCircle2 },
    PENDING: { variant: 'amber' as const, label: 'Chờ duyệt', icon: AlertCircle },
    CANCELLED: { variant: 'rose' as const, label: 'Đã hủy', icon: XCircle },
    COMPLETED: { variant: 'blue' as const, label: 'Hoàn thành', icon: CheckCircle2 }
  }[booking.status];

  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md space-y-4 transition-all ${isToday && booking.status === 'CONFIRMED'
        ? 'border-emerald-500/70 ring-1 ring-emerald-500/20'
        : 'border-slate-200/90 hover:border-slate-300'
        }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isToday && booking.status !== 'CANCELLED' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 animate-pulse">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Hôm nay đá
              </span>
            ) : isUpcoming && booking.status !== 'CANCELLED' ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Sắp diễn ra
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                Đã kết thúc
              </span>
            )}
            {booking.createdAt && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Clock className="w-3 h-3 text-emerald-600" />
                Thời gian đặt: {formatBookingCreationTime(booking.createdAt)}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">{booking.venueName}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {booking.venueAddress}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusBadge.variant} size="sm">
            <statusBadge.icon className="w-3.5 h-3.5 mr-1" />
            {statusBadge.label}
          </Badge>
        </div>
      </div>

      {/* Booking Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px] font-medium">Sân - Loại sân</span>
          <span className="font-bold text-slate-800">{booking.fieldName}</span>
          <span className="text-[10px] text-emerald-700 font-semibold block uppercase">
            {booking.fieldType === '5_vs_5' ? 'Sân 5 người' : 'Sân 7 người'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px] font-medium">Ngày đá</span>
          <span className="font-bold text-slate-900 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{formatBookingDate(booking.bookingDate)}</span>
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px] font-medium">Khung giờ ca đá</span>
          <span className="font-bold text-emerald-700 flex items-center gap-1 text-sm">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{booking.startTime} - {booking.endTime}</span>
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px] font-medium">Tổng tiền</span>
          <span className="font-extrabold text-slate-900 text-sm">
            {booking.totalPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-[11px] text-slate-500 font-medium">
          Trạng thái:{' '}
          <span className={booking.paymentStatus === 'PAID' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
            {booking.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : ' Đã hủy'}
          </span>
          {booking.createdAt && (
            <span className="text-slate-500 text-[11px] ml-2 font-medium">
              • Đặt lúc: <strong className="text-slate-800">{formatBookingCreationTime(booking.createdAt)}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
            <button
              onClick={() => onCancel && onCancel(booking)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            >
              Hủy đặt sân
            </button>
          ) : null}

          {(booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') && !booking.hasReviewed && (
            <button
              onClick={() => onReview && onReview(booking)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Đánh giá sân
            </button>
          )}

          <Link
            to={`/venues/${booking.venueId}`}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 transition-colors"
          >
            Xem sân
          </Link>
        </div>
      </div>
    </div>
  );
};
