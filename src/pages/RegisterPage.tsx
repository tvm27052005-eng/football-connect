import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  EyeOff,
  Eye,
  ShieldCheck,
  CheckCircle2,
  RotateCw,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuthStore } from '../stores/auth.store.js';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthSession } = useAuthStore();

  // Form State
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'USER' | 'OWNER'>('USER');
  const [city, setCity] = useState('Hà Nội');
  const [district, setDistrict] = useState('Cầu Giấy');

  // OTP State
  const [otp, setOtp] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(60); // 1 phút (60s)
  const [resendCooldown, setResendCooldown] = useState(0); // 60s cooldown

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for OTP expiry and resend cooldown
  useEffect(() => {
    if (step !== 'OTP') return;

    const timer = setInterval(() => {
      setOtpExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Submit form and request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/register-otp', {
        name,
        email,
        password,
        phone,
        role,
        city,
        district
      });

      setSuccessMsg(res.data.message || 'Mã OTP đã được gửi đến email của bạn.');
      setStep('OTP');
      setOtp('');
      setOtpExpiresIn(60);
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể gửi mã xác thực. Vui lòng thử lại!';
      setLocalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLocalError('');
    setSuccessMsg('');

    try {
      setIsLoading(true);
      const res = await api.post('/auth/register-otp', {
        name,
        email,
        password,
        phone,
        role,
        city,
        district
      });

      setSuccessMsg(res.data.message || 'Đã gửi lại mã OTP mới về email của bạn!');
      setOtpExpiresIn(60);
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể gửi lại mã OTP.';
      setLocalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify OTP and complete registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setLocalError('');

    if (otp.trim().length !== 6) {
      setLocalError('Vui lòng nhập đầy đủ mã OTP 6 chữ số');
      return;
    }

    if (otpExpiresIn <= 0) {
      setLocalError('Mã OTP đã hết hạn. Vui lòng bấm gửi lại mã mới!');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/verify-register-otp', {
        email,
        otp: otp.trim()
      });

      const { user, accessToken } = res.data.data;
      setAuthSession(user, accessToken);

      if (role === 'OWNER') navigate('/owner/venues');
      else navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Mã OTP không hợp lệ hoặc đã hết hạn!';
      setLocalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Sportsmanship Banner */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-slate-950 p-8 text-white flex-col justify-between min-h-[600px]">
          <div className="absolute inset-0 z-0">
            <img
              src="/images/ronaldo-messi.png"
              alt="Tinh thần bóng đá & tình anh em"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-amber-950/40" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-md text-amber-300 text-[11px] font-black uppercase">
              <img src="/images/football-connect-logo.png" alt="Football Connect" className="h-8 w-28 object-contain" /> Tinh thần thể thao đẹp
            </div>
          </div>

          <div className="relative z-10 space-y-2 mt-auto">
            <h3 className="text-2xl font-black leading-tight">
              Đam mê bất tận. Kết nối không giới hạn!
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trở thành một phần của mạng lưới bóng đá số 1 Việt Nam. Xác thực email an toàn, bảo vệ tài khoản và lịch đặt sân tuyệt đối.
            </p>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
          {step === 'FORM' ? (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-black text-slate-900">Tạo Tài Khoản Mới</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Gia nhập cộng đồng đặt sân và tìm kèo bóng đá lớn nhất
                </p>
              </div>

              {/* Role Picker */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`py-2.5 rounded-xl font-bold transition-all cursor-pointer ${role === 'USER'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Tôi là Cầu Thủ
                </button>
                <button
                  type="button"
                  onClick={() => setRole('OWNER')}
                  className={`py-2.5 rounded-xl font-bold transition-all cursor-pointer ${role === 'OWNER'
                    ? 'bg-amber-500 text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Tôi là Chủ Sân Bóng
                </button>
              </div>

              {localError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{localError}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {role === 'USER' ? 'Họ và tên *' : 'Tên người đại diện *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email nhận mã OTP *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Số điện thoại *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0988 888 888"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mật khẩu *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Thành phố</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                    >
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Quận / Huyện</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Cầu Giấy"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Đang gửi mã xác thực qua email...' : 'Đăng kí ngay'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-emerald-700 font-bold hover:underline">
                  Đăng nhập ngay
                </Link>
              </div>
            </>
          ) : (
            /* STEP 2: VERIFY OTP */
            <div className="space-y-5 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => {
                  setStep('FORM');
                  setLocalError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại sửa thông tin
              </button>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-xl shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Xác Thực Email Của Bạn</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Mã OTP 6 số đã được gửi tới email <strong className="text-slate-800">{email}</strong>. Vui lòng kiểm tra hộp thư.
                </p>
              </div>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {localError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{localError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">Mã xác thực OTP (6 chữ số)</label>
                    <span className={`text-xs font-extrabold ${otpExpiresIn < 30 ? 'text-rose-600 animate-pulse' : 'text-emerald-700'}`}>
                      Còn {formatTime(otpExpiresIn)}
                    </span>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="XXXXXX"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Chưa nhận được mã?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={handleResendOtp}
                    className="font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại mã OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6 || otpExpiresIn <= 0}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Đang xác thực...' : 'Xác Nhận & Hoàn Tất Đăng Ký'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
