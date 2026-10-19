import React from 'react';
import { Clock, Check, Ban } from 'lucide-react';
import { ITimeSlot } from '../../types/index.js';

interface TimeSlotMatrixProps {
  slots: ITimeSlot[];
  selectedSlot: ITimeSlot | null;
  onSelectSlot: (slot: ITimeSlot) => void;
  isLoading?: boolean;
  date?: string;
}

export const TimeSlotMatrix: React.FC<TimeSlotMatrixProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading = false,
  date
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-500">
        Không có khung giờ nào khả dụng trong ngày này.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-2 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Còn trống
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Đã có người đặt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Đã qua giờ / Tạm khóa
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;

          const isPast = (() => {
            if (!date) return false;
            const slotDateTime = new Date(`${date}T${slot.startTime}:00`);
            return !isNaN(slotDateTime.getTime()) && slotDateTime <= new Date();
          })();

          const isAvailable = slot.status === 'AVAILABLE' && !isPast;

          return (
            <button
              key={`${slot.startTime}-${slot.endTime}`}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelectSlot(slot)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                !isAvailable
                  ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/40 font-bold shadow-md scale-[1.02]'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-500/60 hover:bg-slate-50 cursor-pointer shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-tight">
                  {slot.startTime} - {slot.endTime}
                </span>
                {isSelected ? (
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                ) : !isAvailable ? (
                  <Ban className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className={isSelected ? 'text-emerald-100' : 'text-slate-500'}>
                  {isPast ? 'Đã qua giờ' : slot.status === 'AVAILABLE' ? 'Còn trống' : slot.status === 'BOOKED' ? 'Đã đặt' : 'Đã khóa'}
                </span>
                <span className={`font-bold ${isSelected ? 'text-white' : 'text-emerald-700'}`}>
                  {slot.price.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
