import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  DollarSign,
  MessageSquare,
  Shield,
  CheckCircle2,
  AlertCircle,
  LogOut,
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api.js';
import { IMatch } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { GoogleMapView } from '../components/common/GoogleMapView.js';
import { useAuthStore } from '../stores/auth.store.js';

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [match, setMatch] = useState<IMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamBNameInput, setTeamBNameInput] = useState('');
  const [teamBPhoneInput, setTeamBPhoneInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchMatch = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/matches/${id}`);
      setMatch(res.data.data);
      if (user?.name) {
        setTeamBNameInput(`FC ${user.name}`);
        setTeamBPhoneInput(user.phone || '');
      }
    } catch (e) {
      console.error('Failed to load match detail:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const isUserTeamB = match?.teamBJoined && (match?.creatorId !== user?.id);

  const handleJoinMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setIsProcessing(true);
      await api.post(`/matches/${id}/join`, {
        teamBName: teamBNameInput,
        teamBPhone: teamBPhoneInput,
        teamBCaptain: user?.name
      });
      setShowJoinModal(false);
      fetchMatch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể nhận bắt kèo';
      alert(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !match) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-emerald-600">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const costShareLabel = match.costSharing === 'LOOSER_PAYS'
    ? '🏆 Đội thua trả 100% tiền sân'
    : match.costSharing === 'HOME_PAYS'
    ? '🎁 Đội A bao toàn bộ tiền sân (0đ)'
    : '🤝 Chia đôi 50% - 50% tiền sân';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back Link */}
      <Link to="/matches" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại sàn tìm đối
      </Link>

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {match.fieldType === '5_vs_5' ? 'Sân 5v5' : match.fieldType === '7_vs_7' ? 'Sân 7v7' : 'Sân 11v11'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Trình độ: {match.skillLevel}
              </span>
              <Badge variant={match.status === 'OPEN' ? 'emerald' : 'slate'} size="sm">
                {match.status === 'OPEN' ? '🟢 Đang Tìm Đội B' : '🔵 Đã Có Đối Thủ'}
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{match.title}</h1>

            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{match.venueName} - {match.venueAddress}</span>
            </p>
          </div>

          <div className="text-right sm:shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Thể thức tiền sân</span>
            <span className="text-sm font-extrabold text-emerald-700 block mt-0.5">{costShareLabel}</span>
            <span className="text-xs text-slate-500 font-bold block mt-1">Tổng tiền sân: {(match.totalFieldFee || 600000).toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {/* Team Matchup Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team A */}
          <div className="p-4 bg-white rounded-xl border border-rose-200 shadow-2xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-rose-600 tracking-wider">🔴 Đội Chủ Nhà (Team A)</span>
            <h3 className="text-lg font-black text-slate-900">{match.teamAName || 'Đội A'}</h3>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Đội trưởng: <strong>{match.teamACaptain || match.creatorName}</strong></div>
              {match.teamAPhone && <div>Liên hệ Zalo: <strong className="text-rose-700">{match.teamAPhone}</strong></div>}
            </div>
          </div>

          {/* Team B */}
          <div className={`p-4 rounded-xl border shadow-2xs space-y-2 ${
            match.status === 'FULL' || match.teamBJoined
              ? 'bg-white border-sky-200'
              : 'bg-slate-50 border-dashed border-slate-300'
          }`}>
            <span className="text-[10px] font-extrabold uppercase text-sky-600 tracking-wider">🔵 Đội Đối Thủ (Team B)</span>
            <h3 className="text-lg font-black text-slate-900">
              {match.status === 'FULL' || match.teamBJoined ? (match.teamBName || 'Đội B') : '⏳ Đang tìm Đội B đối thủ...'}
            </h3>
            <div className="text-xs text-slate-600 space-y-1">
              {match.teamBCaptain ? (
                <div>Đội trưởng: <strong>{match.teamBCaptain}</strong></div>
              ) : (
                <div className="text-slate-400">Chưa có đội nào nhận kèo cáp đấu này</div>
              )}
              {match.teamBPhone && <div>Liên hệ Zalo: <strong className="text-sky-700">{match.teamBPhone}</strong></div>}
            </div>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Ngày thi đấu</span>
            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              {new Date(match.matchDate).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Thời gian ca đá</span>
            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              {match.startTime} - {match.endTime}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Quy mô trận</span>
            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              2 Đội Trận Đấu (Team vs Team)
            </span>
          </div>
        </div>

        {match.description && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">Mô tả từ Đội A:</span>
            {match.description}
          </div>
        )}

        {/* Map Location */}
        <div className="space-y-2 pt-2">
          <span className="font-bold text-slate-900 text-xs block">📍 Vị trí địa điểm thi đấu trên Google Maps:</span>
          <GoogleMapView
            title={match.venueName}
            address={`${match.venueName}, ${match.venueAddress}`}
            height="h-64 sm:h-72"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/chat"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-200 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" /> Chat Thương Lượng Giữa 2 Đội Trưởng
          </Link>

          <div className="flex items-center gap-2">
            {match.status === 'OPEN' && match.creatorId !== user?.id && (
              <button
                onClick={() => setShowJoinModal(true)}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> ⚡ Bắt Kèo Ngay (Đăng Ký Đội B)
              </button>
            )}

            {(match.status === 'FULL' || match.teamBJoined) && (
              <span className="px-4 py-2.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
                ✓ Kèo này đã được Đội B bắt cặp
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Join Match Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="⚡ Bắt Kèo Thi Đấu Cho Đội Của Bạn (Đội B)"
      >
        <form onSubmit={handleJoinMatch} className="space-y-4 text-xs">
          <p className="text-slate-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            Bạn đang đại diện đội bóng của mình để nhận kèo giao hữu với <strong className="text-slate-900">{match.teamAName}</strong> tại <strong className="text-slate-900">{match.venueName}</strong>.
          </p>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Tên Đội Bóng Của Bạn (Đội B) *</label>
            <input
              type="text"
              required
              value={teamBNameInput}
              onChange={(e) => setTeamBNameInput(e.target.value)}
              placeholder="VD: FC Anh Em Mỹ Đình"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Số điện thoại / Zalo Đội trưởng B *</label>
            <input
              type="text"
              required
              value={teamBPhoneInput}
              onChange={(e) => setTeamBPhoneInput(e.target.value)}
              placeholder="0988776655"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
            <div>• Thể thức tiền sân: <strong className="text-emerald-700">{costShareLabel}</strong></div>
            <div>• Sau khi bấm nhận kèo, hệ thống sẽ mở phòng Chat trực tiếp với Đội trưởng {match.teamAName} để hai bên thống nhất màu áo.</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              {isProcessing ? 'Đang xác nhận...' : '🚀 Xác Nhận Bắt Kèo Ngay'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
