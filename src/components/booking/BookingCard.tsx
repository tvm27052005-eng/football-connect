import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, AlertCircle, CheckCircle2, XCircle, Star } from 'lucide-react';
import { IBooking } from '../../types/index.js';
import { Badge } from '../common/Badge.js';

interface BookingCardProps {
  booking: IBooking;
  onCancel?: (id: string) => void;
  onReview?: (booking: IBooking) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancel,
  onReview
}) => {
  const statusBadge = {
    CONFIRMED: { variant: 'emerald' as const, label: 'Đã xác nhận', icon: CheckCircle2 },
    PENDING: { variant: 'amber' as const, label: 'Chờ duyệt', icon: AlertCircle },
    CANCELLED: { variant: 'rose' as const, label: 'Đã hủy', icon: XCircle },
    COMPLETED: { variant: 'blue' as const, label: 'Hoàn thành', icon: CheckCircle2 }
  }[booking.status];

  return (
    <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md space-y-4 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-mono text-slate-400 font-medium">Mã đơn: #{booking.id}</span>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">{booking.venueName}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" /> {booking.venueAddress}
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
          <span className="text-slate-500 block text-[11px] font-medium">Sân & Loại sân</span>
          <span className="font-bold text-slate-800">{booking.fieldName}</span>
          <span className="text-[10px] text-emerald-700 font-semibold block uppercase">
            {booking.fieldType === '5_vs_5' ? 'Sân 5' : booking.fieldType === '7_vs_7' ? 'Sân 7' : 'Sân 11'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px] font-medium">Ngày đá</span>
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px] font-medium">Khung giờ</span>
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            {booking.startTime} - {booking.endTime}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px] font-medium">Tổng tiền</span>
          <span className="font-extrabold text-emerald-700 text-sm">
            {booking.totalPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-[11px] text-slate-500 font-medium">
          Trạng thái thanh toán:{' '}
          <span className={booking.paymentStatus === 'PAID' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
            {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Thanh toán tại sân'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
            <button
              onClick={() => onCancel && onCancel(booking.id)}
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
