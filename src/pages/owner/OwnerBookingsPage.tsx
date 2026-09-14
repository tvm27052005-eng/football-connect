import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Phone, User, Filter } from 'lucide-react';
import { api } from '../../services/api.js';
import { IBooking } from '../../types/index.js';
import { OwnerSidebar } from '../../components/layout/OwnerSidebar.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton.js';

export const OwnerBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/bookings/owner/all');
      setBookings(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể cập nhật trạng thái đơn';
      alert(msg);
    }
  };

  const filteredBookings = (Array.isArray(bookings) ? bookings : []).filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <OwnerSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Lịch Đặt & Lượt Khách
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phê duyệt lượt đặt sân, xác nhận thu tiền và giám sát lịch trình ca đá.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium shadow-xs"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt (PENDING)</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={4} type="row" />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title="Không tìm thấy đơn đặt sân nào"
            description="Chưa có lượt đặt sân nào khớp với bộ lọc bạn chọn."
            icon={Calendar}
          />
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold">Mã Đơn</th>
                    <th className="p-4 font-bold">Khách Hàng</th>
                    <th className="p-4 font-bold">Sân & Ca Đá</th>
                    <th className="p-4 font-bold">Thanh Toán</th>
                    <th className="p-4 font-bold">Trạng Thái</th>
                    <th className="p-4 font-bold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-700">
                        #{b.id}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" /> {b.userName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {b.userPhone}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{b.fieldName}</div>
                        <div className="text-[11px] text-slate-500">
                          {b.bookingDate} ({b.startTime} - {b.endTime})
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-black text-slate-900">{(b.totalPrice || 0).toLocaleString('vi-VN')} đ</div>
                        <span className={`text-[10px] font-bold ${b.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {b.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                        </span>
                      </td>
                      <td className="p-4">
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
                          {b.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold transition-all cursor-pointer shadow-xs"
                              >
                                Xác nhận
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'CANCELLED')}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold transition-all cursor-pointer shadow-xs"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold transition-all cursor-pointer shadow-xs"
                            >
                              Xong trận
                            </button>
                          )}
                        </div>
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
