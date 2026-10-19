import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, ArrowRight, Zap, Trophy, Shield } from 'lucide-react';
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


  const progressPercent = Math.min(100, Math.round(((match.currentPlayers || 1) / (match.maxPlayers || 14)) * 100));

  return (
    <div className="group bg-white border border-slate-200/90 hover:border-emerald-500/60 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-slate-900 text-white shadow-xs">
              {match.fieldType === '5_vs_5' ? 'Sân 5' : match.fieldType === '7_vs_7' ? 'Sân 7' : 'Sân 11'}
            </span>
            <Badge variant={skillColor.variant} size="sm" className="font-bold">
              {skillColor.label}
            </Badge>
          </div>
          <span
            className={`text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 ${match.status === 'OPEN'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
          >
            {match.status === 'OPEN' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang Tìm Đối Thủ
              </>
            ) : (
              'Đã Có Đối Thủ'
            )}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {match.teamAName}
        </h3>

        {/* Location & Time Box */}
        <div className="mt-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold truncate">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{match.venueName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(match.matchDate).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-700">{match.startTime} - {match.endTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Tiền sân</span>
          <span className="text-xs font-extrabold text-emerald-700">{costShareText}</span>
        </div>

        <Link
          to={`/matches/${match.id}`}
          className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-1 active:scale-95 cursor-pointer"
        >
          {match.status === 'OPEN' ? 'Bắt Kèo Ngay' : 'Xem Chi Tiết'} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
