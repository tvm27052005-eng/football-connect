import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  User,
  Filter,
  Search,
  ArrowUpDown,
  X
} from 'lucide-react';
import { api } from '../../services/api.js';
import { IBooking } from '../../types/index.js';
import { OwnerSidebar } from '../../components/layout/OwnerSidebar.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton.js';
import { formatBookingDate, formatBookingCreationTime } from '../../components/booking/BookingCard.js';

type OwnerSortOption =
  | 'time_asc'
  | 'time_desc'
  | 'date_asc'
  | 'date_desc'
  | 'name_asc'
  | 'price_desc';

export const OwnerBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortBy, setSortBy] = useState<OwnerSortOption>('time_asc');

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

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  ) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể cập nhật trạng thái đơn';
      alert(msg);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredBookings = useMemo(() => {
    let list = Array.isArray(bookings) ? [...bookings] : [];

    // Filter by status
    if (statusFilter !== 'ALL') {
      list = list.filter((b) => b.status === statusFilter);
    }

    // Filter by date
    if (selectedDate) {
      list = list.filter((b) => b.bookingDate === selectedDate);
    }

    // Search query (Customer name, phone, field name, ID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          (b.userName && b.userName.toLowerCase().includes(q)) ||
          (b.userPhone && b.userPhone.includes(q)) ||
          (b.fieldName && b.fieldName.toLowerCase().includes(q)) ||
          b.id.toLowerCase().includes(q)
      );
    }

    // Sort list
    list.sort((a, b) => {
      switch (sortBy) {
        case 'time_asc': {
          const comp = a.startTime.localeCompare(b.startTime);
          if (comp !== 0) return comp;
          return a.bookingDate.localeCompare(b.bookingDate);
        }
        case 'time_desc': {
          const comp = b.startTime.localeCompare(a.startTime);
          if (comp !== 0) return comp;
          return a.bookingDate.localeCompare(b.bookingDate);
        }
        case 'date_asc':
          return a.bookingDate.localeCompare(b.bookingDate);
        case 'date_desc':
          return b.bookingDate.localeCompare(a.bookingDate);
        case 'name_asc':
          return (a.userName || '').localeCompare(b.userName || '', 'vi');
        case 'price_desc':
          return b.totalPrice - a.totalPrice;
        default:
          return 0;
      }
    });

    return list;
  }, [bookings, statusFilter, selectedDate, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery || selectedDate || statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDate('');
    setStatusFilter('ALL');
    setSortBy('time_asc');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <OwnerSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Lịch Đặt & Lượt Khách
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phê duyệt lượt đặt sân, sắp xếp lịch ca đá theo giờ/ngày và quản lý khách thi đấu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              📅 Lịch hôm nay ({todayStr})
            </button>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search input */}
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng, số ĐT, sân con, mã đơn..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort by dropdown */}
            <div className="lg:col-span-3 flex items-center">
              <span className="text-[11px] font-bold text-slate-500 mr-2 shrink-0 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" /> Sắp xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as OwnerSortOption)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 cursor-pointer"
              >
                <option value="time_asc">⏰ Giờ đá: Sớm nhất trước (06:00 → 23:00)</option>
                <option value="time_desc">⏰ Giờ đá: Muộn nhất trước (23:00 → 06:00)</option>
                <option value="date_asc">📅 Ngày đá: Gần nhất trước</option>
                <option value="date_desc">📅 Ngày đá: Xa nhất trước</option>
                <option value="name_asc">👤 Tên khách hàng: A → Z</option>
                <option value="price_desc">💰 Doanh thu: Cao → Thấp</option>
              </select>
            </div>

            {/* Status filter dropdown */}
            <div className="lg:col-span-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ duyệt (PENDING)</option>
                <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
                <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>

            {/* Date filter input */}
            <div className="lg:col-span-2.5 flex items-center gap-1.5">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 cursor-pointer"
                title="Lọc theo ngày đá"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer shrink-0"
                  title="Bỏ lọc ngày"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Tìm thấy <strong className="text-slate-900 font-bold">{filteredBookings.length}</strong> / {bookings.length} đơn đặt sân
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={4} type="row" />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title="Không tìm thấy đơn đặt sân nào"
            description="Chưa có lượt đặt sân nào khớp với các bộ lọc hoặc từ khóa tìm kiếm bạn chọn."
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
                      <td className="p-4">
                        <span className="font-mono font-bold text-emerald-700 block">#{b.id}</span>
                        {b.createdAt && (
                          <span className="text-[10px] text-slate-400 block mt-0.5" title="Thời điểm khách tạo đơn">
                            Đặt: {formatBookingCreationTime(b.createdAt)}
                          </span>
                        )}
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
                        <div className="text-[11px] text-slate-600 font-medium">
                          {formatBookingDate(b.bookingDate)}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {b.startTime} - {b.endTime}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-black text-slate-900">
                          {(b.totalPrice || 0).toLocaleString('vi-VN')} đ
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            b.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
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
