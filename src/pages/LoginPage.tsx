import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  EyeOff,
  Eye,
  KeyRound,
  CheckCircle2,
  RotateCw,
  Trophy,
  CalendarDays,
  Users,
  ShieldCheck
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { api } from '../services/api.js';
import { useAuthStore } from '../stores/auth.store.js';
import { Modal } from '../components/common/Modal.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuthStore();
  const shouldReduceMotion = useReducedMotion();

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

  const [forgotOtpExpiresIn, setForgotOtpExpiresIn] = useState(60);
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);
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
      const loggedInUser = await login({ email, password });
      const destination = loggedInUser.role === 'OWNER'
        ? '/owner/venues'
        : loggedInUser.role === 'ADMIN'
          ? '/admin/dashboard'
          : from;
      navigate(destination, { replace: true });
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
      const normalizedEmail = forgotEmail.trim().toLowerCase();
      await api.post('/auth/forgot-password-otp', { email: normalizedEmail });
      setForgotEmail(normalizedEmail);
      setForgotStep('OTP');
      setForgotOtpExpiresIn(60);
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
      await api.post('/auth/forgot-password-otp', { email: forgotEmail.trim() });
      setForgotOtpExpiresIn(60);
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
    if (isForgotLoading) return;
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
      setForgotError('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới!');
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
    <div className="relative min-h-[calc(100dvh-6rem)] overflow-hidden bg-[#06130d] px-4 py-8 sm:py-12">
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <motion.div
        aria-hidden="true"
        className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-lime-400/15 blur-3xl"
        animate={shouldReduceMotion ? undefined : { x: [0, 35, 0], y: [0, 25, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl"
        animate={shouldReduceMotion ? undefined : { x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/35 lg:grid-cols-12"
      >
        {/* Sports visual */}
        <div className="relative hidden min-h-[640px] overflow-hidden bg-slate-950 p-10 text-white lg:col-span-7 lg:flex lg:flex-col lg:justify-between">
          <motion.img
            src="/images/vietnam-celebration.png"
            alt="Cảm xúc chiến thắng bóng đá Việt Nam"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1.03 }}
            animate={shouldReduceMotion ? { scale: 1.03 } : { scale: [1.03, 1.09, 1.03], x: [0, -8, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/55 to-emerald-950/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/35" />
          <div className="absolute -right-16 top-0 h-full w-1/2 -skew-x-12 border-l border-lime-400/30 bg-lime-400/5" />

          <motion.div
            className="relative z-10 w-fit rounded-2xl border border-white/15 bg-white/90 px-4 py-2 shadow-xl backdrop-blur-md"
            initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <img src="/images/football-connect-logo.png" alt="Football Connect" className="h-10 w-36 object-contain" />
          </motion.div>

          <div className="relative z-10 mt-auto max-w-xl">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-2 border-l-4 border-lime-400 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-lime-300 backdrop-blur-sm"
            >
              <Trophy className="h-3.5 w-3.5" /> Sân chơi của đam mê
            </motion.div>
            <motion.h2
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.55 }}
              className="text-5xl font-black uppercase italic leading-[0.95] tracking-tight"
            >
              Trở lại sân cỏ.
              <span className="mt-2 block text-lime-400">Chạm lại đam mê.</span>
            </motion.h2>
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="mt-5 max-w-lg text-sm leading-relaxed text-slate-300"
            >
              Tìm sân, giữ lịch và bắt kèo cùng cộng đồng bóng đá phong trào trong một tài khoản duy nhất.
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="mt-7 grid grid-cols-3 gap-2"
            >
              {[
                { icon: CalendarDays, label: 'Đặt sân', value: 'Nhanh gọn' },
                { icon: Users, label: 'Bắt đối', value: 'Đúng trình' },
                { icon: ShieldCheck, label: 'Tài khoản', value: 'An toàn' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
                  <item.icon className="mb-2 h-4 w-4 text-lime-300" />
                  <div className="text-[10px] font-black uppercase tracking-wider text-white">{item.label}</div>
                  <div className="mt-0.5 text-[10px] text-slate-300">{item.value}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.img
            aria-hidden="true"
            src="/images/hero-ball.png"
            alt=""
            className="absolute -right-10 top-28 z-10 h-36 w-36 object-contain opacity-80 drop-shadow-2xl"
            animate={shouldReduceMotion ? undefined : { y: [0, -16, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Login form */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex min-h-[590px] flex-col p-6 sm:p-10 lg:col-span-5 lg:p-12"
        >
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Hệ thống trực tuyến
              </span>
              <img src="/images/football-connect-logo.png" alt="Football Connect" className="h-8 w-28 object-contain lg:hidden" />
            </div>
            <h1 className="text-3xl font-black uppercase italic leading-none tracking-tight text-slate-950 sm:text-4xl">
              Đăng nhập
              <span className="text-emerald-600">.</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Chào mừng bạn trở lại. Đăng nhập để tiếp tục lịch sân và những kèo đấu đang chờ.
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {loginSuccessMsg && (
              <motion.div key="success" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span>{loginSuccessMsg}</span>
              </motion.div>
            )}

            {(localError || error) && (
              <motion.div key="error" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{localError || error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex-1 space-y-5 text-sm">
            <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <label htmlFor="login-email" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-700">Email</label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@footballconnect.vn"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </motion.div>

            <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.43 }}>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-black uppercase tracking-wider text-slate-700">Mật khẩu</label>
                <button type="button" onClick={handleOpenForgotPassword} className="cursor-pointer text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                  Quên mật khẩu?
                </button>
              </div>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-lime-400 py-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-lime-500/20 transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <><RotateCw className="h-4 w-4 animate-spin" /> Đang xác thực...</>
              ) : (
                <>Đăng nhập <ArrowRight className="h-4 w-4" /></>
              )}
            </motion.button>
          </form>

          <div className="mt-5 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-black text-emerald-700 hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => {
          if (!isForgotLoading) {
            setIsForgotModalOpen(false);
            setForgotError('');
          }
        }}
        title={forgotStep === 'EMAIL' ? 'Khôi phục tài khoản' : 'Xác thực và đặt mật khẩu mới'}
        maxWidth="sm"
      >
        <div className="space-y-5 text-xs">
          <div className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-lg shadow-slate-950/10">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-slate-950">
                {forgotStep === 'EMAIL' ? <Mail className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">Football Connect Security</p>
                <h4 className="mt-1 text-base font-black">
                  {forgotStep === 'EMAIL' ? 'Nhận mã xác thực qua email' : 'Kiểm tra email của bạn'}
                </h4>
                <p className="mt-1 text-[11px] leading-5 text-slate-300">
                  {forgotStep === 'EMAIL'
                    ? 'Nhập email đã đăng ký. Hệ thống sẽ gửi mã OTP gồm 6 chữ số để xác minh tài khoản.'
                    : <>Mã OTP đã được gửi đến <strong className="text-white">{forgotEmail}</strong> và có hiệu lực trong 1 phút.</>}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white">1</span>
              <span className="font-bold text-slate-700">Email</span>
            </div>
            <div className={`h-0.5 rounded-full ${forgotStep === 'OTP' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ${forgotStep === 'OTP' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
              <span className={forgotStep === 'OTP' ? 'font-bold text-slate-700' : 'font-semibold text-slate-400'}>OTP & mật khẩu</span>
            </div>
          </div>

          {forgotError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{forgotError}</span>
            </div>
          )}

          {forgotStep === 'EMAIL' ? (
            /* STEP 1: Enter email */
            <form onSubmit={handleSendForgotOtp} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-700">Email đã đăng ký</label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ban@footballconnect.vn"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Mã xác thực chỉ được gửi đến email liên kết với tài khoản.</p>
              </div>

              <button
                type="submit"
                disabled={isForgotLoading || !forgotEmail.trim()}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-md shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isForgotLoading ? <><RotateCw className="h-4 w-4 animate-spin" /> Đang gửi mã…</> : <>Gửi mã OTP <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          ) : (

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* OTP Field */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="forgot-otp" className="text-xs font-black uppercase tracking-wider text-slate-700">Mã OTP</label>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${forgotOtpExpiresIn <= 15 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    {forgotOtpExpiresIn > 0 ? `Còn ${formatTime(forgotOtpExpiresIn)}` : 'Đã hết hạn'}
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
                  <input
                    id="forgot-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-center font-mono text-xl font-black tracking-[0.45em] text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full transition-all duration-1000 ${forgotOtpExpiresIn <= 15 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.max(0, Math.min(100, (forgotOtpExpiresIn / 60) * 100))}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                  <button type="button" onClick={() => { setForgotStep('EMAIL'); setForgotOtp(''); setForgotError(''); }} className="flex cursor-pointer items-center gap-1 font-bold text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="h-3 w-3" /> Đổi email
                  </button>
                  <button
                    type="button"
                    disabled={forgotResendCooldown > 0 || isForgotLoading}
                    onClick={handleResendForgotOtp}
                    className="flex cursor-pointer items-center gap-1 font-bold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCw className="w-3 h-3" />
                    {forgotResendCooldown > 0 ? `Gửi lại sau ${forgotResendCooldown}s` : 'Gửi lại mã OTP'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="forgot-new-password" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-700">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="forgot-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    maxLength={128}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
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
                <label htmlFor="forgot-confirm-password" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-700">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="forgot-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    maxLength={128}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
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

              <button
                type="submit"
                disabled={isForgotLoading || forgotOtp.length !== 6 || forgotOtpExpiresIn <= 0 || newPassword.length < 6 || newPassword !== confirmPassword}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-lime-400 py-3.5 text-sm font-black text-slate-950 shadow-md shadow-lime-500/15 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isForgotLoading ? <><RotateCw className="h-4 w-4 animate-spin" /> Đang cập nhật…</> : <><CheckCircle2 className="h-4 w-4" /> Đặt lại mật khẩu</>}
              </button>
            </form>
          )}

          <p className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-center text-[10px] leading-4 text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Football Connect không bao giờ yêu cầu bạn cung cấp OTP qua điện thoại hoặc tin nhắn.
          </p>
        </div>
      </Modal>
    </div>
  );
};
