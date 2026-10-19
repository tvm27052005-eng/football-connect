import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Check,
  QrCode,
  Smartphone,
  Lock,
  Copy
} from 'lucide-react';
import { api } from '../services/api.js';
import { IVenue, IField, ITimeSlot } from '../types/index.js';
import { TimeSlotMatrix } from '../components/booking/TimeSlotMatrix.js';
import { formatBookingDate } from '../components/booking/BookingCard.js';
import { useAuthStore } from '../stores/auth.store.js';

type OnlinePaymentMethod = 'BANK_TRANSFER' | 'MOMO' | 'VNPAY';

export const BookingCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const preVenueId = searchParams.get('venueId');
  const preFieldId = searchParams.get('fieldId');
  const preDate = searchParams.get('date');
  const preStart = searchParams.get('start');
  const preEnd = searchParams.get('end');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper for quick future dates
  const getQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const [venues, setVenues] = useState<IVenue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(preVenueId || '');
  const [fields, setFields] = useState<IField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(preFieldId || '');
  const [bookingDate, setBookingDate] = useState<string>(preDate || todayStr);
  const [slots, setSlots] = useState<ITimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<OnlinePaymentMethod>('BANK_TRANSFER');
  const [note, setNote] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

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
        setSelectedSlot(null);
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

    const now = new Date();
    const slotDateTime = new Date(`${bookingDate}T${selectedSlot.startTime}:00`);
    if (isNaN(slotDateTime.getTime()) || slotDateTime <= now) {
      setErrorMsg('Không thể đặt sân vì ngày hoặc khung giờ thi đấu này đã trôi qua rồi! Vui lòng chọn khung giờ khác.');
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
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể tạo đơn đặt sân. Vui lòng thử lại!';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);
  const selectedField = fields.find((f) => f.id === selectedFieldId);

  // Success Screen with automated QR payment ticket
  if (successBookingId) {
    const transferMemo = `FC ${successBookingId.toUpperCase()}`;
    const qrUrl = selectedSlot
      ? `https://api.vietqr.io/image/970422-0988889999-compact.png?amount=${selectedSlot.price}&addInfo=${encodeURIComponent(
        transferMemo
      )}&accountName=FOOTBALL%20CONNECT`
      : '';

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-3xl shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> Đã Khóa Khung Giờ Thành Công
            </span>
            <h2 className="text-2xl font-black text-slate-900">Giữ Chỗ Sân Bóng Thành Công!</h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Mã đặt chỗ của bạn là <strong className="text-emerald-700 font-mono text-sm">#{successBookingId}</strong>. Khung giờ này đã được giữ độc quyền cho đội bóng của bạn.
            </p>
          </div>

          {/* Ticket Specs */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Cụm sân:</span>
              <span className="font-bold text-slate-900">{selectedVenue?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Sân con:</span>
              <span className="font-bold text-slate-900">{selectedField?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Ngày đá:</span>
              <span className="font-bold text-emerald-700">{formatBookingDate(bookingDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Khung giờ:</span>
              <span className="font-bold text-emerald-700">{selectedSlot?.startTime} - {selectedSlot?.endTime}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-2.5">
              <span className="text-slate-500 font-medium">Tổng tiền thanh toán:</span>
              <span className="font-extrabold text-emerald-700 text-base">{selectedSlot?.price.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* QR Code Transfer Info Box */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200 rounded-2xl p-5 space-y-4 text-center">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" /> Quét Mã VietQR Hoàn Tất Thanh Toán
              </h4>
              <p className="text-[11px] text-slate-500">
                Sử dụng App Ngân hàng hoặc MoMo quét mã QR bên dưới để thanh toán tiền sân
              </p>
            </div>

            {qrUrl && (
              <div className="flex justify-center">
                <div className="p-2 bg-white rounded-2xl border border-emerald-200 shadow-xs inline-block">
                  <img
                    src={qrUrl}
                    alt="VietQR Payment"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="bg-white/90 p-3 rounded-xl border border-emerald-200 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Nội dung chuyển khoản (bắt buộc):</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(transferMemo);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="font-mono font-bold text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {transferMemo}
                  <Copy className="w-3 h-3 text-emerald-600" />
                  {copiedCode && <span className="text-[10px] text-emerald-600 font-normal">Đã sao chép!</span>}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                <span className="font-semibold text-slate-800">MB Bank (Quân Đội)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/bookings"
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs text-center cursor-pointer"
            >
              Xem Lịch Đặt Sân Của Tôi
            </Link>
            <Link
              to="/"
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border border-slate-200 text-center cursor-pointer"
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
          Hệ thống xác thực chống double-booking và bảo vệ lịch đá tức thì trên toàn hệ sinh thái Football Connect.
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
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${selectedVenueId === v.id
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
                    {f.name} ({f.fieldType === '5_vs_5' ? 'Sân 5 người' : 'Sân 7 người'} - {f.pricePerHour.toLocaleString('vi-VN')} đ/h)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600">Ngày thi đấu</label>
                <span className="text-[11px] font-bold text-emerald-700">
                  {formatBookingDate(bookingDate)}
                </span>
              </div>
              <input
                type="date"
                min={todayStr}
                value={bookingDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val < todayStr) {
                    setErrorMsg('Không thể chọn ngày trong quá khứ!');
                    return;
                  }
                  setErrorMsg('');
                  setBookingDate(val);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold cursor-pointer"
              />

              {/* Quick Date Pills */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-400 font-medium">Chọn nhanh:</span>
                {[
                  { label: 'Hôm nay', val: todayStr },
                  { label: 'Ngày mai', val: getQuickDate(1) },
                  { label: 'Ngày kia', val: getQuickDate(2) }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setBookingDate(item.val);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${bookingDate === item.val
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Slot Matrix Selection */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              Chọn Khung Giờ Thi Đấu
            </h2>
            {selectedSlot && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Đã chọn {selectedSlot.startTime} - {selectedSlot.endTime}
              </span>
            )}
          </div>

          <TimeSlotMatrix
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            isLoading={isLoadingSlots}
            date={bookingDate}
          />
        </div>

        {/* Step 4: Payment & Note (100% Online Payment - Anti-Boom Booking) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">4</span>
              Phương Thức Thanh Toán Trực Tuyến
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Bảo đảm giữ sân 100%
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Hệ thống áp dụng thanh toán trực tuyến để bảo đảm giữ sân độc quyền và chống bùng sân. Khung giờ sẽ được khóa ngay cho bạn.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bank Transfer / VietQR */}
            <label
              className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${paymentMethod === 'BANK_TRANSFER'
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
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Quét mã VietQR</div>
                <div className="text-[10px] text-slate-500">Tất cả ngân hàng</div>
              </div>
            </label>
          </div>
        </div>

        {/* Live Booking Summary Review Box */}
        {selectedVenue && selectedField && selectedSlot && (
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-500/60 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    Kiểm Tra - Đối Chiếu Lịch Trình Đặt Sân
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hãy kiểm tra chính xác ngày và khung giờ bên dưới trước khi hoàn tất đặt sân
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                Đã chọn khung giờ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-emerald-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Sân - Địa điểm</span>
                <span className="font-extrabold text-slate-900 block mt-0.5">Tên sân: {selectedVenue.name}</span>
                <span className="text-emerald-700 font-bold block text-[11px]">Sân: {selectedField.name}</span>
                <span className="text-[10px] text-slate-500 truncate block">Địa chỉ: {selectedVenue.address}</span>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-3 pt-2 sm:pt-0">
                <span className="text-slate-400 block text-[10px] font-bold">Ngày thi đấu</span>
                <span className="font-black text-emerald-800 text-sm block mt-0.5">
                  {formatBookingDate(bookingDate)}
                </span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {bookingDate === todayStr ? 'Trận đấu hôm nay' : 'Lịch thi đấu sắp tới'}
                </span>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-3 pt-2 sm:pt-0">
                <span className="text-slate-400 block text-[10px] font-bold">Thời gian thi đấu</span>
                <span className="font-black text-emerald-700 text-base flex items-center gap-1 mt-0.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="text-xs text-slate-500">Tổng thanh toán dự kiến:</div>
            <div className="text-2xl font-black text-emerald-700">
              {selectedSlot ? `${selectedSlot.price.toLocaleString('vi-VN')} đ` : '0 đ'}
            </div>
            {selectedSlot && (
              <div className="text-[11px] text-slate-400">
                Thanh toán trực tuyến (VietQR) - Bảo đảm giữ sân 100%
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedSlot}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {isSubmitting ? 'Đang Xử Lý Đặt Sân...' : 'Xác Nhận & Thanh Toán Giữ Chỗ'}
          </button>
        </div>
      </form>
    </div>
  );
};
