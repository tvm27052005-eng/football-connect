import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Trophy, DollarSign, ArrowRight } from 'lucide-react';
import { IMatch } from '../../types/index.js';
import { Badge } from '../common/Badge.js';

interface MatchCardProps {
  match: IMatch;
  onJoin?: (id: string) => void;
  isJoined?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match
}) => {
  const skillColor = {
    BEGINNER: { label: 'Tập sự / Dưỡng sinh', variant: 'blue' as const },
    INTERMEDIATE: { label: 'Trung bình / Khá', variant: 'emerald' as const },
    ADVANCED: { label: 'Nâng cao / Chuyên nghiệp', variant: 'amber' as const },
    PRO: { label: 'Cao thủ / Bán chuyên', variant: 'purple' as const }
  }[match.skillLevel || 'INTERMEDIATE'];

  const costShareText = match.costSharing === 'LOOSER_PAYS'
    ? '🏆 Đội thua trả tiền sân'
    : match.costSharing === 'HOME_PAYS'
    ? '🎁 Đội A bao tiền sân (0đ)'
    : '🤝 Chia đôi tiền sân (50-50)';

  return (
    <div className="bg-white border border-slate-200/90 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xs hover:shadow-lg space-y-4 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
              {match.fieldType === '5_vs_5' ? 'Sân 5' : match.fieldType === '7_vs_7' ? 'Sân 7' : 'Sân 11'}
            </span>
            <Badge variant={skillColor.variant} size="sm">
              {skillColor.label}
            </Badge>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              match.status === 'OPEN'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {match.status === 'OPEN' ? '🟢 Tìm Đội Đối Thủ' : '🔵 Đã Cáp Đủ Kèo'}
          </span>
        </div>

        {/* Match Title */}
        <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700">
          {match.title}
        </h3>

        {/* Location & Time */}
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{match.venueName} - {match.venueAddress}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(match.matchDate).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{match.startTime} - {match.endTime}</span>
            </div>
          </div>
        </div>

        {/* Team A vs Team B Display */}
        <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cặp Đấu (Team vs Team):</div>
          <div className="flex items-center justify-between text-xs gap-2">
            <div className="flex-1 p-2 bg-rose-50 border border-rose-200 rounded-lg text-center font-bold text-rose-800 truncate">
              🔴 {match.teamAName || 'Đội A'}
            </div>
            <span className="font-black text-slate-400 text-xs shrink-0">VS</span>
            <div className={`flex-1 p-2 border rounded-lg text-center font-bold text-xs truncate ${
              match.status === 'FULL' || match.teamBJoined
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-white border-dashed border-slate-300 text-slate-400'
            }`}>
              🔵 {match.teamBName || 'Đang tìm Đội B...'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Creator & Cost Share */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Thể thức tiền sân:</span>
          <span className="text-xs font-bold text-emerald-700 block">{costShareText}</span>
        </div>

        <Link
          to={`/matches/${match.id}`}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center gap-1 cursor-pointer"
        >
          {match.status === 'OPEN' ? '⚡ Bắt Kèo Đội B' : 'Chi Tiết'} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
