import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { CheckCircle2, Clock, QrCode, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import type { IBooking } from '../../types/index.js';

export const bookingLabels = { PENDING: 'Chờ thanh toán', CONFIRMED: 'Đã xác nhận', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy' };
export const paymentLabel = (b: IBooking) => b.refund?.status === 'PENDING' ? 'Chờ hoàn tiền'
  : b.paymentStatus === 'REFUNDED' ? 'Đã hoàn tiền' : b.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán';
const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export const PaymentTicket: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState('');
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const requestedQr = useRef(false);

  const accept = useCallback((data: { data: IBooking; serverTime?: string }) => {
    setBooking(data.data);
    if (data.serverTime) setOffset(Date.parse(data.serverTime) - Date.now());
  }, []);

  const createQr = useCallback(async () => {
    setBusy(true); setError('');
    try { const res = await api.post(`/bookings/${encodeURIComponent(bookingId)}/payment`); accept(res.data); }
    catch (e: any) { setError(e.response?.data?.message || 'Chưa tạo được mã QR. Bạn có thể thử lại trên đơn này.'); }
    finally { setBusy(false); }
  }, [bookingId, accept]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const res = await api.get(`/bookings/${encodeURIComponent(bookingId)}/payment`);
        if (!cancelled) {
          accept(res.data);
          setError(res.data.reconciliationPending ? 'Đang chờ kết nối ngân hàng. Chưa nhận được xác nhận mới; không chuyển lại tiền nếu bạn đã thanh toán.' : '');
        }
      } catch { if (!cancelled) setError('Chưa cập nhật được trạng thái. Kiểm tra kết nối; không chuyển lại tiền nếu bạn đã thanh toán.'); }
      if (!cancelled) timer = setTimeout(poll, 5000);
    };
    void poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [bookingId, accept]);

  useEffect(() => {
    if (booking?.status === 'PENDING' && booking.payment && !booking.payment.linkId && !requestedQr.current && Date.parse(booking.payment.expiresAt) > Date.now() + offset) {
      requestedQr.current = true;
      void createQr();
    }
  }, [booking, createQr, offset]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let cancelled = false;
    setQr('');
    if (booking?.payment?.qrCode) QRCode.toDataURL(booking.payment.qrCode, { width: 280, margin: 2, errorCorrectionLevel: 'M' })
      .then(url => { if (!cancelled) setQr(url); }).catch(() => { if (!cancelled) setError('Không hiển thị được mã QR. Hãy mở trang thanh toán payOS.'); });
    return () => { cancelled = true; };
  }, [booking?.payment?.qrCode]);

  if (!booking) return <div className="max-w-xl mx-auto p-8 text-center" role="status">{error || 'Đang tải thông tin thanh toán…'}</div>;
  const payment = booking.payment;
  const remaining = payment ? Math.max(0, Math.ceil((Date.parse(payment.expiresAt) - now - offset) / 1000)) : 0;
  const pending = booking.status === 'PENDING' && booking.paymentStatus === 'UNPAID';
  const paid = booking.status === 'COMPLETED' && booking.paymentStatus === 'PAID';
  const received = payment?.receipts.reduce((sum, r) => sum + r.amount, 0) || 0;
  const checkoutUrl = payment?.checkoutUrl?.startsWith('https://pay.payos.vn/') ? payment.checkoutUrl : undefined;
  return <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
      <header className="bg-slate-950 px-6 py-7 sm:px-8 text-white">
        <p className="text-[10px] uppercase tracking-[.2em] font-bold text-lime-300">Football Connect • Thanh toán sân</p>
        <div className="flex gap-3 items-center mt-3">
          {paid ? <CheckCircle2 className="text-lime-300 w-8 h-8" /> : pending ? <Clock className="text-amber-300 w-8 h-8" /> : <XCircle className="text-rose-300 w-8 h-8" />}
          <div><h1 className="text-2xl font-black">{bookingLabels[booking.status]}</h1><p className="text-xs text-slate-400 mt-1 break-all">Mã đặt sân: {booking.id}</p></div>
        </div>
      </header>
      <div className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap justify-between gap-3 pb-5 border-b border-slate-100">
          <div><h2 className="font-bold text-slate-900">{booking.venueName} · {booking.fieldName}</h2><p className="text-sm text-slate-500 mt-1">{booking.bookingDate.split('-').reverse().join('/')} · {booking.startTime} – {booking.endTime}</p></div>
          <strong className="text-2xl text-emerald-700">{money(booking.totalPrice)}</strong>
        </div>
        {error && <p role="alert" className="text-sm rounded-xl p-3 bg-amber-50 text-amber-900">{error}</p>}
        {pending && remaining > 0 && <>
          <div className="flex justify-between items-center rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div><p className="font-bold text-amber-900">Thời gian giữ chỗ còn lại</p><p className="text-xs text-amber-800 mt-1">Hết hạn, đơn chưa trả đủ tiền sẽ tự hủy.</p></div>
            <strong className="text-2xl tabular-nums text-amber-950">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</strong>
          </div>
          {received > 0 ? <p className="text-sm text-amber-900">Đã nhận {money(received)}. Còn thiếu {money(Math.max(0, booking.totalPrice - received))}. Liên hệ chủ sân để đối soát trước khi chuyển thêm.</p> : null}
          {payment?.linkId ? <div className="grid sm:grid-cols-2 gap-6 items-center">
            <div className="text-center">{qr && <img src={qr} width={280} height={280} alt="Mã QR thanh toán đúng đơn đặt sân" className="mx-auto w-full max-w-[280px]" />}<p className="text-xs text-slate-500">Quét bằng ứng dụng ngân hàng</p></div>
            <div className="text-sm space-y-3">
              <p className="font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> Chuyển trực tiếp cho chủ sân</p>
              <dl className="space-y-3 break-words"><div><dt className="text-xs text-slate-500">Tên người nhận</dt><dd className="font-semibold">{payment.accountName || 'Xem trên trang payOS'}</dd></div><div><dt className="text-xs text-slate-500">Số tài khoản • mã ngân hàng {payment.bankBin}</dt><dd className="font-mono font-semibold">{payment.accountNumber || 'Xem trên trang payOS'}</dd></div><div><dt className="text-xs text-slate-500">Nội dung chuyển khoản</dt><dd className="font-mono font-semibold">{payment.description || `FC${payment.orderCode}`}</dd></div></dl>
              {checkoutUrl && <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl bg-emerald-600 text-white font-bold px-4 py-3">Mở thanh toán payOS</a>}
              <p className="text-xs text-slate-500">Trạng thái tự cập nhật khi ngân hàng xác nhận. Không cần gửi ảnh biên lai.</p>
            </div>
          </div> : <button onClick={createQr} disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-4 font-bold disabled:opacity-50"><QrCode className="w-5 h-5" />{busy ? 'Đang tạo mã QR…' : 'Hiển thị mã QR thanh toán'}</button>}
        </>}
        {pending && remaining === 0 && <p className="rounded-xl p-4 bg-amber-50 text-amber-900">Đã hết thời gian giữ chỗ. Đang cập nhật trạng thái hủy; vui lòng không chuyển tiền theo mã cũ.</p>}
        {paid && <p role="status" className="rounded-xl p-4 bg-emerald-50 text-emerald-900">Đã xác nhận thanh toán. Lịch sân của bạn đã được ghi nhận và cổng chủ sân hiển thị “Đã hoàn thành”.</p>}
        {booking.status === 'CANCELLED' && <p className="rounded-xl p-4 bg-rose-50 text-rose-900">{booking.cancellationReason || 'Đơn đã hủy.'} Không chuyển tiền theo mã QR của đơn này.</p>}
        {payment?.exception && <p role="alert" className="text-sm text-amber-800">{payment.exception}</p>}
        {booking.refund && <p className="rounded-xl p-4 bg-slate-50 text-sm"><strong>{booking.refund.status === 'PENDING' ? 'Chờ chủ sân hoàn tiền' : 'Chủ sân đã xác nhận hoàn tiền'}</strong> · {money(booking.refund.status === 'PENDING' ? booking.refund.amount - (booking.refund.refundedAmount || 0) : booking.refund.amount)}{booking.refund.reference && <span className="block mt-1">Mã giao dịch: {booking.refund.reference}</span>}</p>}
        <div className="text-xs text-slate-500 space-y-2 border-t border-slate-100 pt-4">
          {payment && <p>Có thể liên hệ chủ sân để hủy và hoàn tiền trước <strong>{new Date(payment.cancelBefore).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</strong> (giờ Việt Nam). Hoàn tiền do chủ sân thực hiện sau khi hai bên xác nhận.</p>}
          {booking.ownerPhone && <a className="inline-block font-bold text-emerald-700" href={`tel:${booking.ownerPhone}`}>Liên hệ chủ sân: {booking.ownerPhone}</a>}
        </div>
        <div className="flex flex-wrap gap-3"><Link to="/bookings" className="rounded-xl bg-slate-950 text-white px-4 py-3 text-sm font-bold">Lịch đặt của tôi</Link>{booking.status === 'CANCELLED' && <Link to={`/venues/${booking.venueId}`} className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold">Chọn ca sân khác</Link>}<span className="text-xs text-slate-400 self-center inline-flex gap-1 items-center"><RefreshCw className="w-3 h-3" /> Tự cập nhật mỗi 5 giây</span></div>
      </div>
    </div>
  </div>;
};
