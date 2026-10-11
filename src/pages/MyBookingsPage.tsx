import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  AlertCircle,
  Plus,
  Star,
  Search,
  ArrowUpDown,
  Filter,
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api.js';
import { IBooking } from '../types/index.js';
import { BookingCard } from '../components/booking/BookingCard.js';
import { LoadingSkeleton, EmptyState } from '../components/common/LoadingSkeleton.js';
import { Modal } from '../components/common/Modal.js';
import { StarRating } from '../components/common/StarRating.js';

type SortOption =
  | 'date_asc'
  | 'date_desc'
  | 'time_asc'
  | 'time_desc'
  | 'venue_asc'
  | 'venue_desc'
  | 'created_desc'
  | 'price_desc'
  | 'price_asc';

type TimelineOption = 'ALL' | 'UPCOMING' | 'TODAY' | 'PAST';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [timelineFilter, setTimelineFilter] = useState<TimelineOption>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<IBooking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchMyBookings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/bookings');
      setBookings(res.data.data);
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lượt đặt sân này?')) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`, {
        reason: 'Khách hàng yêu cầu hủy từ giao diện web'
      });
      fetchMyBookings();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể hủy đơn';
      alert(msg);
    }
  };

  const handleOpenReview = (booking: IBooking) => {
    setReviewBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking || !reviewComment.trim()) {
      setReviewError('Vui lòng nhập nhận xét của bạn');
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewError('');
      await api.post('/reviews', {
        venueId: reviewBooking.venueId,
        bookingId: reviewBooking.id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewBooking(null);
      fetchMyBookings();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể gửi đánh giá';
      setReviewError(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter & Sort Bookings
  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Status filter
    if (activeTab !== 'ALL') {
      result = result.filter((b) => b.status === activeTab);
    }

    // Timeline filter (Upcoming / Today / Past)
    if (timelineFilter === 'UPCOMING') {
      result = result.filter((b) => b.bookingDate >= todayStr && b.status !== 'CANCELLED');
    } else if (timelineFilter === 'TODAY') {
      result = result.filter((b) => b.bookingDate === todayStr && b.status !== 'CANCELLED');
    } else if (timelineFilter === 'PAST') {
      result = result.filter((b) => b.bookingDate < todayStr || b.status === 'COMPLETED');
    }

    // Date filter
    if (selectedDate) {
      result = result.filter((b) => b.bookingDate === selectedDate);
    }

    // Search query filter (venueName, fieldName, address, id)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.venueName.toLowerCase().includes(q) ||
          b.fieldName.toLowerCase().includes(q) ||
          (b.venueAddress && b.venueAddress.toLowerCase().includes(q)) ||
          b.id.toLowerCase().includes(q)
      );
    }

    // Sorting logic
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc': {
          // Nearest date first (e.g. 10/10 -> 11/10)
          const comp = a.bookingDate.localeCompare(b.bookingDate);
          if (comp !== 0) return comp;
          return a.startTime.localeCompare(b.startTime);
        }
        case 'date_desc': {
          // Furthest / latest date first
          const comp = b.bookingDate.localeCompare(a.bookingDate);
          if (comp !== 0) return comp;
          return b.startTime.localeCompare(a.startTime);
        }
        case 'time_asc': {
          // Earliest slot time (e.g. 06:00 -> 23:00)
          const comp = a.startTime.localeCompare(b.startTime);
          if (comp !== 0) return comp;
          return a.bookingDate.localeCompare(b.bookingDate);
        }
        case 'time_desc': {
          // Latest slot time (e.g. 23:00 -> 06:00)
          const comp = b.startTime.localeCompare(a.startTime);
          if (comp !== 0) return comp;
          return b.bookingDate.localeCompare(a.bookingDate);
        }
        case 'venue_asc':
          return a.venueName.localeCompare(b.venueName, 'vi');
        case 'venue_desc':
          return b.venueName.localeCompare(a.venueName, 'vi');
        case 'price_desc':
          return b.totalPrice - a.totalPrice;
        case 'price_asc':
          return a.totalPrice - b.totalPrice;
        case 'created_desc':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return result;
  }, [bookings, activeTab, timelineFilter, selectedDate, searchQuery, sortBy, todayStr]);

  const hasActiveFilters = searchQuery || selectedDate || timelineFilter !== 'ALL' || activeTab !== 'ALL' || sortBy !== 'date_asc';

  const handleResetFilters = () => {
    setActiveTab('ALL');
    setTimelineFilter('ALL');
    setSortBy('date_asc');
    setSearchQuery('');
    setSelectedDate('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Lịch Đặt Sân Của Tôi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi, sắp xếp thứ tự và kiểm tra ngày giờ các ca đặt sân bóng đá của bạn.
          </p>
        </div>

        <Link
          to="/booking/create"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Đặt Sân Mới
        </Link>
      </div>

      {/* Timeline Quick Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-emerald-600" /> Thời gian:
        </span>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'UPCOMING', label: '⚡ Sắp diễn ra' },
          { key: 'TODAY', label: '🔥 Hôm nay đá' },
          { key: 'PAST', label: 'Lịch sử đã qua' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTimelineFilter(item.key as TimelineOption)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timelineFilter === item.key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên sân, sân con, địa chỉ, mã #book..."
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

          {/* Sort selector */}
          <div className="md:col-span-4 relative">
            <div className="flex items-center">
              <span className="text-[11px] font-bold text-slate-500 mr-2 shrink-0 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" /> Sắp xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 cursor-pointer"
              >
                <option value="date_asc">🕒 Ngày đá: Gần nhất trước (Sắp đá)</option>
                <option value="date_desc">📅 Ngày đá: Xa nhất trước</option>
                <option value="time_asc">⏰ Giờ đá: Sớm nhất (06:00 → 23:00)</option>
                <option value="time_desc">⏰ Giờ đá: Muộn nhất (23:00 → 06:00)</option>
                <option value="venue_asc">🔤 Tên sân: A → Z (Chữ cái)</option>
                <option value="venue_desc">🔤 Tên sân: Z → A</option>
                <option value="created_desc">⏱️ Thời gian đặt: Mới đặt gần đây</option>
                <option value="price_desc">💰 Tổng tiền: Cao đến thấp</option>
                <option value="price_asc">💰 Tổng tiền: Thấp đến cao</option>
              </select>
            </div>
          </div>

          {/* Date Picker Filter */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 cursor-pointer"
              title="Lọc theo ngày đá cụ thể"
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

        {/* Results counter & clear filters */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Đang hiển thị <strong className="text-slate-900 font-bold">{filteredBookings.length}</strong> / {bookings.length} lịch đặt sân
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'ALL', label: 'Tất cả trạng thái' },
          { key: 'CONFIRMED', label: 'Đã xác nhận' },
          { key: 'PENDING', label: 'Chờ duyệt' },
          { key: 'COMPLETED', label: 'Đã hoàn thành' },
          { key: 'CANCELLED', label: 'Đã hủy' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white font-extrabold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <LoadingSkeleton count={3} type="row" />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title="Không tìm thấy lượt đặt sân nào"
          description={
            hasActiveFilters
              ? 'Không có kết quả nào khớp với các tiêu chí tìm kiếm hoặc bộ lọc sắp xếp của bạn.'
              : 'Bạn chưa có lượt đặt sân nào trong mục này. Hãy chọn một cụm sân và đặt lịch ngay!'
          }
          icon={Calendar}
          action={
            hasActiveFilters
              ? {
                  label: 'Xóa bộ lọc để xem tất cả',
                  onClick: handleResetFilters
                }
              : {
                  label: 'Tìm và đặt sân ngay',
                  onClick: () => (window.location.href = '/venues')
                }
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={handleCancelBooking}
              onReview={handleOpenReview}
            />
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewBooking}
        onClose={() => setReviewBooking(null)}
        title="Đánh Giá Sân Bóng Sau Trận Đấu"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
          {reviewError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {reviewError}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-sm">{reviewBooking?.venueName}</div>
            <div className="text-slate-500 text-xs">
              {reviewBooking?.fieldName} • {reviewBooking?.bookingDate} ({reviewBooking?.startTime} - {reviewBooking?.endTime})
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-2">Chất lượng sân (Số sao)</label>
            <StarRating
              rating={reviewRating}
              interactive={true}
              onRatingChange={setReviewRating}
              size="lg"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Nhận xét của bạn</label>
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chất lượng mặt sân, hệ thống đèn chiếu sáng, nước uống hoặc dịch vụ phục vụ..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReviewBooking(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
