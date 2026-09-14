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
  Star,
  MapPin,
  Clock,
  CheckCircle2
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
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC]">
        {/* Background Subtle Ambience */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-100/60 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Nền tảng Quản lý Sân bóng & Ghép đối Thông minh số 1
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            ĐẶT SÂN NHANH CHÓNG. <br />
            <span className="text-emerald-600">
              GHÉP ĐỐI ĐỈNH CAO.
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Hệ thống đặt lịch sân cỏ nhân tạo tự động, chống trùng lịch 100% kết hợp thuật toán ghép đối thủ cân tài cân sức theo vị trí, trình độ và thời gian thực.
          </p>

          {/* Quick Search Widget */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 max-w-3xl mx-auto bg-white border border-slate-200 p-3 rounded-2xl shadow-lg grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-left"
          >
            <div className="sm:col-span-5 text-left">
              <label className="block text-[11px] font-bold uppercase text-slate-500 px-3 mb-1">
                Khu vực / Thành phố
              </label>
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Hà Nội">Hà Nội (Cầu Giấy, Nam Từ Liêm...)</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh (Q.1, Tân Bình...)</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
              </select>
            </div>

            <div className="sm:col-span-4 text-left">
              <label className="block text-[11px] font-bold uppercase text-slate-500 px-3 mb-1">
                Loại sân bóng
              </label>
              <select
                value={searchFieldType}
                onChange={(e) => setSearchFieldType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Tất cả (Sân 5, 7, 11)</option>
                <option value="5_vs_5">Sân 5 người</option>
                <option value="7_vs_7">Sân 7 người</option>
                <option value="11_vs_11">Sân 11 người</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4" /> Tìm Sân Ngay
              </button>
            </div>
          </form>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-200">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Chống trùng lịch tuyệt đối</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">50+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Cụm sân bóng tiêu chuẩn</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">1,250+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Cầu thủ tham gia ghép đối</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">4.9 ★</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Mức độ hài lòng cộng đồng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Venues Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
              <Trophy className="w-3.5 h-3.5" /> Sân bóng nổi bật
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Cụm Sân Cỏ Nhân Tạo Chất Lượng Cao
            </h2>
          </div>
          <Link
            to="/venues"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            Xem tất cả sân bóng <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </section>

      {/* Real-time Match Finding Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-block mb-2 shadow-xs">
                🔥 Kèo Đang Mở Tuyển Cầu Thủ
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Tham Gia Trận Đấu & Tìm Đối Thủ Trực Tuyến
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/matches"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
              >
                Khám phá tất cả kèo
              </Link>
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={3} type="card" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Core Advantages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-black text-slate-900">Tại sao chọn FOOTBALL CONNECT?</h2>
          <p className="text-xs text-slate-500 mt-2">
            Giải quyết triệt để vấn đề mất thời gian gọi điện đặt sân và nỗi lo thiếu người đá mỗi tuần.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Chống Double-Booking Tuyệt Đối</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cơ chế khóa lịch theo giây tự động kiểm tra trùng lặp trên từng sân con. Đặt sân là chắc chắn có sân 100%.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Thuật Toán Ghép Đối Chuẩn Xác</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tự động tính điểm tương đồng theo vị trí địa lý, trình độ kỹ năng, thời gian biểu và loại sân yêu thích.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Phần Mềm Quản Lý Cụm Sân</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cung cấp cổng riêng biệt cho Chủ sân (Owner) theo dõi doanh thu theo ngày/tháng, tỷ lệ lấp đầy và duyệt đơn tức thì.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
