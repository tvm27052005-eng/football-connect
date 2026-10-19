import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  EyeOff,
  Eye,
  KeyRound,
  CheckCircle2,
  RotateCw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuthStore } from '../stores/auth.store.js';
import { Modal } from '../components/common/Modal.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, switchDemoRole, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [forgotDemoOtp, setForgotDemoOtp] = useState('');
  const [forgotOtpExpiresIn, setForgotOtpExpiresIn] = useState(300); // 5 mins
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0); // 60s
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Countdown timer for forgot password OTP
  useEffect(() => {
    if (!isForgotModalOpen || forgotStep !== 'OTP') return;

    const timer = setInterval(() => {
      setForgotOtpExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      setForgotResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isForgotModalOpen, forgotStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLoginSuccessMsg('');
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setLocalError((err as Error).message || 'Đăng nhập thất bại');
    }
  };

  const handleOpenForgotPassword = () => {
    setForgotStep('EMAIL');
    setForgotEmail(email || '');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setIsForgotModalOpen(true);
  };

  // Step 1: Send OTP for Forgot Password
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotEmail) {
      setForgotError('Vui lòng nhập email');
      return;
    }

    try {
      setIsForgotLoading(true);
      const res = await api.post('/auth/forgot-password-otp', { email: forgotEmail.trim() });
      if (res.data.demoOtp) {
        setForgotDemoOtp(res.data.demoOtp);
      }
      setForgotStep('OTP');
      setForgotOtpExpiresIn(300);
      setForgotResendCooldown(60);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể gửi mã xác thực. Vui lòng kiểm tra lại email!';
      setForgotError(msg);
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Resend OTP
  const handleResendForgotOtp = async () => {
    if (forgotResendCooldown > 0) return;
    setForgotError('');

    try {
      setIsForgotLoading(true);
      const res = await api.post('/auth/forgot-password-otp', { email: forgotEmail.trim() });
      if (res.data.demoOtp) {
        setForgotDemoOtp(res.data.demoOtp);
      }
      setForgotOtpExpiresIn(300);
      setForgotResendCooldown(60);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể gửi lại mã OTP.';
      setForgotError(msg);
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (forgotOtp.trim().length !== 6) {
      setForgotError('Vui lòng nhập đúng mã OTP 6 chữ số');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Xác nhận mật khẩu mới không trùng khớp');
      return;
    }

    if (forgotOtpExpiresIn <= 0) {
      setForgotError('Mã OTP đã hết hạn (quá 5 phút). Vui lòng gửi lại mã mới!');
      return;
    }

    try {
      setIsForgotLoading(true);
      await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword
      });

      setIsForgotModalOpen(false);
      setEmail(forgotEmail);
      setPassword('');
      setLocalError('');
      setLoginSuccessMsg('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới ngay.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Mã OTP không hợp lệ hoặc đã hết hạn!';
      setForgotError(msg);
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Sports Passion Visual Banner (Hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-slate-950 p-8 text-white flex-col justify-between min-h-[500px]">
          <div className="absolute inset-0 z-0">
            <img
              src="/images/vietnam-celebration.png"
              alt="Cảm xúc chiến thắng bóng đá Việt Nam"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-emerald-950/40" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md text-emerald-300 text-[11px] font-black uppercase">
              <Trophy className="w-3.5 h-3.5" /> Football Connect
            </div>
          </div>

          <div className="relative z-10 space-y-2 mt-auto">
            <h3 className="text-2xl font-black leading-tight">
              Thổi bùng ngọn lửa đam mê sân cỏ!
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kết nối cộng đồng hàng ngàn cầu thủ phong trào. Tìm đối giao lưu, đặt sân nhanh chóng, không lo trễ giờ bóng lăn.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col min-h-[500px]">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-[2rem] font-black text-slate-900 leading-tight">
              Đăng Nhập
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Chào mừng bạn quay trở lại với cộng đồng Football Connect
            </p>
          </div>

          {loginSuccessMsg && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2.5 font-medium animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{loginSuccessMsg}</span>
            </div>
          )}

          {(localError || error) && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-sm flex-1">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hai.nguyen@footballconnect.vn"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-auto pt-4 border-t border-slate-200 text-center text-sm text-slate-500">
            Bạn chưa có tài khoản?{' '}
            <Link to="/register" className="text-emerald-700 font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => {
          if (!isForgotLoading) {
            setIsForgotModalOpen(false);
            setForgotError('');
          }
        }}
        title="Quên & Đặt Lại Mật Khẩu"
      >
        <div className="space-y-4 text-xs">
          {forgotError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{forgotError}</span>
            </div>
          )}

          {forgotStep === 'EMAIL' ? (
            /* STEP 1: Enter email */
            <form onSubmit={handleSendForgotOtp} className="space-y-4">
              <div className="text-slate-600 text-xs leading-relaxed">
                Nhập địa chỉ email đã đăng ký trên hệ thống Football Connect. Chúng tôi sẽ gửi một mã OTP gồm 6 chữ số để xác thực bạn chính là chủ tài khoản.
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Email tài khoản của bạn *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading || !forgotEmail}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isForgotLoading ? 'Đang gửi mã...' : 'Gửi Mã Xác Thực OTP'}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Enter OTP + New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                Mã xác thực đã được gửi đến email: <strong className="text-slate-900">{forgotEmail}</strong>.
              </div>

              {/* Dev Quick Hint if present */}
              {forgotDemoOtp && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Mã OTP thử nghiệm nhanh: <strong className="font-mono text-sm tracking-widest text-emerald-800">{forgotDemoOtp}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setForgotOtp(forgotDemoOtp)}
                    className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px] hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Điền
                  </button>
                </div>
              )}

              {/* OTP Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Mã xác thực OTP (6 chữ số) *</label>
                  <span className={`text-[11px] font-extrabold ${forgotOtpExpiresIn < 60 ? 'text-rose-600 animate-pulse' : 'text-emerald-700'}`}>
                    ⏱️ Còn {formatTime(forgotOtpExpiresIn)}
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-base font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Chưa nhận được mã?</span>
                  <button
                    type="button"
                    disabled={forgotResendCooldown > 0 || isForgotLoading}
                    onClick={handleResendForgotOtp}
                    className="font-bold text-emerald-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    {forgotResendCooldown > 0 ? `Gửi lại sau (${forgotResendCooldown}s)` : 'Gửi lại mã OTP'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mật khẩu mới (Tối thiểu 6 ký tự) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nhập lại mật khẩu mới *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setForgotStep('EMAIL')}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Đổi email
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading || forgotOtp.length !== 6 || forgotOtpExpiresIn <= 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isForgotLoading ? 'Đang cập nhật...' : 'Xác Nhận & Đổi Mật Khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
