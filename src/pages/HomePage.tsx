import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Search,
  Calendar,
  Users,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Compass,
  Headphones,
  Award,
  ChevronRight,
  Camera
} from 'lucide-react';
import { api } from '../services/api.js';
import { IVenue, IMatch } from '../types/index.js';
import { VenueCard } from '../components/venue/VenueCard.js';
import { MatchCard } from '../components/match/MatchCard.js';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton.js';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [topVenues, setTopVenues] = useState<IVenue[]>([]);
  const [openMatches, setOpenMatches] = useState<IMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('Hà Nội');
  const [searchFieldType, setSearchFieldType] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venuesRes, matchesRes] = await Promise.all([
          api.get('/venues'),
          api.get('/matches?status=OPEN')
        ]);
        setTopVenues(venuesRes.data.data.slice(0, 3));
        setOpenMatches(matchesRes.data.data.slice(0, 3));
      } catch (e) {
        console.error('Error loading homepage data', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/venues?city=${encodeURIComponent(searchCity)}${searchFieldType ? `&fieldType=${searchFieldType}` : ''}`);
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Hero Section - Dynamic Sporty Vibe with High-Quality Image Showcase */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC]">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-emerald-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-teal-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Heading, intro & search bar */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs sm:text-sm font-black mb-6 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Nền Tảng Đặt Sân & Ghép Kèo Đá Bóng Thông Minh Số 1
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
                ĐẶT SÂN TỐC ĐỘ. <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  CÁP KÈO ĐỈNH CAO.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Hệ thống đặt lịch sân cỏ tự động chống trùng 100%, tích hợp thuật toán ghép đối thủ cân tài cân sức theo vị trí, trình độ và thời gian thực.
              </p>

              {/* Quick Search & Booking Bar */}
              <form
                onSubmit={handleHeroSearch}
                className="mt-8 max-w-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 p-3 sm:p-4 rounded-3xl shadow-xl shadow-slate-200/50 grid grid-cols-1 sm:grid-cols-12 gap-3 text-left"
              >
                {/* City Selector */}
                <div className="sm:col-span-5 text-left">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 px-3 mb-1.5 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" /> Khu vực / Thành phố
                  </label>
                  <select
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/90 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    <option value="Hà Nội">Hà Nội (Cầu Giấy, Nam Từ Liêm...)</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh (Q.1, Bình Thạnh...)</option>
                    <option value="Đà Nẵng">Đà Nẵng (Hải Châu, Cẩm Lệ...)</option>
                  </select>
                </div>

                {/* Field Type Selector */}
                <div className="sm:col-span-4 text-left">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 px-3 mb-1.5 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-emerald-600" /> Quy mô sân
                  </label>
                  <select
                    value={searchFieldType}
                    onChange={(e) => setSearchFieldType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/90 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    <option value="">Tất cả quy mô</option>
                    <option value="5_vs_5">Sân 5 người</option>
                    <option value="7_vs_7">Sân 7 người (Phổ biến)</option>
                    <option value="11_vs_11">Sân 11 người (FIFA)</option>
                  </select>
                </div>

                {/* Search Submit Button */}
                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Search className="w-4 h-4" /> Tìm Sân
                  </button>
                </div>
              </form>

              {/* Quick Tags Under Search */}
              <div className="mt-4 flex items-center justify-center lg:justify-start flex-wrap gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Tìm kiếm nhanh:</span>
                <button
                  onClick={() => navigate('/venues?fieldType=7_vs_7')}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                >
                  ⚽ Sân 7 Hà Nội
                </button>
                <button
                  onClick={() => navigate('/matches')}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                >
                  🔥 Kèo tối nay
                </button>
                <button
                  onClick={() => navigate('/venues?sort=price_asc')}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                >
                  💰 Sân giá rẻ
                </button>
              </div>
            </div>

            {/* Right Column: Hero Visual Card with High-Res Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Featured Image Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 group">
                  <img
                    src="/images/hero-ball.png"
                    alt="Sân cỏ bóng đá chuyên nghiệp"
                    className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  {/* Overlay text on image */}
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-[11px] font-black uppercase tracking-wider mb-2">
                      <Zap className="w-3.5 h-3.5" /> Chuẩn Sân Cỏ FIFA
                    </div>
                    <h3 className="text-lg font-black leading-snug text-white drop-shadow-sm">
                      Mặt cỏ nhân tạo êm chân, dàn đèn LED chiếu sáng tiêu chuẩn
                    </h3>
                    <p className="text-xs text-slate-200 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Đặt trước 1 cú click - Nhận sân ngay
                    </p>
                  </div>
                </div>

                {/* Floating Badge 1: Top Right */}
                <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200/80 flex items-center gap-3 animate-bounce sm:flex hidden" style={{ animationDuration: '3s' }}>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black">
                    <Flame className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">Kèo đá hôm nay</div>
                    <div className="text-xs font-black text-slate-900">+45 trận đang chờ</div>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom Left */}
                <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200/80 flex items-center gap-3 sm:flex hidden">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">Tự động giữ chỗ</div>
                    <div className="text-xs font-black text-emerald-700">100% không trùng lịch</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Stats Strip - Social Proof */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          <div className="pt-2 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">120+</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Cụm sân đối tác uy tín</div>
          </div>
          <div className="pt-2 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-teal-400 tracking-tight">4,800+</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Trận bóng đã cáp kèo</div>
          </div>
          <div className="pt-6 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">100%</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Chống trùng lịch tự động</div>
          </div>
          <div className="pt-6 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-sky-400 tracking-tight">24/7</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Trợ lý AI hỗ trợ liên tục</div>
          </div>
        </div>
      </section>

      {/* 3. Featured Venues Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 mb-1">
              <Award className="w-4 h-4" /> Lựa chọn hàng đầu
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sân Bóng Được Yêu Thích Nhất
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Các cụm sân đạt tiêu chuẩn chất lượng cao, có bãi đỗ xe và đèn chiếu sáng ban đêm hiện đại.
            </p>
          </div>

          <Link
            to="/venues"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-4 py-2.5 rounded-2xl transition-all self-start sm:self-auto"
          >
            Xem tất cả sân bóng <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {topVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Live Match Matching Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
                <Flame className="w-4 h-4 fill-amber-400" /> Kèo đá giao hữu nóng
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Kèo Bóng Đang Chờ Bắt Đối
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Không lo thiếu đội đá bóng. Tham gia ngay các trận đấu cân kèo theo trình độ, lứa tuổi và địa bàn gần bạn.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/matches"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-amber-400/20 active:scale-95 cursor-pointer"
              >
                Tất cả kèo đấu <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Spotlight Banner with Action Photo */}
          <div className="relative mb-8 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 p-4 sm:p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 relative shadow-md">
              <img
                src="/images/match-action.png"
                alt="Trận bóng giao lưu sôi nổi"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
              <span className="absolute bottom-2 left-2 text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md uppercase">
                Giao Hữu Văn Minh
              </span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-1 mb-1">
                <Zap className="w-3.5 h-3.5" /> Thuật toán ghép kèo AI
              </div>
              <h3 className="text-lg font-black text-white">Tìm đối thủ tương đương trình độ chỉ trong 5 phút</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Tự động lọc theo tỉ lệ thắng, độ tuổi và văn hóa giao lưu: chia 50-50 sòng phẳng hoặc đội thua mời nước/trả sân.
              </p>
            </div>
            <Link
              to="/matches"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all shrink-0 cursor-pointer"
            >
              Tạo Kèo Mới Ngay
            </Link>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {openMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. How It Works (3 Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
            Trải nghiệm mượt mà
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Chỉ 3 Bước Đơn Giản Để Ra Sân
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Không cần gọi điện hỏi từng sân, không lo bị hẹn hủy kèo sát giờ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs hover:shadow-lg transition-all text-center group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
              01
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Tìm Sân & Khung Giờ</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Chọn khu vực mong muốn, xem ma trận khung giờ còn trống theo thời gian thực và so sánh giá thuê minh bạch.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs hover:shadow-lg transition-all text-center group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
              02
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Đặt Chỗ & Cáp Kèo</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Khóa sân ngay lập tức không sợ trùng lịch, hoặc đăng tin tìm đội bạn giao lưu chia đôi tiền sân văn minh.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs hover:shadow-lg transition-all text-center group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
              03
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Ra Sân Thi Đấu</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Nhận thông báo nhắc giờ bóng lăn, kiểm tra thông tin đối thủ và ra sân tận hưởng niềm đam mê bóng đá.
            </p>
          </div>
        </div>
      </section>

      {/* 5.5 Community Highlights & Atmosphere Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 inline-flex items-center gap-1.5 mb-1">
            <Camera className="w-4 h-4 text-emerald-600" /> Khoảnh Khắc Sân Cỏ
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sôi Động Cùng Cộng Đồng Football Connect
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Hàng ngàn trận bóng giao hữu, giải đấu phong trào và những cụm sân cỏ nhân tạo hiện đại nhất trên toàn quốc.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Main Large Photo */}
          <div className="md:col-span-7 relative group rounded-3xl overflow-hidden shadow-lg h-72 sm:h-80">
            <img
              src="/images/vn-match-red.png"
              alt="Ăn mừng bàn thắng sân cỏ Việt Nam"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1.5 inline-block">
                Cảm Xúc Thỏa Mãn
              </span>
              <h3 className="text-base sm:text-lg font-black leading-snug">Chợt vỡ òa với những bàn thắng phút chót</h3>
              <p className="text-xs text-slate-300 mt-0.5">Hơn 4,800+ trận giao hữu đã tổ chức thành công sòng phẳng</p>
            </div>
          </div>

          {/* Side Photo 1 */}
          <div className="md:col-span-5 relative group rounded-3xl overflow-hidden shadow-lg h-72 sm:h-80">
            <img
              src="/images/match-saigon-cup.png"
              alt="Giải bóng đá phong trào sôi nổi"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1.5 inline-block">
                Giải Đấu & Cáp Kèo
              </span>
              <h3 className="text-base sm:text-lg font-black leading-snug">Sân 7 người tiêu chuẩn chất lượng cao</h3>
              <p className="text-xs text-slate-300 mt-0.5">Khán đài, trọng tài & đèn cao áp ban đêm đầy đủ</p>
            </div>
          </div>

          {/* Bottom Row Photo 1 */}
          <div className="md:col-span-4 relative group rounded-3xl overflow-hidden shadow-lg h-56">
            <img
              src="/images/pitch-turf-modern.png"
              alt="Cụm sân cỏ nhân tạo hiện đại"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <span className="text-xs font-extrabold text-emerald-400">Mặt cỏ nhân tạo êm chân</span>
              <p className="text-[11px] text-slate-300">Không lo chấn thương & trơn trượt</p>
            </div>
          </div>

          {/* Bottom Row Photo 2 */}
          <div className="md:col-span-4 relative group rounded-3xl overflow-hidden shadow-lg h-56">
            <img
              src="/images/turf-aerial.png"
              alt="Toàn cảnh cụm sân bóng từ trên cao"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <span className="text-xs font-extrabold text-amber-400">Đa dạng quy mô sân 5, 7 & 11</span>
              <p className="text-[11px] text-slate-300">Phù hợp mọi quy mô đá tập & giải đấu</p>
            </div>
          </div>

          {/* Bottom Row Photo 3 */}
          <div className="md:col-span-4 relative group rounded-3xl overflow-hidden shadow-lg h-56">
            <img
              src="/images/bicycle-kick.png"
              alt="Kỹ thuật bóng đá đỉnh cao"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <span className="text-xs font-extrabold text-sky-400">Tự do phô diễn kỹ năng</span>
              <p className="text-[11px] text-slate-300">Nơi đam mê trái bóng tròn thăng hoa</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call To Action Banner with Night Stadium Background */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 border border-emerald-900/40 bg-gradient-to-r from-emerald-950 via-slate-950 to-teal-950">
          {/* Background Image with Dark Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/stadium-night.png"
              alt="Sân vận động rực sáng dưới trăng"
              className="w-full h-full object-cover object-bottom opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-slate-950/85 to-teal-950/90" />
          </div>

          <div className="max-w-xl text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 backdrop-blur-md text-xs font-extrabold text-emerald-300 mb-3 border border-emerald-400/40 shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Dành cho cả Cầu thủ & Chủ sân
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Sẵn Sàng Cho Trận Cầu Tối Nay Của Bạn?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              Gia nhập cùng hàng ngàn cầu thủ và chủ cụm sân trên toàn quốc ngay hôm nay để trải nghiệm sự tiện lợi vượt trội.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto relative z-10">
            <Link
              to="/venues"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all text-center shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
            >
              Đặt Sân Ngay Bây Giờ
            </Link>
            <Link
              to="/matches"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs sm:text-sm border border-white/25 backdrop-blur-md transition-all text-center cursor-pointer"
            >
              Tìm Đội Cáp Kèo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
