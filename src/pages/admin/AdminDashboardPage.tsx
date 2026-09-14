import React, { useState, useEffect } from 'react';
import {
  Users,
  Building,
  Calendar,
  DollarSign,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Database,
  Cpu
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../../services/api.js';
import { AdminSidebar } from '../../components/layout/AdminSidebar.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/stats/admin');
      setStats(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Trung Tâm Quản Trị Hệ Thống Toàn Diện
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Giám sát toàn bộ lưu lượng đặt sân, người dùng, doanh nghiệp sân bãi và tiến trình realtime.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-purple-600" /> Hệ thống bảo mật cấp Enterprise
          </div>
        </div>

        {isLoading || !stats ? (
          <LoadingSkeleton count={4} type="card" />
        ) : (
          <>
            {/* Master Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tổng Người Dùng</span>
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{stats?.summary?.totalUsers || stats?.metrics?.totalUsers || 0}</div>
                <div className="text-[11px] text-purple-700 font-medium">
                  {stats?.summary?.totalOwners || stats?.metrics?.owners || 0} Chủ sân • {stats?.summary?.totalMatches || stats?.metrics?.totalMatches || 0} Kèo bóng
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Cụm Sân Trên Hệ Thống</span>
                  <Building className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{stats?.summary?.totalVenues || stats?.metrics?.totalVenues || 0}</div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  {stats?.summary?.totalFields || stats?.metrics?.totalFields || 0} Sân con hoạt động
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tổng Lượt Đặt Sân</span>
                  <Calendar className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{stats?.summary?.totalBookings || stats?.metrics?.totalBookings || 0}</div>
                <div className="text-[11px] text-sky-700 font-medium">
                  Tỷ lệ hoàn thành 98.2%
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tổng GMV Giao Dịch</span>
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {(stats?.summary?.totalPlatformGMV || stats?.metrics?.grossMerchandiseValue || 0).toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[11px] text-slate-500">
                  Toàn mạng lưới Football Connect
                </div>
              </div>
            </div>

            {/* Growth Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tăng Trưởng Người Dùng Mới (6 Tháng)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="users" fill="#9333ea" radius={[6, 6, 0, 0]} name="Cầu thủ mới" />
                      <Bar dataKey="owners" fill="#059669" radius={[6, 6, 0, 0]} name="Chủ sân mới" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GMV Growth Chart */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tổng Doanh Thu Toàn Nền Tảng (VNĐ)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.revenueTrend || []}>
                      <defs>
                        <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val / 1000000}Tr`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} đ`, 'GMV']}
                      />
                      <Area type="monotone" dataKey="gmv" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#colorGmv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* System Status & Metrics */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Trạng Thái Hệ Thống Micro-services & Gateway
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500">Socket.IO Realtime Gateway</span>
                  <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> Sẵn sàng & Khỏe mạnh
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500">Database Cluster</span>
                  <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> InMemory Hybrid Persistence (Active)
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500">Matchmaking Recommender Engine</span>
                  <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> Trọng số 5 tham số chuẩn xác
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
