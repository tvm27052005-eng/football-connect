import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowRight, WalletCards, Activity } from 'lucide-react';
import { IMatch } from '../../types/index.js';
import { Badge } from '../common/Badge.js';

interface MatchCardProps {
  match: IMatch;
  onJoin?: (id: string) => void;
  isJoined?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const skillColor = {
    BEGINNER: { label: 'Tập sự / Dưỡng sinh', variant: 'blue' as const },
    INTERMEDIATE: { label: 'Trung bình / Khá', variant: 'emerald' as const },
    ADVANCED: { label: 'Nâng cao / Chuyên nghiệp', variant: 'amber' as const },
    PRO: { label: 'Cao thủ / Bán chuyên', variant: 'purple' as const }
  }[match.skillLevel || 'INTERMEDIATE'];

  const costShareText = match.costSharing === 'LOOSER_PAYS'
    ? 'Đội thua trả 100%'
    : match.costSharing === 'HOME_PAYS'
      ? `Đội ${match.teamAName || 'A'} bao sân (0đ)`
      : match.costSharing === 'WIN_30_LOSE_70'
        ? 'Thắng 30% - Thua 70%'
        : match.costSharing === 'WIN_40_LOSE_60'
          ? 'Thắng 40% - Thua 60%'
          : 'Chia đôi 50 - 50';


  const formattedDate = new Date(`${match.matchDate}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });

  return (
    <article className="group bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between min-h-[280px]">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-black bg-slate-900 text-white">
              {match.fieldType === '5_vs_5' ? 'Sân 5' : match.fieldType === '7_vs_7' ? 'Sân 7' : 'Sân 11'}
            </span>
            <Badge variant={skillColor.variant} size="sm" className="font-bold">
              {skillColor.label}
            </Badge>
          </div>
          <span
            className={`text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 ${
              match.status === 'PENDING_APPROVAL'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : match.status === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {match.status === 'PENDING_APPROVAL' ? (
              '🟡 Chờ Admin duyệt'
            ) : match.status === 'OPEN' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang Tìm Đối Thủ
              </>
            ) : (
              'Đã Có Đối Thủ'
            )}
          </span>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 mb-1.5">{match.title}</p>
        <h3 className="text-xl font-black text-slate-950 line-clamp-1 group-hover:text-emerald-700 transition-colors">{match.teamAName}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-1">Đang tìm một đối thủ phù hợp để giao lưu</p>

        <div className="mt-4 grid grid-cols-[1.1fr_0.9fr] gap-2 text-xs">
          <div className="col-span-2 flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold text-slate-800 truncate">{match.venueName}</div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">{match.venueAddress || 'Xem chi tiết địa điểm'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700 capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700">{match.startTime}–{match.endTime}</span>
          </div>
        </div>

      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><WalletCards className="w-3 h-3" /> Chia tiền sân</span>
          <span className="text-xs font-extrabold text-slate-800 truncate block mt-1">{costShareText}</span>
        </div>

        <Link
          to={`/matches/${match.id}`}
          className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
        >
          {match.status === 'OPEN' ? <><Activity className="w-3.5 h-3.5" /> Bắt kèo</> : 'Xem chi tiết'} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
};
