import React, { useState, useEffect } from 'react';
import { Swords, Search, ShieldCheck, CalendarRange, Clock3, Users, MapPin, Ban } from 'lucide-react';
import { api } from '../../services/api.js';
import { IMatch } from '../../types/index.js';
import { AdminSidebar } from '../../components/layout/AdminSidebar.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton.js';

const statusLabel: Record<string, string> = {
  OPEN: 'Mở kèo',
  FULL: 'Đã đủ 2 đội',
  STARTED: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy'
};

export const AdminMatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/matches');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setMatches(list);
    } catch (error) {
      console.error(error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleCancelMatch = async (matchId: string) => {
    try {
      await api.put(`/matches/${matchId}/cancel`);
      fetchMatches();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể xử lý kèo';
      alert(msg);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (m.title || '').toLowerCase().includes(q);
      const matchCreator = (m.creatorName || '').toLowerCase().includes(q);
      const matchVenue = (m.venueName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCreator && !matchVenue) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản Lý Bài Đăng Tìm Kèo</h1>
            <p className="text-xs text-slate-500 mt-1">Giám sát các bài đăng kèo, kiểm duyệt trạng thái và xử lý bài đăng vi phạm.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 shadow-xs">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên kèo, người tạo, sân..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OPEN">Mở kèo</option>
              <option value="FULL">Đã đủ 2 đội</option>
              <option value="STARTED">Đang diễn ra</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={4} type="row" />
        ) : filteredMatches.length === 0 ? (
          <EmptyState
            title="Không tìm thấy bài đăng tìm kèo"
            description="Hiện chưa có bài đăng nào phù hợp với bộ lọc của bạn."
            icon={Swords}
          />
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold">Tiêu Đề / Đội</th>
                    <th className="p-4 font-bold">Sân / Thời Gian</th>
                    <th className="p-4 font-bold">Người Tạo</th>
                    <th className="p-4 font-bold">Trạng Thái</th>
                    <th className="p-4 font-bold text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMatches.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{m.title}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {m.teamAName} vs {m.teamBName || 'Đang tìm Đội B'}
                        </div>
                      </td>
                      <td className="p-4 text-slate-700">
                        <div className="font-bold text-slate-900">{m.venueName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                          <CalendarRange className="w-3 h-3" /> {m.matchDate}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                          <Clock3 className="w-3 h-3" /> {m.startTime} - {m.endTime}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{m.creatorName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" /> {m.currentPlayers}/{m.maxPlayers} người
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {m.venueAddress || 'Cập nhật địa chỉ'}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            m.status === 'OPEN'
                              ? 'amber'
                              : m.status === 'FULL'
                              ? 'emerald'
                              : m.status === 'STARTED'
                              ? 'blue'
                              : m.status === 'COMPLETED'
                              ? 'slate'
                              : 'rose'
                          }
                          size="sm"
                        >
                          {statusLabel[m.status] || m.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {m.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancelMatch(m.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Ban className="w-3.5 h-3.5" /> Hủy kèo
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
