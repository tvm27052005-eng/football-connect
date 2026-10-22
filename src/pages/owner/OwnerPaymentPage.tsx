import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, QrCode, ShieldCheck, Unplug } from 'lucide-react';
import { api } from '../../services/api.js';
import { OwnerSidebar } from '../../components/layout/OwnerSidebar.js';

type PaymentConfig = {
  connected: boolean;
  accountNumber?: string;
  accountName?: string;
  bankBin?: string;
  connectedAt?: string;
};

export const OwnerPaymentPage: React.FC = () => {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [form, setForm] = useState({ clientId: '', apiKey: '', checksumKey: '', bankBin: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadConfig = async () => {
    try {
      const response = await api.get('/payments/owner/config');
      setConfig(response.data.data);
    } catch {
      setError('Không tải được cấu hình thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadConfig(); }, []);

  const qrUrl = useMemo(() => {
    if (!config?.connected || !config.bankBin || !config.accountNumber) return '';
    return `https://img.vietqr.io/image/${encodeURIComponent(config.bankBin)}-${encodeURIComponent(config.accountNumber)}-compact2.png?accountName=${encodeURIComponent(config.accountName || '')}&addInfo=Thanh%20toan%20san%20Football%20Connect`;
  }, [config]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await api.put('/payments/owner/config', form);
      setConfig(response.data.data);
      setForm({ clientId: '', apiKey: '', checksumKey: '', bankBin: '' });
      setMessage(response.data.message);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Không thể kết nối payOS.');
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Ngắt kết nối payOS sẽ khiến khách không thể tạo QR đặt sân mới. Tiếp tục?')) return;
    try {
      await api.delete('/payments/owner/config');
      setConfig({ connected: false });
      setMessage('Đã ngắt kết nối payOS.');
      setError('');
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Không thể ngắt kết nối payOS.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <OwnerSidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-black text-slate-900">Thanh toán & QR payOS</h1>
          <p className="text-sm text-slate-500 mt-1">Mỗi chủ sân sử dụng một tài khoản nhận tiền riêng. Secret chỉ được lưu ở máy chủ.</p>
        </header>

        {message && <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">{message}</p>}
        {error && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">{error}</p>}

        {loading ? <div className="rounded-2xl bg-white border border-slate-200 p-8">Đang tải cấu hình…</div> : (
          <>
            <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h2 className="font-bold text-slate-900">Trạng thái kết nối</h2>
                    {config?.connected ? <p className="text-sm text-emerald-700 mt-1 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Đã kết nối payOS</p> : <p className="text-sm text-amber-700 mt-1">Chưa kết nối tài khoản payOS</p>}
                  </div>
                </div>
                {config?.connected && <button onClick={disconnect} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50"><Unplug className="w-4 h-4" /> Ngắt kết nối</button>}
              </div>
              {config?.connected && <dl className="mt-5 grid sm:grid-cols-3 gap-4 text-sm">
                <div><dt className="text-slate-500">Tên tài khoản</dt><dd className="font-bold mt-1">{config.accountName}</dd></div>
                <div><dt className="text-slate-500">Số tài khoản</dt><dd className="font-mono font-bold mt-1">{config.accountNumber}</dd></div>
                <div><dt className="text-slate-500">Kết nối lúc</dt><dd className="font-bold mt-1">{config.connectedAt ? new Date(config.connectedAt).toLocaleString('vi-VN') : '—'}</dd></div>
              </dl>}
            </section>

            {config?.connected && qrUrl && <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
              <img src={qrUrl} alt="QR nhận thanh toán của chủ sân" className="w-56 h-56 border rounded-xl" />
              <div><h2 className="font-bold text-slate-900 flex items-center gap-2"><QrCode className="w-5 h-5 text-emerald-600" /> QR nhận thanh toán</h2><p className="text-sm text-slate-500 mt-2">Có thể dùng QR này cho thanh toán trực tiếp. Khi khách đặt sân, hệ thống vẫn tạo QR payOS riêng theo từng đơn để tự đối soát.</p></div>
            </section>}

            {!config?.connected && <form onSubmit={save} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <div><h2 className="font-bold text-slate-900">Kết nối tài khoản payOS</h2><p className="text-sm text-slate-500 mt-1">Đăng ký tài khoản merchant tại payOS, lấy 3 thông tin bên dưới rồi nhập vào đây.</p></div>
              {(['clientId', 'apiKey', 'checksumKey'] as const).map((field) => <label key={field} className="block text-sm font-semibold text-slate-700">{field === 'clientId' ? 'Client ID' : field === 'apiKey' ? 'API Key' : 'Checksum Key'}<input required type="password" value={form[field]} onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-mono text-sm" /></label>)}
              <label className="block text-sm font-semibold text-slate-700">Mã BIN ngân hàng (tùy chọn, 6 chữ số)<input inputMode="numeric" maxLength={6} value={form.bankBin} onChange={e => setForm(prev => ({ ...prev, bankBin: e.target.value.replace(/\D/g, '') }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-mono text-sm" /></label>
              <button disabled={saving} className="rounded-xl bg-emerald-600 text-white px-5 py-3 font-bold disabled:opacity-50">{saving ? 'Đang xác thực…' : 'Kết nối và kiểm tra payOS'}</button>
              <a href="https://payos.vn/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 ml-3">Mở trang đăng ký payOS <ExternalLink className="w-4 h-4" /></a>
            </form>}
          </>
        )}
      </main>
    </div>
  );
};
