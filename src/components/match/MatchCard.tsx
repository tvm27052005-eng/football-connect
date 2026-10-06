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
    ? '🏆 Đội thua trả 100%'
    : match.costSharing === 'HOME_PAYS'
    ? '🎁 Đội A bao sân (0đ)'
    : '🤝 Chia đôi 50 - 50';

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
            className={`text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 ${
              match.status === 'OPEN'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {match.status === 'OPEN' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang Tìm Đối
              </>
            ) : (
              'Đã Đủ Kèo'
            )}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {match.title}
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

        {/* Team Matchup Box (Team A vs Team B) */}
        <div className="mt-3.5 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
          <div className="flex-1 text-center p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 truncate">
            <div className="text-[10px] font-extrabold uppercase text-rose-500">Đội Chủ Nhà</div>
            <div className="text-xs font-black truncate">{match.teamAName || 'Đội A'}</div>
          </div>

          <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
            VS
          </div>

          <div className={`flex-1 text-center p-2 rounded-xl border truncate ${
            match.status === 'FULL' || match.teamBJoined
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-white border-dashed border-slate-300 text-slate-400'
          }`}>
            <div className="text-[10px] font-extrabold uppercase text-slate-400">Đội Đối Thủ</div>
            <div className="text-xs font-black truncate">
              {match.teamBName || 'Đang chờ bắt kèo...'}
            </div>
          </div>
        </div>

        {/* Player slots progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" /> Cầu thủ đã tham gia:
            </span>
            <span className="font-extrabold text-slate-800">
              {match.currentPlayers || 1}/{match.maxPlayers || 14}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
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
