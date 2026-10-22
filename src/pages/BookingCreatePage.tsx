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
  Copy,
  MapPin,
  Building2,
  WalletCards,
  ChevronRight
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
    <div className="max-w-[1440px] mx-auto px-8 py-8">
      <div className="flex items-end justify-between gap-8 mb-7">
        <div>
          <Link to="/venues" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 mb-3 font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách sân
          </Link>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Đặt lịch sân bóng</h1>
          <p className="text-sm text-slate-500 mt-2">Chọn sân, thời gian và kiểm tra lại lịch trước khi thanh toán giữ chỗ.</p>
        </div>
        <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm min-w-[520px]">
          {[
            { label: 'Chọn sân', done: Boolean(selectedVenueId), icon: Building2 },
            { label: 'Chọn lịch', done: Boolean(selectedSlot), icon: Calendar },
            { label: 'Thanh toán', done: false, icon: WalletCards }
          ].map((step, index) => (
            <React.Fragment key={step.label}>
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? 'bg-emerald-600 text-white' : index === (selectedSlot ? 2 : selectedVenueId ? 1 : 0) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {step.done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </span>
                <span className={`text-xs font-bold ${step.done || index === (selectedSlot ? 2 : selectedVenueId ? 1 : 0) ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
              </div>
              {index < 2 && <div className={`h-px flex-1 mx-4 ${step.done ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="grid grid-cols-[minmax(0,1fr)_370px] gap-6 items-start">
        <div className="space-y-5">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-black">1</span><h2 className="text-base font-black text-slate-900">Chọn cụm sân</h2></div>
                <p className="text-xs text-slate-500 mt-1.5 ml-9">Chọn địa điểm thuận tiện nhất cho đội của bạn.</p>
              </div>
              <span className="text-[11px] font-bold text-slate-500">{venues.length} cụm sân khả dụng</span>
            </div>

            {isLoadingVenues ? (
              <div className="grid grid-cols-2 gap-3"><div className="h-24 rounded-xl bg-slate-100 animate-pulse" /><div className="h-24 rounded-xl bg-slate-100 animate-pulse" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {venues.map((venue) => {
                  const active = selectedVenueId === venue.id;
                  return (
                    <button key={venue.id} type="button" onClick={() => setSelectedVenueId(venue.id)} className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer ${active ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/15' : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'}`}>
                      {active && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
                      <div className="flex items-start gap-3 pr-6">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}><MapPin className="w-4 h-4" /></span>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-slate-900 truncate">{venue.name}</div>
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-4">{venue.address}</div>
                          <div className="text-[11px] text-emerald-700 mt-2 font-black">Từ {venue.priceRange.min.toLocaleString('vi-VN')} đ/giờ</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5"><span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-black">2</span><div><h2 className="text-base font-black text-slate-900">Chọn sân và ngày thi đấu</h2><p className="text-xs text-slate-500 mt-1">Lịch trống sẽ tự cập nhật theo lựa chọn của bạn.</p></div></div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sân con</label>
                <select value={selectedFieldId} onChange={(e) => setSelectedFieldId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 font-semibold">
                  {fields.map((field) => <option key={field.id} value={field.id}>{field.name} · {field.fieldType === '5_vs_5' ? 'Sân 5' : 'Sân 7'} · {field.pricePerHour.toLocaleString('vi-VN')} đ/h</option>)}
                </select>
                {selectedField && <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-[11px] text-slate-600 flex items-center justify-between"><span>Loại sân</span><strong className="text-slate-900">{selectedField.fieldType === '5_vs_5' ? 'Sân 5 người' : 'Sân 7 người'}</strong></div>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ngày thi đấu</label><span className="text-[11px] font-bold text-emerald-700">{formatBookingDate(bookingDate)}</span></div>
                <input type="date" min={todayStr} value={bookingDate} onChange={(e) => { const val = e.target.value; if (val < todayStr) { setErrorMsg('Không thể chọn ngày trong quá khứ!'); return; } setErrorMsg(''); setBookingDate(val); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 font-semibold cursor-pointer" />
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[{ label: 'Hôm nay', val: todayStr }, { label: 'Ngày mai', val: getQuickDate(1) }, { label: 'Ngày kia', val: getQuickDate(2) }].map((item) => (
                    <button key={item.label} type="button" onClick={() => { setErrorMsg(''); setBookingDate(item.val); }} className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${bookingDate === item.val ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>{item.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-black">3</span><div><h2 className="text-base font-black text-slate-900">Chọn khung giờ</h2><p className="text-xs text-slate-500 mt-1">Nhấp vào một khung giờ còn trống để chọn.</p></div></div>
              {selectedSlot && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1.5"><Check className="w-3 h-3" /> {selectedSlot.startTime}–{selectedSlot.endTime}</span>}
            </div>
            <TimeSlotMatrix slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} isLoading={isLoadingSlots} date={bookingDate} />
          </section>
        </div>

        <aside className="sticky top-24 space-y-4">
          <div className="bg-slate-950 text-white rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300 font-black">Tóm tắt đặt sân</p><h2 className="text-lg font-black mt-1">Lịch của bạn</h2></div><span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-emerald-300" /></span></div>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="flex gap-3"><MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><div><span className="text-slate-400 block text-[10px] uppercase font-bold">Địa điểm</span><strong className="block text-white mt-1">{selectedVenue?.name || 'Chưa chọn cụm sân'}</strong><span className="text-[11px] text-slate-400 line-clamp-2 mt-1">{selectedVenue?.address || 'Chọn một cụm sân ở bước 1'}</span></div></div>
              <div className="h-px bg-white/10" />
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Sân con</span><strong className="block text-white mt-1">{selectedField?.name || 'Chưa chọn'}</strong></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Ngày đá</span><strong className="block text-white mt-1">{formatBookingDate(bookingDate)}</strong></div>
              </div>
              <div className="rounded-xl bg-white/[0.07] border border-white/10 p-4 flex items-center justify-between">
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Khung giờ</span><strong className="text-base block mt-1">{selectedSlot ? `${selectedSlot.startTime} – ${selectedSlot.endTime}` : 'Chưa chọn giờ'}</strong></div><Clock className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="bg-white/[0.06] border-t border-white/10 p-5">
              <div className="flex items-end justify-between"><span className="text-xs text-slate-400">Tổng thanh toán</span><strong className="text-2xl text-emerald-300">{selectedSlot ? `${selectedSlot.price.toLocaleString('vi-VN')} đ` : '0 đ'}</strong></div>
              <label className="mt-4 p-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 flex items-center gap-3 cursor-pointer">
                <input type="radio" name="payment" checked={paymentMethod === 'BANK_TRANSFER'} onChange={() => setPaymentMethod('BANK_TRANSFER')} className="hidden" />
                <span className="w-9 h-9 rounded-lg bg-emerald-400/15 text-emerald-300 flex items-center justify-center"><QrCode className="w-5 h-5" /></span>
                <span><strong className="block text-xs">Thanh toán VietQR</strong><span className="text-[10px] text-slate-400">Bảo đảm giữ sân 100%</span></span><Check className="w-4 h-4 text-emerald-300 ml-auto" />
              </label>
              <button type="submit" disabled={isSubmitting || !selectedSlot} className="mt-4 w-full px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                {isSubmitting ? 'Đang xử lý đặt sân...' : selectedSlot ? <>Xác nhận & thanh toán <ChevronRight className="w-4 h-4" /></> : 'Chọn khung giờ để tiếp tục'}
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3" /> Khung giờ được khóa ngay sau khi xác nhận</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <label className="text-[11px] font-bold text-slate-700 block mb-2">Ghi chú cho chủ sân <span className="font-normal text-slate-400">(không bắt buộc)</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Ví dụ: Chuẩn bị bóng, nước uống..." className="w-full resize-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-emerald-500" />
          </div>
        </aside>
      </form>
    </div>
  );
};
