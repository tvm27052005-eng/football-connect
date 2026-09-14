import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, Plus, Star } from 'lucide-react';
import { api } from '../services/api.js';
import { IBooking } from '../types/index.js';
import { BookingCard } from '../components/booking/BookingCard.js';
import { LoadingSkeleton, EmptyState } from '../components/common/LoadingSkeleton.js';
import { Modal } from '../components/common/Modal.js';
import { StarRating } from '../components/common/StarRating.js';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');
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

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Lịch Đặt Sân Của Tôi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi danh sách các ca đặt sân, trạng thái giữ chỗ và lịch sử thi đấu.
          </p>
        </div>

        <Link
          to="/booking/create"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Đặt Sân Mới
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'ALL', label: 'Tất cả đơn' },
          { key: 'CONFIRMED', label: 'Đã xác nhận' },
          { key: 'PENDING', label: 'Chờ duyệt' },
          { key: 'COMPLETED', label: 'Đã hoàn thành' },
          { key: 'CANCELLED', label: 'Đã hủy' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
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
          title="Chưa có lượt đặt sân nào"
          description="Bạn chưa có lượt đặt sân nào trong mục này. Hãy chọn một cụm sân và đặt lịch ngay!"
          icon={Calendar}
          action={{
            label: 'Tìm và đặt sân ngay',
            onClick: () => (window.location.href = '/venues')
          }}
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
