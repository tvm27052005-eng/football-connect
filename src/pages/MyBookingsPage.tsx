import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  ArrowUpDown,
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  Phone,
  Ban
} from 'lucide-react';
import { api } from '../services/api.js';
import { IBooking } from '../types/index.js';
import { BookingCard, formatBookingCreationTime } from '../components/booking/BookingCard.js';
import { LoadingSkeleton, EmptyState } from '../components/common/LoadingSkeleton.js';
import { Modal } from '../components/common/Modal.js';
import { StarRating } from '../components/common/StarRating.js';

type SortOption =
  | 'date_asc'
  | 'date_desc'
  | 'venue_asc'
  | 'venue_desc'

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

  // Cancel Modal State
  const [cancelBookingTarget, setCancelBookingTarget] = useState<IBooking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const getCancelInfo = (booking: IBooking) => {
    const now = new Date();

    let isTooCloseToMatch = false;
    let hoursUntilMatch = 999;
    if (booking.bookingDate && booking.startTime) {
      const matchStart = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
      hoursUntilMatch = (matchStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilMatch <= 2) {
        isTooCloseToMatch = true;
      }
    }

    let isOverOneHour = false;
    let minutesSinceBooking = 0;
    if (booking.createdAt) {
      const createdTime = new Date(booking.createdAt).getTime();
      minutesSinceBooking = Math.max(0, Math.floor((now.getTime() - createdTime) / (1000 * 60)));
      if (minutesSinceBooking > 60) {
        isOverOneHour = true;
      }
    } else {
      isOverOneHour = true;
    }

    const ownerPhone = booking.ownerPhone;

    return {
      isTooCloseToMatch,
      hoursUntilMatch,
      isOverOneHour,
      minutesSinceBooking,
      ownerPhone
    };
  };

  const handleOpenCancelModal = (booking: IBooking) => {
    setCancelBookingTarget(booking);
    setCancelError('');
  };

  const handleConfirmCancelBooking = async () => {
    if (!cancelBookingTarget) return;
    try {
      setIsCancelling(true);
      setCancelError('');
      const info = getCancelInfo(cancelBookingTarget);
      const reason = info.isOverOneHour
        ? 'Người dùng hủy sau 1 giờ (không hoàn tiền sân)'
        : 'Người dùng hủy trong vòng 1 giờ cho phép';

      await api.put(`/bookings/${cancelBookingTarget.id}/cancel`, { reason });
      setCancelBookingTarget(null);
      await fetchMyBookings();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể hủy đơn đặt sân';
      setCancelError(msg);
    } finally {
      setIsCancelling(false);
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
    if (!reviewBooking) return;

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
        case 'venue_asc':
          return a.venueName.localeCompare(b.venueName, 'vi');
        case 'venue_desc':
          return b.venueName.localeCompare(a.venueName, 'vi');
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
          { key: 'UPCOMING', label: 'Sắp diễn ra' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTimelineFilter(item.key as TimelineOption)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${timelineFilter === item.key
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
              placeholder="Tìm theo tên sân, sân con, địa chỉ"
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
                <option value="date_asc">Ngày đá: Gần nhất trước (Sắp đá)</option>
                <option value="date_desc"> Ngày đá: Xa nhất trước</option>
                <option value="venue_asc"> Tên sân: A → Z </option>
                <option value="venue_desc"> Tên sân: Z → A</option>
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
          { key: 'CANCELLED', label: 'Đã hủy' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${activeTab === tab.key
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
              onCancel={handleOpenCancelModal}
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
            <label className="block text-slate-700 font-bold mb-1">
              Nhận xét của bạn <span className="text-slate-400 font-normal text-[11px]">(tùy chọn)</span>
            </label>
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

      {/* Cancellation Modal (Message Box) */}
      <Modal
        isOpen={!!cancelBookingTarget}
        onClose={() => {
          if (!isCancelling) {
            setCancelBookingTarget(null);
            setCancelError('');
          }
        }}
        title="Thông Báo Hủy Đặt Sân"
      >
        {cancelBookingTarget && (() => {
          const { isTooCloseToMatch, isOverOneHour, ownerPhone, minutesSinceBooking } = getCancelInfo(cancelBookingTarget);

          return (
            <div className="space-y-4 text-xs">
              {cancelError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              {/* Thông tin tóm tắt đơn đặt sân */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{cancelBookingTarget.venueName}</div>
                    <div className="text-slate-600 text-xs font-medium">
                      {cancelBookingTarget.fieldName} ({cancelBookingTarget.fieldType === '5_vs_5' ? 'Sân 5 người' : 'Sân 7 người'})
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {cancelBookingTarget.totalPrice?.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Ngày: <strong>{cancelBookingTarget.bookingDate}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Giờ: <strong>{cancelBookingTarget.startTime} - {cancelBookingTarget.endTime}</strong></span>
                  </div>
                </div>

                {cancelBookingTarget.createdAt && (
                  <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-200/60">
                    <span>Thời gian đặt:</span>
                    <span className="font-medium text-slate-700">
                      {formatBookingCreationTime(cancelBookingTarget.createdAt)}
                      {minutesSinceBooking > 0 && ` (${minutesSinceBooking} phút trước)`}
                    </span>
                  </div>
                )}
              </div>

              {/* check giờ đặt */}
              {isTooCloseToMatch ? (
                /* Sát giờ thi đấu */
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-rose-800 text-sm leading-snug">
                        Không thể hủy sân!
                      </div>
                      <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                        Bạn đang đặt sân sát giờ thi đấu (dưới 2 tiếng trước giờ bóng lăn hoặc trận đấu đang diễn ra). Theo quy định, đơn đặt sân này <strong>không thể hủy</strong> trên hệ thống.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/90 rounded-lg border border-amber-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-slate-500 text-[11px]">Hotline chủ sân hỗ trợ:</div>
                      <div className="text-slate-900 font-extrabold text-sm">{ownerPhone}</div>
                    </div>
                  </div>
                </div>
              ) : isOverOneHour ? (
                /* Quá thời gian trong vòng 1 tiếng từ lúc đặt sân */
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-rose-800 text-sm leading-snug">
                        Bạn đã quá thời gian hủy sân cho phép, nếu ấn xác nhận hủy sân sẽ không được hoàn tiền sân
                      </div>
                      <p className="text-rose-700/90 text-[11px] mt-1 leading-relaxed">
                        Quy định hoàn tiền: Hệ thống chỉ hỗ trợ hoàn tiền sân khi quý khách thực hiện yêu cầu hủy trong vòng 1 tiếng kể từ lúc đặt sân.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200 text-[11px] text-slate-700 flex items-center justify-between">
                    <span>Số điện thoại chủ sân:</span>
                    <a href={`tel:${ownerPhone}`} className="font-bold text-emerald-700 flex items-center gap-1 hover:underline">
                      <Phone className="w-3 h-3" /> {ownerPhone}
                    </a>
                  </div>
                </div>
              ) : (
                /* TRƯỜNG HỢP 2: Khi trong thời gian 1 tiếng cho phép */
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-300 text-sky-950 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-sky-900 text-sm leading-snug">
                        Bạn có chắc chắn muốn hủy sân. Liên hệ số chủ sân &quot;{ownerPhone}&quot; để nhận lại tiền sân
                      </div>
                      <p className="text-sky-800/90 text-[11px] mt-1 leading-relaxed">
                        Đơn đặt vẫn nằm trong thời gian 1 tiếng cho phép. Quý khách vui lòng liên hệ trực tiếp với chủ sân để làm thủ tục nhận lại tiền sân.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/90 rounded-lg border border-sky-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Số điện thoại chủ sân:</span>
                      <strong className="text-slate-900 text-sm">{ownerPhone}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Xác nhận & Không xác nhận */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                {isTooCloseToMatch ? (
                  <button
                    type="button"
                    onClick={() => setCancelBookingTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => setCancelBookingTarget(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Không xác nhận
                    </button>
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={handleConfirmCancelBooking}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isCancelling ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
