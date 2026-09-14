import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Banknote,
  AlertCircle,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api.js';
import { IVenue, IField, ITimeSlot } from '../types/index.js';
import { TimeSlotMatrix } from '../components/booking/TimeSlotMatrix.js';
import { useAuthStore } from '../stores/auth.store.js';

export const BookingCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const preVenueId = searchParams.get('venueId');
  const preFieldId = searchParams.get('fieldId');
  const preDate = searchParams.get('date');
  const preStart = searchParams.get('start');
  const preEnd = searchParams.get('end');

  const [venues, setVenues] = useState<IVenue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(preVenueId || '');
  const [fields, setFields] = useState<IField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(preFieldId || '');
  const [bookingDate, setBookingDate] = useState<string>(preDate || new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<ITimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [note, setNote] = useState('');

  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  // Load all venues
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const res = await api.get('/venues');
        setVenues(res.data.data);
        if (!selectedVenueId && res.data.data.length > 0) {
          setSelectedVenueId(res.data.data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingVenues(false);
      }
    };
    loadVenues();
  }, []);

  // Load fields of selected venue
  useEffect(() => {
    if (!selectedVenueId) return;
    const loadFields = async () => {
      try {
        const res = await api.get(`/fields?venueId=${selectedVenueId}`);
        setFields(res.data.data);
        if (res.data.data.length > 0) {
          const matchField = res.data.data.find((f: IField) => f.id === preFieldId) || res.data.data[0];
          setSelectedFieldId(matchField.id);
        } else {
          setSelectedFieldId('');
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadFields();
  }, [selectedVenueId, preFieldId]);

  // Load slots for selected field and date
  useEffect(() => {
    if (!selectedFieldId || !bookingDate) return;
    const loadSlots = async () => {
      try {
        setIsLoadingSlots(true);
        const res = await api.get(`/fields/${selectedFieldId}/availability?date=${bookingDate}`);
        const availableSlots: ITimeSlot[] = res.data.data.slots;
        setSlots(availableSlots);

        if (preStart && preEnd) {
          const matched = availableSlots.find(
            (s) => s.startTime === preStart && s.endTime === preEnd && s.status === 'AVAILABLE'
          );
          if (matched) setSelectedSlot(matched);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    loadSlots();
  }, [selectedFieldId, bookingDate, preStart, preEnd]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedVenueId || !selectedFieldId || !selectedSlot) {
      setErrorMsg('Vui lòng chọn đầy đủ Sân bóng, Sân con và Khung giờ đá!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await api.post('/bookings', {
        venueId: selectedVenueId,
        fieldId: selectedFieldId,
        bookingDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        paymentMethod,
        note
      });

      setSuccessBookingId(res.data.data.id);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể tạo đơn đặt sân. Vui lòng thử lại!';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);
  const selectedField = fields.find((f) => f.id === selectedFieldId);

  if (successBookingId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 space-y-6 shadow-xs animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-3xl shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">Đặt Sân Thành Công!</h2>
            <p className="text-xs text-slate-500 mt-2">
              Mã đặt chỗ của bạn là <strong className="text-emerald-700 font-mono text-sm">#{successBookingId}</strong>. Chúng tôi đã gửi thông báo xác nhận tới tài khoản của bạn.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Cụm sân:</span>
              <span className="font-bold text-slate-900">{selectedVenue?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sân con:</span>
              <span className="font-bold text-slate-900">{selectedField?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thời gian đá:</span>
              <span className="font-bold text-emerald-700">{bookingDate} ({selectedSlot?.startTime} - {selectedSlot?.endTime})</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Tổng tiền:</span>
              <span className="font-extrabold text-emerald-700 text-sm">{selectedSlot?.price.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/bookings"
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs"
            >
              Xem Lịch Đặt Sân Của Tôi
            </Link>
            <Link
              to="/"
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border border-slate-200"
            >
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link to="/venues" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách sân
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Đặt Lịch Sân Bóng Nhanh
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống xác thực chống double-booking tức thì trên toàn hệ sinh thái Football Connect.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        {/* Step 1: Venue Selection */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Chọn Cụm Sân Bóng
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {venues.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVenueId(v.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedVenueId === v.id
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">{v.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">{v.address}</div>
                <div className="text-[10px] text-emerald-700 mt-1 font-bold">
                  Giá từ {v.priceRange.min.toLocaleString('vi-VN')} đ/h
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Child Field & Date Selection */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            Chọn Sân Con & Ngày Đá
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Sân con trực thuộc</label>
              <select
                value={selectedFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.fieldType === '5_vs_5' ? 'Sân 5' : f.fieldType === '7_vs_7' ? 'Sân 7' : 'Sân 11'} - {f.pricePerHour.toLocaleString('vi-VN')} đ/h)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Ngày đá</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Slot Matrix Selection */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">3</span>
            Chọn Ca Khung Giờ (90 Phút)
          </h2>

          <TimeSlotMatrix
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            isLoading={isLoadingSlots}
          />
        </div>

        {/* Step 4: Payment & Note */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">4</span>
            Phương Thức Thanh Toán & Ghi Chú
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'CASH'}
                onChange={() => setPaymentMethod('CASH')}
                className="hidden"
              />
              <Banknote className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-slate-900">Thanh toán tại sân</div>
                <div className="text-[11px] text-slate-500">Trả tiền mặt trực tiếp cho quản lý sân</div>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                paymentMethod === 'BANK_TRANSFER'
                  ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'BANK_TRANSFER'}
                onChange={() => setPaymentMethod('BANK_TRANSFER')}
                className="hidden"
              />
              <CreditCard className="w-5 h-5 text-sky-600" />
              <div>
                <div className="text-xs font-bold text-slate-900">Chuyển khoản QR / MoMo</div>
                <div className="text-[11px] text-slate-500">Quét mã QR thanh toán nhanh</div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú thêm cho chủ sân</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Cần thuê thêm 2 bộ áo pitch, 1 quả bóng số 5..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="text-xs text-slate-500">Tổng thanh toán dự kiến:</div>
            <div className="text-2xl font-black text-emerald-700">
              {selectedSlot ? `${selectedSlot.price.toLocaleString('vi-VN')} đ` : '0 đ'}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedSlot}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {isSubmitting ? 'Đang Xử Lý Đặt Sân...' : 'Xác Nhận Đặt Sân Ngay'}
          </button>
        </div>
      </form>
    </div>
  );
};
