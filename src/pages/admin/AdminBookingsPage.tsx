import React, { useState, useEffect } from 'react';
import { Calendar, Search } from 'lucide-react';
import { api } from '../../services/api.js';
import { IBooking } from '../../types/index.js';
import { AdminSidebar } from '../../components/layout/AdminSidebar.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton.js';

const bookingStatusLabel: Record<string, string> = {
  CONFIRMED: 'Đã xác nhận',
  PENDING: 'Chờ duyệt',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy'
};

const paymentStatusLabel: Record<string, string> = {
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',
  REFUNDED: 'Hoàn trả'
};

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAllBookings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/bookings/admin/all');
      setBookings(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const filteredBookings = (Array.isArray(bookings) ? bookings : []).filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = b.id.toLowerCase().includes(q);
      const matchUser = (b.userName || '').toLowerCase().includes(q);
      const matchVenue = (b.venueName || '').toLowerCase().includes(q);
      if (!matchCode && !matchUser && !matchVenue) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sổ Cái Lịch Đặt Sân Toàn Hệ Thống
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu booking thời gian thực trên tất cả các cụm sân bóng đối tác.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 shadow-xs">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn (#...), tên khách, cụm sân..."
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
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={4} type="row" />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title="Không tìm thấy lượt đặt nào"
            description="Chưa có dữ liệu đặt sân nào phù hợp với bộ lọc."
            icon={Calendar}
          />
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold">Mã Đơn</th>
                    <th className="p-4 font-bold">Người Đặt</th>
                    <th className="p-4 font-bold">Cụm Sân / Sân Con</th>
                    <th className="p-4 font-bold">Lịch Thi Đấu</th>
                    <th className="p-4 font-bold">Giá Trị</th>
                    <th className="p-4 font-bold text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="p-4 font-mono font-bold text-purple-700">#{b.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{b.userName}</div>
                        <div className="text-[10px] text-slate-500">{b.userPhone}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{b.venueName}</div>
                        <div className="text-[10px] text-slate-500">{b.fieldName}</div>
                      </td>
                      <td className="p-4 text-slate-700">
                        <div>{b.bookingDate}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">{b.startTime} - {b.endTime}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-black text-slate-900">{(b.totalPrice || 0).toLocaleString('vi-VN')} đ</div>
                        <span className="text-[10px] text-slate-500 uppercase">{paymentStatusLabel[b.paymentStatus] || b.paymentStatus}</span>
                      </td>
                      <td className="p-4 text-right">
                        <Badge
                          variant={
                            b.status === 'CONFIRMED'
                              ? 'emerald'
                              : b.status === 'PENDING'
                              ? 'amber'
                              : b.status === 'COMPLETED'
                              ? 'blue'
                              : 'rose'
                          }
                          size="sm"
                        >
                          {bookingStatusLabel[b.status] || b.status}
                        </Badge>
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
