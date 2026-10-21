import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  Grid3X3,
  CheckCircle2,
  AlertCircle,
  Users
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
import { OwnerSidebar } from '../../components/layout/OwnerSidebar.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';

export const OwnerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/stats/owner');
      setStats(res.data.data);
    } catch (e) {
      console.error('Failed to load owner stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <OwnerSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Báo Cáo & Thống Kê Hoạt Động Cụm Sân
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phân tích doanh thu, tỷ lệ lấp đầy khung giờ và hiệu suất khai thác các sân con.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            ⚡ Trạng thái: {stats?.summary?.totalVenues || 0} cụm sân
          </span>
        </div>

        {isLoading || !stats ? (
          <LoadingSkeleton count={4} type="card" />
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tổng Doanh Thu</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {(stats?.summary?.totalRevenue || 0).toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  {stats?.summary?.revenueChangePercent > 0 ? '+' : ''}
                  {stats?.summary?.revenueChangePercent || 0}% so với tháng trước
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Doanh Thu Hôm Nay</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {(stats?.summary?.todayRevenue || 0).toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[11px] text-slate-500">
                  {stats?.summary?.todayBookings || 0} lượt đặt trong ngày
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tỷ Lệ Lấp Đầy Giờ Vàng</span>
                  <Clock className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-black text-sky-600">
                  {stats?.summary?.utilizationRate || '0%'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {stats?.summary?.peakSlot === 'Chưa có dữ liệu'
                    ? 'Chưa có dữ liệu đặt sân'
                    : `Khung giờ nhiều khách nhất: ${stats?.summary?.peakSlot}`}
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Đơn Đang Chờ Duyệt</span>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-600">
                  {stats?.summary?.pendingBookings || 0}
                </div>
                <div className="text-[11px] text-slate-500">
                  Cần xử lý kịp thời
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Chart */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Doanh Thu 6 Tháng Gần Nhất (VNĐ)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyRevenue}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val / 1000000}Tr`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Bookings (Last 7 Days) */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Lượt Khách Đặt Sân 7 Ngày Gần Nhất
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: any, name: any) => [name === 'revenue' ? `${Number(val).toLocaleString('vi-VN')} đ` : `${val} lượt`, name === 'revenue' ? 'Doanh thu' : 'Lượt đặt']}
                      />
                      <Bar dataKey="bookings" fill="#d97706" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Time Slot Performance & Field Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Peak Slots */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tỷ Lệ Đặt Chỗ Theo Khung Giờ (Ca 90 Phút)
                </h3>
                <div className="space-y-3">
                  {stats.timeSlotStats.map((item: any) => (
                    <div key={item.slot} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{item.slot}</span>
                        <span className="text-emerald-700 font-bold">{item.rate} ({item.bookings} lượt)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: item.rate }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Utilization */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Hiệu Suất Từng Sân Con
                </h3>
                <div className="space-y-3">
                  {stats.fieldStats.map((f: any) => (
                    <div key={f.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{f.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {f.fieldType === '5_vs_5' ? 'Sân 5' : f.fieldType === '7_vs_7' ? 'Sân 7' : 'Sân 11'} • {f.totalBookings} lượt đặt
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-700">{f.revenue.toLocaleString('vi-VN')} đ</div>
                        <span className="text-[10px] text-slate-500">Lấp đầy: {f.utilization}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
