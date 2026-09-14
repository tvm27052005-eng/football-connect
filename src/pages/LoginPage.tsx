import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Mail, Lock, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, switchDemoRole, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setLocalError((err as Error).message || 'Đăng nhập thất bại');
    }
  };

  const handleQuickDemo = async (role: 'USER' | 'OWNER' | 'ADMIN') => {
    await switchDemoRole(role);
    if (role === 'OWNER') navigate('/owner/dashboard');
    else if (role === 'ADMIN') navigate('/admin/dashboard');
    else navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-xs mx-auto mb-3">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Đăng Nhập Tài Khoản</h1>
          <p className="text-xs text-slate-500 mt-1">
            Chào mừng bạn quay trở lại với cộng đồng Football Connect
          </p>
        </div>

        {/* Quick Demo Login Preset Buttons */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Đăng nhập nhanh 1-Click (Tài khoản mẫu):
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('USER')}
              className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-all text-center cursor-pointer"
            >
              👤 Cầu thủ
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('OWNER')}
              className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 transition-all text-center cursor-pointer"
            >
              🏟️ Chủ sân
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="px-2 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 transition-all text-center cursor-pointer"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {(localError || error) && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Email đăng nhập</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hai.nguyen@footballconnect.vn"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-emerald-700 font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
