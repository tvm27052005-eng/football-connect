import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  Star,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
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
import { BookingStatus, IOwnerStats, OwnerStatsRange } from '../../types/index.js';

const RANGE_OPTIONS: { value: OwnerStatsRange; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: '6m', label: '6 tháng' }
];

// Các ca bắt đầu vào giờ cao điểm (giá +15%)
const PEAK_HOUR_STARTS = ['17:30', '19:00', '20:30'];

const STATUS_META: Record<BookingStatus, { label: string; variant: 'amber' | 'emerald' | 'blue' | 'rose' }> = {
  PENDING: { label: 'Chờ duyệt', variant: 'amber' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'emerald' },
  COMPLETED: { label: 'Hoàn thành', variant: 'blue' },
  CANCELLED: { label: 'Đã hủy', variant: 'rose' }
};

const tooltipStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
};

const formatVnd = (val: number) => `${Math.round(val || 0).toLocaleString('vi-VN')} đ`;
const formatShortVnd = (val: number) => {
  if (val >= 1_000_000) return `${Math.round((val / 1_000_000) * 10) / 10}Tr`;
  if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
  return `${val}`;
};
const formatDate = (s: string) => s.split('-').reverse().join('/');
const fieldTypeLabel = (t: string) => (t === '5_vs_5' ? 'Sân 5' : t === '7_vs_7' ? 'Sân 7' : 'Sân 11');

const GrowthBadge: React.FC<{ value: number | null; suffix: string }> = ({ value, suffix }) => {
  if (value === null) {
    return <span className="text-[11px] text-slate-500">Chưa có dữ liệu {suffix}</span>;
  }
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-700' : 'text-rose-600'}`}>
      <Icon className="w-3.5 h-3.5" />
      {up ? '+' : ''}{value}% {suffix}
    </span>
  );
};

export const OwnerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<IOwnerStats | null>(null);
  const [range, setRange] = useState<OwnerStatsRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async (silent = false) => {
    try {
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);
      setError('');
      const res = await api.get('/stats/owner', { params: { range } });
      setStats(res.data.data);
    } catch (e) {
      console.error('Failed to load owner stats:', e);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const summary = stats?.summary;
  const rangeLabel = RANGE_OPTIONS.find(o => o.value === range)?.label.toLowerCase() || '';
  const growthSuffix = 'so với kỳ trước';
  const hasBookings = (summary?.totalBookings || 0) > 0;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <OwnerSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tổng Quan Doanh Thu
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phân tích doanh thu, tỷ lệ lấp đầy khung giờ và hiệu suất khai thác các sân con.
              {stats && (
                <> Kỳ đang xem: <span className="font-semibold text-slate-700">{formatDate(stats.period.from)} – {formatDate(stats.period.to)}</span>.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    range === opt.value ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchStats(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {stats ? `Cập nhật ${new Date(stats.generatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Làm mới'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {isLoading || !stats || !summary ? (
          !error && <LoadingSkeleton count={4} type="card" />
        ) : (
          <>
            {/* KPI chính */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Doanh Thu {rangeLabel}</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600">{formatVnd(summary.periodRevenue)}</div>
                <GrowthBadge value={summary.revenueGrowth} suffix={growthSuffix} />
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Doanh Thu Hôm Nay</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600">{formatVnd(summary.todayRevenue)}</div>
                <div className="text-[11px] text-slate-500">{summary.todayBookings} lượt đặt trong ngày</div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tỷ Lệ Lấp Đầy</span>
                  <Clock className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-black text-sky-600">{summary.utilizationRate}%</div>
                <div className="text-[11px] text-slate-500">
                  {summary.peakSlot ? `Đặt nhiều nhất ${summary.peakSlot}` : `${summary.activeFields}/${summary.totalFields} sân đang hoạt động`}
                </div>
              </div>

              <Link
                to="/owner/bookings"
                className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs hover:border-rose-300 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Đơn Đang Chờ Duyệt</span>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-600">{summary.pendingBookings}</div>
                <div className="text-[11px] text-slate-500">
                  {summary.pendingBookings > 0 ? 'Bấm để xử lý ngay →' : 'Không có đơn tồn đọng'}
                </div>
              </Link>
            </div>

            {/* KPI phụ */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Tỷ lệ hủy',
                  value: `${summary.cancellationRate}%`,
                  sub: 'Trên tổng số đơn trong kỳ',
                  icon: XCircle,
                  color: 'text-rose-600'
                },
                {
                  label: 'Đánh giá TB',
                  value: summary.avgRating ? `${summary.avgRating} / 5` : 'Chưa có',
                  sub: `${summary.reviewCount} lượt đánh giá`,
                  icon: Star,
                  color: 'text-amber-500'
                }
              ].map(item => (
                <div key={item.label} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500">{item.label}</div>
                    <div className="text-lg font-black text-slate-900 truncate">{item.value}</div>
                    <div className="text-[11px] text-slate-500">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {!hasBookings ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center space-y-2">
                <BarChart3 className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800">Chưa có lượt đặt sân nào</h3>
                <p className="text-sm text-slate-500">
                  Khi khách hàng bắt đầu đặt sân, biểu đồ doanh thu và hiệu suất sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <>
                {/* Xu hướng doanh thu trong kỳ */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Xu Hướng Doanh Thu {range === '6m' ? '(theo tuần)' : '(theo ngày)'}
                    </h3>
                    <span className="text-xs text-slate-500">
                      Kỳ trước: <span className="font-semibold text-slate-700">{formatVnd(summary.prevPeriodRevenue)}</span>
                    </span>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.dailyRevenue}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={11} minTickGap={16} />
                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatShortVnd} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(val: any, name: any) =>
                            name === 'revenue' ? [formatVnd(Number(val)), 'Doanh thu'] : [`${val} lượt`, 'Lượt đặt']
                          }
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 6 tháng & theo thứ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Doanh Thu 6 Tháng Gần Nhất
                      </h3>
                      <span className="text-xs text-slate-500">
                        Tổng tích lũy: <span className="font-semibold text-emerald-700">{formatVnd(summary.totalRevenue)}</span>
                      </span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatShortVnd} />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(val: any) => [formatVnd(Number(val)), 'Doanh thu']}
                          />
                          <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Lượt Đặt Sân Theo Thứ Trong Tuần
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.weekdayStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                          <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const row = payload[0].payload as IOwnerStats['weekdayStats'][number];
                              return (
                                <div style={tooltipStyle} className="border px-3 py-2 text-xs space-y-0.5">
                                  <div className="font-bold text-slate-900">{label}</div>
                                  <div className="text-amber-700">{row.bookings} lượt đặt</div>
                                  <div className="text-emerald-700">{formatVnd(row.revenue)}</div>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="bookings" fill="#d97706" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Khung giờ & sân con */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Tỷ Lệ Đặt Chỗ Theo Khung Giờ
                    </h3>
                    <div className="space-y-3">
                      {stats.timeSlotStats.map(item => (
                        <div key={item.slot} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              {item.slot}
                              {PEAK_HOUR_STARTS.includes(item.slot.split('-')[0]) && <Badge variant="amber" className="ml-2">Cao điểm</Badge>}
                              {item.slot === summary.peakSlot && <Badge variant="emerald" className="ml-2">Đặt nhiều nhất</Badge>}
                            </span>
                            <span className="text-emerald-700 font-bold">
                              {item.rate}% ({item.bookings} lượt)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${item.rate}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Hiệu Suất Từng Sân Con
                    </h3>
                    <div className="space-y-3">
                      {stats.fieldStats.map((f, idx) => (
                        <div key={f.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {idx === 0 && f.periodRevenue > 0 && <span className="mr-1">🏆</span>}
                                {f.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {fieldTypeLabel(f.fieldType)} • {f.periodBookings} lượt trong kỳ • {f.venueName}
                                {f.status !== 'ACTIVE' && <span className="text-rose-600"> • Tạm ngưng</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-black text-emerald-700">{formatVnd(f.periodRevenue)}</div>
                              <span className="text-[10px] text-slate-500">Tổng: {formatVnd(f.revenue)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-600 rounded-full" style={{ width: `${f.utilization}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500 w-20 text-right">Lấp đầy {f.utilization}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Đơn đặt gần đây */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Đơn Đặt Sân Gần Đây
                    </h3>
                    <Link to="/owner/bookings" className="text-xs font-bold text-emerald-700 hover:underline">
                      Xem tất cả →
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200">
                          <th className="py-2 pr-3 font-semibold">Khách hàng</th>
                          <th className="py-2 pr-3 font-semibold">Sân</th>
                          <th className="py-2 pr-3 font-semibold">Lịch đá</th>
                          <th className="py-2 pr-3 font-semibold text-right">Số tiền</th>
                          <th className="py-2 font-semibold text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentBookings.map(b => (
                          <tr key={b.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-2.5 pr-3">
                              <div className="font-semibold text-slate-900">{b.userName || 'Khách hàng'}</div>
                              <div className="text-[10px] text-slate-500">{b.userPhone}</div>
                            </td>
                            <td className="py-2.5 pr-3 text-slate-700">{b.fieldName}</td>
                            <td className="py-2.5 pr-3 text-slate-700 whitespace-nowrap">
                              {formatDate(b.bookingDate)} • {b.startTime}-{b.endTime}
                            </td>
                            <td className="py-2.5 pr-3 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatVnd(b.totalPrice)}
                            </td>
                            <td className="py-2.5 text-right">
                              <Badge variant={STATUS_META[b.status].variant}>{STATUS_META[b.status].label}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};
