import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Share2,
  Sparkles,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api.js';
import { IVenue, IField, ITimeSlot, IReview } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { StarRating } from '../components/common/StarRating.js';
import { TimeSlotMatrix } from '../components/booking/TimeSlotMatrix.js';
import { Modal } from '../components/common/Modal.js';
import { GoogleMapView } from '../components/common/GoogleMapView.js';
import { useAuthStore } from '../stores/auth.store.js';

export const VenueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [venue, setVenue] = useState<IVenue | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Field & Slot Selection for Quick Booking
  const [selectedField, setSelectedField] = useState<IField | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<ITimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Review System Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchVenueData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/venues/${id}`);
      const data: IVenue = res.data.data;
      setVenue(data);
      if (data.images && data.images.length > 0) {
        setSelectedImage(data.images[0]);
      }
      if (data.fields && data.fields.length > 0) {
        setSelectedField(data.fields[0]);
      }
    } catch (e) {
      console.error('Error fetching venue detail', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVenueData();
  }, [id]);

  // Fetch slot availability when selected field or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedField) return;
      try {
        setIsLoadingSlots(true);
        const res = await api.get(`/fields/${selectedField.id}/availability?date=${selectedDate}`);
        setSlots(res.data.data.slots);
      } catch (e) {
        console.error('Error fetching slots', e);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedField, selectedDate]);

  const handleBookNow = () => {
    if (!venue || !selectedField || !selectedSlot) return;
    const now = new Date();
    const slotDateTime = new Date(`${selectedDate}T${selectedSlot.startTime}:00`);
    if (isNaN(slotDateTime.getTime()) || slotDateTime <= now) {
      alert('Khung giờ thi đấu này đã trôi qua rồi! Vui lòng chọn khung giờ khác.');
      return;
    }
    navigate(
      `/booking/create?venueId=${venue.id}&fieldId=${selectedField.id}&date=${selectedDate}&start=${selectedSlot.startTime}&end=${selectedSlot.endTime}`
    );
  };

  const handleDirectChat = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (venue?.ownerId) {
      try {
        const res = await api.post('/conversations/direct', { targetUserId: venue.ownerId });
        navigate(`/chat?id=${res.data.data.id}`);
      } catch (e) {
        console.error('Failed to create direct chat:', e);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmittingReview(true);
      setReviewError('');
      await api.post('/reviews', {
        venueId: venue?.id,
        rating: reviewRating,
        comment: reviewComment
      });
      setShowReviewModal(false);
      setReviewComment('');
      fetchVenueData(); // Reload reviews and rating
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể gửi đánh giá';
      setReviewError(errorMsg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading || !venue) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-emerald-600">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Banner & Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main image & thumbs */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative h-80 sm:h-[420px] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1000'}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="emerald" size="md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                {venue.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm đóng cửa'}
              </Badge>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {venue.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-24 h-18 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${selectedImage === img
                  ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                  : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Venue Info Sidebar Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{venue.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-slate-500">({venue.reviewCount} đánh giá)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{venue.name}</h1>
              <p className="flex items-start gap-1.5 text-xs text-slate-500 mt-2 leading-relaxed">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{venue.address}, {venue.district}, {venue.city}</span>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Khung giá thuê</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {venue.priceRange.min.toLocaleString('vi-VN')} - {venue.priceRange.max.toLocaleString('vi-VN')} đ/h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Giờ hoạt động</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> {venue.openTime} - {venue.closeTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Liên hệ đặt sân</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> {venue.ownerPhone || '0988 888 888'}
                </span>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Tiện ích tại sân
              </span>
              <div className="flex flex-wrap gap-1.5">
                {venue.amenities.map((a, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    ✓ {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <button
              onClick={handleDirectChat}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Nhắn tin với Quản lý sân
            </button>
            <a
              href="#booking-section"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              Chọn Khung Giờ & Đặt Sân <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Google Maps Location Section */}
      <section className="space-y-3">
        <GoogleMapView
          venue={venue}
          title={`Vị trí bản đồ: ${venue.name}`}
          height="h-80 sm:h-96"
        />
      </section>

      {/* Booking Matrix Section */}
      <section id="booking-section" className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block mb-2 shadow-xs">
            ⚽ Đặt Lịch & Giữ Chỗ Trực Tuyến
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Bảng Lịch Sân Trống Theo Thời Gian Thực
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chọn sân con, ngày đá và khung giờ còn trống để hoàn tất đặt sân không lo trùng lịch.
          </p>
        </div>

        {/* Select Child Field Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
            1. Chọn Sân Con
          </label>
          <div className="flex flex-wrap gap-2">
            {venue.fields?.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedField(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${selectedField?.id === f.id
                  ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
              >
                <span>{f.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${selectedField?.id === f.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                  {f.fieldType === '5_vs_5' ? 'Sân 5' : 'Sân 7'}
                </span>
                <span className="text-[11px]">({f.pricePerHour.toLocaleString('vi-VN')} đ/h)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
            2. Chọn Ngày Đá
          </label>
          <div className="flex items-center gap-3">
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => {
                const today = new Date().toISOString().split('T')[0];
                if (e.target.value < today) {
                  alert('Không thể chọn ngày đã qua!');
                  return;
                }
                setSelectedDate(e.target.value);
              }}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold"
            />
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Lịch đặt đang hiển thị cho ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>

        {/* Slots Matrix */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
            3. Chọn Khung Giờ (Ca 90 Phút)
          </label>
          <TimeSlotMatrix
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            isLoading={isLoadingSlots}
            date={selectedDate}
          />
        </div>

        {/* Booking Summary Floating Strip */}
        {selectedSlot && selectedField && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in shadow-xs">
            <div>
              <div className="text-xs text-emerald-800 font-bold">Khung giờ đã chọn:</div>
              <div className="text-base font-black text-slate-900">
                {selectedField.name} • {selectedDate} ({selectedSlot.startTime} - {selectedSlot.endTime})
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Tổng chi phí: <strong className="text-emerald-700 font-extrabold text-sm">{selectedSlot.price.toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>

            <button
              onClick={handleBookNow}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              Tiến Hành Đặt Sân Ngay →
            </button>
          </div>
        )}
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Đánh Giá & Nhận Xét</h2>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{venue.rating.toFixed(1)} / 5.0</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phản hồi thực tế từ các cầu thủ đã trải nghiệm thi đấu tại cụm sân này.
            </p>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
              } else {
                setShowReviewModal(true);
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Viết Đánh Giá
          </button>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {!venue.reviews || venue.reviews.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm và chia sẻ nhé!
            </div>
          ) : (
            venue.reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.userAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + rev.userId}
                      alt={rev.userName}
                      className="w-8 h-8 rounded-full bg-slate-200 object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{rev.userName}</span>
                        <span className="text-[10px] text-emerald-700 font-medium">✓ Đã đặt sân</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <StarRating rating={rev.rating} size="sm" />
                </div>
                      {/* thông tin sân bóng liên quan đến đánh giá */}
                <div className="flex items-start gap-2 text-[11px] text-slate-500 border-l-2 border-emerald-300 pl-3">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Đánh giá tại <strong className="text-slate-700">{venue.name}</strong> · {venue.address}, {venue.district}, {venue.city}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>

                {/* Owner Reply */}
                {rev.ownerReply && (
                  <div className="p-3 bg-white rounded-xl border-l-4 border-emerald-600 border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-emerald-800 text-[11px]">
                      Phản hồi từ Chủ sân ({venue.name}):
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{rev.ownerReply.content}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Đánh Giá Cụm Sân Bóng"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
          {reviewError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {reviewError}
            </div>
          )}

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
              Nhận xét chi tiết <span className="text-slate-400 font-normal text-[11px]">(tùy chọn)</span>
            </label>
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chia sẻ về chất lượng mặt cỏ, hệ thống đèn, thái độ nhân viên hoặc khu vực giữ xe..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold"
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
