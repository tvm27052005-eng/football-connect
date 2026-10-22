import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Sparkles,
  Search,
  MapPin,
  Calendar,
  Clock,
  ClipboardList,
  SlidersHorizontal,
  RotateCcw,
  Target,
  Trophy,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api.js';
import { IMatch, IMatchRecommendation, IVenue } from '../types/index.js';
import { MatchCard } from '../components/match/MatchCard.js';
import { LoadingSkeleton, EmptyState } from '../components/common/LoadingSkeleton.js';
import { Modal } from '../components/common/Modal.js';
import { useAuthStore } from '../stores/auth.store.js';

export const MatchesPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  const [matches, setMatches] = useState<IMatch[]>([]);
  const [myMatches, setMyMatches] = useState<IMatch[]>([]);
  const [showMyMatches, setShowMyMatches] = useState(false);
  const [recommendations, setRecommendations] = useState<IMatchRecommendation[]>([]);
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldType, setFieldType] = useState('');
  const [skillLevel, setSkillLevel] = useState('');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    title: '',
    teamAName: user?.name ? `FC ${user.name}` : 'FC Cầu Giấy',
    venueId: '',
    matchDate: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '20:30',
    fieldType: '7_vs_7',
    skillLevel: 'INTERMEDIATE',
    totalFieldFee: 600000,
    costSharing: '50_50',
    teamAPhone: user?.phone || '0912345678',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/matches');
      setMatches(res.data.data);
    } catch (e) {
      console.error('Failed to load matches:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/matches/recommendations');
      setRecommendations(res.data.data);
    } catch (e) {
      console.error('Failed to load recommendations:', e);
    }
  };

  const fetchMyMatches = async () => {
    if (!isAuthenticated) {
      setMyMatches([]);
      return;
    }

    try {
      const res = await api.get('/matches/mine');
      setMyMatches(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      console.error('Failed to load my matches:', error);
    }
  };

  const fetchVenues = async () => {
    try {
      const res = await api.get('/venues');
      setVenues(res.data.data);
      if (res.data.data.length > 0) {
        setCreateForm((prev) => ({ ...prev, venueId: res.data.data[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchRecommendations();
    fetchMyMatches();
    fetchVenues();
  }, [isAuthenticated]);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!isAuthenticated) {
      setCreateError('Vui lòng đăng nhập để tạo kèo tìm đối');
      return;
    }

    if (!createForm.teamAName.trim() || !createForm.teamAPhone.trim() || !createForm.title.trim()) {
      setCreateError('Vui lòng điền tên đội, số điện thoại đội trưởng và tiêu đề kèo');
      return;
    }

    if (!createForm.venueId || venues.length === 0) {
      setCreateError('Chưa có cụm sân đang hoạt động để đăng kèo');
      return;
    }

    if (!createForm.matchDate || !createForm.startTime || !createForm.endTime) {
      setCreateError('Vui lòng chọn ngày và nhập đầy đủ giờ thi đấu');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post<{ data?: IMatch }>('/matches', createForm);
      setShowCreateModal(false);
      setShowMyMatches(true);
      setCreateSuccess('Đã gửi kèo thành công. Kèo đang chờ Admin duyệt và được hiển thị trong mục Kèo của tôi.');
      fetchMatches();
      await fetchMyMatches();
      const createdMatch = response.data.data;
      if (createdMatch) {
        setMyMatches((currentMatches) => {
          if (currentMatches.some((match) => match.id === createdMatch.id)) {
            return currentMatches;
          }
          return [createdMatch, ...currentMatches];
        });
      }
      fetchRecommendations();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể tạo kèo đá';
      setCreateError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchVenue = (m.venueName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchVenue) return false;
    }
    if (fieldType && m.fieldType !== fieldType) return false;
    if (skillLevel && m.skillLevel !== skillLevel) return false;
    return true;
  });

  const hasActiveFilters = Boolean(searchQuery || fieldType || skillLevel);
  const openMatchesCount = matches.filter((match) => match.status === 'OPEN').length;

  const openCreateMatch = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setCreateError('');
    setShowCreateModal(true);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFieldType('');
    setSkillLevel('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8 space-y-6">
      <section className="relative rounded-[28px] overflow-hidden bg-slate-950 text-white shadow-xl border border-slate-800 min-h-[290px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/vn-match-action.png"
            alt="Trận đấu bóng đá phong trào Việt Nam"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/35" />
        </div>

        <div className="relative z-10 grid grid-cols-[1fr_430px] gap-10 items-center p-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 uppercase tracking-[0.18em]">
                Football Connect Matchmaking
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
              Tìm đối thủ vừa sức.<br /><span className="text-emerald-400">Lên sân đúng chất.</span>
            </h1>
            <p className="text-sm text-slate-300 mt-4 max-w-xl leading-6">
              Lọc kèo theo loại sân và trình độ, xem nhanh lịch thi đấu, chi phí rồi kết nối với đội phù hợp chỉ trong vài bước.
            </p>
            <button
              onClick={openCreateMatch}
              className="mt-6 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Đăng kèo tìm đối thủ
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-md p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold">Đang mở đăng ký</p>
                  <p className="text-3xl font-black mt-1">{openMatchesCount} <span className="text-base text-slate-300">kèo đấu</span></p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/15 border border-emerald-400/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-300" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-md p-4">
              <Trophy className="w-5 h-5 text-amber-300 mb-3" />
              <div className="text-xl font-black">{matches.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tổng kèo hiện có</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-md p-4">
              <Sparkles className="w-5 h-5 text-emerald-300 mb-3" />
              <div className="text-xl font-black">{recommendations.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Kèo hợp với bạn</div>
            </div>
          </div>
        </div>
      </section>

      {isAuthenticated && (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowMyMatches(false)}
            className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${!showMyMatches ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/10' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <span className="flex items-center justify-between"><span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Users className="w-4 h-4" /></span><ChevronRight className="w-4 h-4 text-slate-400" /></span>
            <strong className="block text-sm text-slate-900 mt-3">Khám phá kèo công khai</strong>
            <span className="block text-[11px] text-slate-500 mt-1">{openMatchesCount} kèo đang chờ đối thủ</span>
          </button>
          <button onClick={() => setShowSmartModal(true)} className="rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 p-4 text-left transition-all cursor-pointer">
            <span className="flex items-center justify-between"><span className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center"><Sparkles className="w-4 h-4" /></span><ChevronRight className="w-4 h-4 text-slate-400" /></span>
            <strong className="block text-sm text-slate-900 mt-3">Gợi ý dành cho bạn</strong>
            <span className="block text-[11px] text-slate-500 mt-1">{recommendations.length} kèo dựa trên hồ sơ thi đấu</span>
          </button>
          <button
            onClick={() => { setCreateSuccess(''); setShowMyMatches(true); }}
            className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${showMyMatches ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/10' : 'bg-white border-slate-200 hover:border-amber-300'}`}
          >
            <span className="flex items-center justify-between"><span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"><ClipboardList className="w-4 h-4" /></span><ChevronRight className="w-4 h-4 text-slate-400" /></span>
            <strong className="block text-sm text-slate-900 mt-3">Quản lý kèo của tôi</strong>
            <span className="block text-[11px] text-slate-500 mt-1">{myMatches.length} kèo đã đăng</span>
          </button>
        </div>
      )}

      {isAuthenticated && showMyMatches && (
        <section className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900">Kèo của tôi</h2>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi các kèo bạn đã đăng và trạng thái kiểm duyệt của Admin.
              </p>
            </div>
            <button onClick={openCreateMatch} className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Đăng kèo mới</button>
          </div>

          {myMatches.length === 0 ? (
            <div className="py-5 text-center text-xs text-slate-500">
              Bạn chưa đăng kèo nào.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {myMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}

          {createSuccess && (
            <div className="fixed right-4 bottom-20 lg:bottom-6 z-40 max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-lg">
              {createSuccess}
            </div>
          )}
        </section>
      )}

      {!showMyMatches && (
        <section className="grid grid-cols-[280px_1fr] gap-6 items-start">
          <aside className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-slate-900 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-emerald-600" /> Bộ lọc kèo</h2>
              {hasActiveFilters && <button type="button" onClick={resetFilters} className="text-[11px] font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"><RotateCcw className="w-3 h-3" /> Đặt lại</button>}
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Tìm kiếm</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tên đội, sân, khu vực..." className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Loại sân</label>
                <div className="grid grid-cols-1 gap-2">
                  {[{ value: '', label: 'Tất cả loại sân' }, { value: '5_vs_5', label: 'Sân 5 người' }, { value: '7_vs_7', label: 'Sân 7 người' }].map((option) => (
                    <button key={option.value} type="button" onClick={() => setFieldType(option.value)} className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${fieldType === option.value ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{option.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Trình độ</label>
                <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-emerald-500">
                  <option value="">Mọi trình độ</option><option value="BEGINNER">Tập sự / Nhẹ nhàng</option><option value="INTERMEDIATE">Trung bình / Khá</option><option value="ADVANCED">Nâng cao</option>
                </select>
              </div>
            </div>
          </aside>

          <div>
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Danh sách trận đấu</p>
                <h2 className="text-2xl font-black text-slate-950 mt-1">Kèo đang tìm đối thủ</h2>
                <p className="text-xs text-slate-500 mt-1">Tìm thấy {filteredMatches.length} kèo phù hợp với lựa chọn của bạn</p>
              </div>
              <button onClick={openCreateMatch} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Tạo kèo mới</button>
            </div>
            {isLoading ? (
              <LoadingSkeleton count={4} type="card" />
            ) : filteredMatches.length === 0 ? (
              <EmptyState title="Chưa có kèo đấu nào phù hợp" description="Hãy thử bỏ bớt bộ lọc hoặc chủ động tạo kèo mới để tìm đối thủ." icon={Users} action={{ label: 'Tạo kèo đấu ngay', onClick: openCreateMatch }} />
            ) : (
              <div className="grid grid-cols-2 gap-5">{filteredMatches.map((m) => <MatchCard key={m.id} match={m} />)}</div>
            )}
          </div>
        </section>
      )}

      {/* Smart Matchmaking Modal */}
      <Modal
        isOpen={showSmartModal}
        onClose={() => setShowSmartModal(false)}
        title="✨ Thuật Toán Gợi Ý Kèo Đấu Phù Hợp"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-slate-700">
            Hệ thống dựa trên <strong className="text-emerald-700 font-bold">Vị trí ({user?.location?.district || 'Hà Nội'})</strong>, <strong className="text-emerald-700 font-bold">Trình độ ({user?.skillLevel === 'BEGINNER' ? 'Tập sự' : user?.skillLevel === 'ADVANCED' ? 'Nâng cao' : user?.skillLevel === 'PRO' ? 'Bán chuyên' : 'Trung bình / Khá'})</strong> và <strong className="text-emerald-700 font-bold">Loại sân yêu thích ({user?.preferredFieldType || '7_vs_7'})</strong> để tính điểm tương đồng.
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              Chưa tìm thấy kèo đấu tối ưu trong bán kính của bạn. Hãy thử cập nhật hồ sơ cá nhân nhé!
            </div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {recommendations.map((rec) => (
                <div
                  key={rec.match.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-500/50 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{rec.match.title}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600" /> {rec.match.venueName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                        {rec.percentage} Phù Hợp
                      </span>
                    </div>
                  </div>

                  {/* Match details & reasons */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" /> {rec.match.matchDate}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" /> {rec.match.startTime} - {rec.match.endTime}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Lý do gợi ý:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.reasons.map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-white text-emerald-800 border border-emerald-200 font-semibold"
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Link
                      to={`/matches/${rec.match.id}`}
                      onClick={() => setShowSmartModal(false)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs"
                    >
                      Xem & Tham Gia Ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Create Match Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="⚡ Đăng Kèo Tìm Đội Đối Thủ (Team vs Team)"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateMatch} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tên Đội Bóng Của Bạn  *</label>
              <input
                type="text"
                required
                value={createForm.teamAName}
                onChange={(e) => setCreateForm({ ...createForm, teamAName: e.target.value })}
                placeholder="VD: FC Cầu Giấy Stars"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">SĐT/Zalo Đội Trưởng *</label>
              <input
                type="text"
                required
                value={createForm.teamAPhone}
                onChange={(e) => setCreateForm({ ...createForm, teamAPhone: e.target.value })}
                placeholder="0912345678"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Tiêu đề kèo giao lưu *</label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="VD: FC Cầu Giấy cần tìm 1 đối cứng đá giao hữu sân 7 tối nay"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Cụm Sân Thi Đấu *</label>
              <select
                required
                value={createForm.venueId}
                onChange={(e) => setCreateForm({ ...createForm, venueId: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Quy Mô Sân Đá</label>
              <select
                value={createForm.fieldType}
                onChange={(e) => setCreateForm({ ...createForm, fieldType: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="5_vs_5">Sân 5 người (5v5)</option>
                <option value="7_vs_7">Sân 7 người (7v7)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ngày Thi Đấu</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={createForm.matchDate}
                onChange={(e) => setCreateForm({ ...createForm, matchDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Giờ bắt đầu</label>
              <input
                type="text"
                required
                value={createForm.startTime}
                onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                placeholder="19:00"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Giờ kết thúc</label>
              <input
                type="text"
                required
                value={createForm.endTime}
                onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                placeholder="20:30"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Trình độ đội</label>
              <select
                value={createForm.skillLevel}
                onChange={(e) => setCreateForm({ ...createForm, skillLevel: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="BEGINNER">Tập sự / Dưỡng sinh</option>
                <option value="INTERMEDIATE">Trung bình / Khá</option>
                <option value="ADVANCED">Nâng cao / Chuyên nghiệp</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Thể thức chia tiền sân</label>
              <select
                value={createForm.costSharing}
                onChange={(e) => setCreateForm({ ...createForm, costSharing: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="50_50"> Chia đôi tiền sân (50% - 50%)</option>
                <option value="WIN_30_LOSE_70"> Đội thắng 30% - đội thua 70%</option>
                <option value="WIN_40_LOSE_60"> Đội thắng 40% - đội thua 60%</option>
                <option value="LOOSER_PAYS"> Đội thua trả tiền sân (100%)</option>
                <option value="HOME_PAYS"> Đội chủ nhà bao tiền sân (Miễn phí Đội khách)</option>
              </select>

            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Tổng tiền thuê sân (VNĐ)</label>
              <input
                type="number"
                step="50000"
                value={createForm.totalFieldFee}
                onChange={(e) => setCreateForm({ ...createForm, totalFieldFee: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Yêu cầu & Ghi chú thêm cho Đội B</label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Yêu cầu tinh thần thể thao văn minh, không va chạm xấu, chuẩn bị trang phục rõ ràng..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? 'Đang tạo kèo...' : 'Đăng Kèo Tìm Đối Thủ'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
