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
  ClipboardList
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Action Photo */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 p-6 sm:p-10 text-white shadow-xl border border-slate-800">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/vn-match-action.png"
            alt="Trận đấu bóng đá phong trào Việt Nam"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/60" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md uppercase tracking-wider">
                ⚡ Sàn Đấu & Tìm Đối Thủ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Kèo Đá Bóng & Ghép Đội Trực Tuyến
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Tham gia ngay các trận đấu đang thiếu chân hoặc tạo kèo mới để tìm đối thủ xứng tầm.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    setCreateSuccess('');
                    setShowMyMatches((current) => !current);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    showMyMatches
                      ? 'bg-amber-300 text-amber-950'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" /> Kèo của tôi ({myMatches.length})
                </button>
                <button
                  onClick={() => setShowSmartModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" /> Kèo Phù Hợp ({recommendations.length})
                </button>
              </>
            )}

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  window.location.href = '/login';
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5 border border-white/20 backdrop-blur-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tạo Kèo Mới
            </button>
          </div>
        </div>
      </div>

      {isAuthenticated && showMyMatches && (
        <section className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-900">Kèo của tôi</h2>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi các kèo bạn đã đăng và trạng thái kiểm duyệt của Admin.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              {myMatches.length} kèo
            </span>
          </div>

          {myMatches.length === 0 ? (
            <div className="py-5 text-center text-xs text-slate-500">
              Bạn chưa đăng kèo nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* Filter Row */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề trận đấu, sân bóng, khu vực..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Tất cả loại sân</option>
            <option value="5_vs_5">Sân 5 người</option>
            <option value="7_vs_7">Sân 7 người</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Tất cả trình độ</option>
            <option value="BEGINNER">Tập sự / Nhẹ nhàng</option>
            <option value="INTERMEDIATE">Trung bình / Khá</option>
            <option value="ADVANCED">Nâng cao / Chuyên nghiệp</option>
          </select>
        </div>
      </div>

      {/* Matches Grid */}
      {isLoading ? (
        <LoadingSkeleton count={6} type="card" />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          title="Chưa có kèo đấu nào phù hợp"
          description="Hiện tại chưa có trận đấu nào theo tiêu chí bạn chọn. Hãy là người đầu tiên tạo kèo mới nhé!"
          icon={Users}
          action={{
            label: 'Tạo kèo đấu ngay',
            onClick: () => setShowCreateModal(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
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
