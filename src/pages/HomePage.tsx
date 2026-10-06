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
  ChevronRight
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
      {/* 1. Hero Section - Dynamic Sporty Vibe */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC]">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-emerald-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-teal-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs sm:text-sm font-black mb-8 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Nền Tảng Đặt Sân & Ghép Kèo Đá Bóng Thông Minh Số 1
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 tracking-tight max-w-5xl mx-auto leading-[1.1] sm:leading-none">
            ĐẶT SÂN TỐC ĐỘ. <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              CÁP KÈO ĐỈNH CAO.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Hệ thống đặt lịch sân cỏ tự động chống trùng 100%, tích hợp thuật toán ghép đối thủ cân tài cân sức theo vị trí, trình độ và thời gian thực.
          </p>

          {/* Quick Search & Booking Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-10 max-w-4xl mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 p-3 sm:p-4 rounded-3xl shadow-xl shadow-slate-200/50 grid grid-cols-1 sm:grid-cols-12 gap-3 text-left"
          >
            {/* City Selector */}
            <div className="sm:col-span-5 text-left">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 px-3 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600" /> Khu vực / Thành phố
              </label>
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/90 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              >
                <option value="Hà Nội">Hà Nội (Cầu Giấy, Nam Từ Liêm, Tây Hồ...)</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh (Q.1, Tân Bình, Bình Thạnh...)</option>
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
                className="w-full px-4 py-3 bg-slate-50/90 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              >
                <option value="">Tất cả (Sân 5, Sân 7, Sân 11)</option>
                <option value="5_vs_5">Sân 5 người (Futsal / Mini)</option>
                <option value="7_vs_7">Sân 7 người (Phổ biến nhất)</option>
                <option value="11_vs_11">Sân 11 người (Tiêu chuẩn FIFA)</option>
              </select>
            </div>

            {/* Search Submit Button */}
            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4" /> Tìm Sân Ngay
              </button>
            </div>
          </form>

          {/* Quick Tags Under Search */}
          <div className="mt-5 flex items-center justify-center flex-wrap gap-2 text-xs text-slate-500">
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
              💰 Sân giá rẻ dưới 300k
            </button>
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
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
                <Flame className="w-4 h-4 fill-amber-400" /> Kèo đá giao hữu nóng
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Kèo Bóng Đang Chờ Bắt Đối
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Không lo thiếu đội đá bóng. Tham gia ngay các trận đấu cân kèo theo trình độ và địa bàn gần bạn.
              </p>
            </div>

            <Link
              to="/matches"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-4 py-2.5 rounded-2xl transition-all self-start sm:self-auto shadow-md shadow-amber-400/20"
            >
              Tất cả kèo đấu <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* 6. Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 rounded-3xl p-8 sm:p-14 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white mb-3">
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Dành cho cả Cầu thủ & Chủ sân
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Sẵn Sàng Cho Trận Cầu Tối Nay Của Bạn?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Gia nhập cùng hàng ngàn cầu thủ và chủ cụm sân trên toàn quốc ngay hôm nay để trải nghiệm sự tiện lợi vượt trội.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <Link
              to="/venues"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-emerald-900 font-black text-xs sm:text-sm hover:bg-slate-100 transition-all text-center shadow-lg active:scale-95 cursor-pointer"
            >
              Đặt Sân Ngay Bây Giờ
            </Link>
            <Link
              to="/matches"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-950/80 text-white font-black text-xs sm:text-sm border border-emerald-400/30 transition-all text-center cursor-pointer"
            >
              Tìm Đội Cáp Kèo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
