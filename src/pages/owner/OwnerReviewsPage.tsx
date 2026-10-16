import React, { useState, useEffect } from 'react';
import { Star, Reply, MapPin } from 'lucide-react';
import { api } from '../../services/api.js';
import { IReview } from '../../types/index.js';
import { OwnerSidebar } from '../../components/layout/OwnerSidebar.js';
import { StarRating } from '../../components/common/StarRating.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton.js';

export const OwnerReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedReview, setSelectedReview] = useState<IReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reviews/owner/all');
      setReviews(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleOpenReply = (r: IReview) => {
    setSelectedReview(r);
    setReplyText(r.ownerResponse || '');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !replyText.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post(`/reviews/${selectedReview.id}/reply`, {
        response: replyText
      });
      setSelectedReview(null);
      fetchReviews();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể gửi phản hồi';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <OwnerSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Đánh Giá & Phản Hồi Từ Khách Hàng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lắng nghe nhận xét về cơ sở vật chất, mặt cỏ và phục vụ để nâng cao chất lượng sân bóng.
          </p>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="Chưa có đánh giá nào"
            description="Khi các cầu thủ thi đấu xong, nhận xét của họ sẽ được hiển thị tại đây."
            icon={Star}
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={r.userAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + r.userId}
                      alt={r.userName}
                      className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{r.userName}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StarRating rating={r.rating} size="sm" />
                    <span className="text-xs font-bold text-amber-500">({r.rating} / 5)</span>
                  </div>
                </div>
                  {/* thông tin sân bóng liên quan đến đánh giá */}
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-1">
                  <div className="font-bold text-emerald-800 text-xs">{r.venueName || 'Sân không xác định'}</div>
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{r.venueAddress || 'Chưa có thông tin địa điểm'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  "{r.comment}"
                </p>

                {r.ownerResponse ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <Reply className="w-3.5 h-3.5 text-emerald-600" /> Phản hồi từ Ban Quản Lý:
                    </div>
                    <p className="text-slate-700">{r.ownerResponse}</p>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleOpenReply(r)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Reply className="w-3.5 h-3.5" /> Trả lời đánh giá này
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reply Modal */}
        <Modal
          isOpen={!!selectedReview}
          onClose={() => setSelectedReview(null)}
          title="Phản Hồi Đánh Giá Khách Hàng"
        >
          // Biểu mẫu phản hồi đánh giá
          <form onSubmit={handleSendReply} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-emerald-800">{selectedReview?.venueName || 'Sân không xác định'}</div>
              <div className="flex items-start gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{selectedReview?.venueAddress || 'Chưa có thông tin địa điểm'}</span>
              </div>
              <div className="font-bold text-slate-900">{selectedReview?.userName}</div>
              <div className="text-slate-600">"{selectedReview?.comment}"</div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Nội dung phản hồi của bạn *</label>
              <textarea
                rows={4}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Cảm ơn bạn đã tin tưởng và góp ý cho ban quản lý sân..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi Phản Hồi'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};
