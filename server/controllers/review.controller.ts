import { Request, Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { IReview } from '../types/index.js';

export const reviewController = {
  // GET /api/reviews?venueId=...
  getVenueReviews: async (req: Request, res: Response): Promise<void> => {
    try {
      const { venueId } = req.query;
      let reviews = [...db.reviews];

      if (venueId && typeof venueId === 'string') {
        reviews = reviews.filter(r => r.venueId === venueId);
      }

      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json({ success: true, count: reviews.length, data: reviews });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // POST /api/reviews
  createReview: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const { venueId, bookingId, rating, comment, images } = req.body;

      if (!venueId || !rating || !comment) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp số sao đánh giá (1-5) và nhận xét' });
        return;
      }

      const numRating = Number(rating);
      if (numRating < 1 || numRating > 5) {
        res.status(400).json({ success: false, message: 'Đánh giá phải từ 1 đến 5 sao' });
        return;
      }

      const venue = db.venues.find(v => v.id === venueId);
      if (!venue) {
        res.status(404).json({ success: false, message: 'Sân bóng không tồn tại' });
        return;
      }

      // If bookingId is provided, verify it belongs to user and hasn't been reviewed yet
      if (bookingId) {
        const existingReview = db.reviews.find(r => r.bookingId === bookingId && r.userId === req.user?.id);
        if (existingReview) {
          res.status(400).json({ success: false, message: 'Bạn đã đánh giá cho lượt đặt sân này rồi' });
          return;
        }
      }

      const user = db.users.find(u => u.id === req.user?.id);
      const newReview: IReview = {
        id: db.generateId('rev'),
        userId: req.user.id,
        userName: req.user.name,
        userAvatar: user?.avatar,
        venueId,
        bookingId,
        rating: numRating,
        comment: comment.trim(),
        images: images || [],
        createdAt: new Date().toISOString()
      };

      db.reviews.push(newReview);

      // Auto update Venue rating and reviewCount
      const allVenueReviews = db.reviews.filter(r => r.venueId === venueId);
      const avgRating = allVenueReviews.reduce((sum, r) => sum + r.rating, 0) / allVenueReviews.length;
      venue.rating = Number(avgRating.toFixed(1));
      venue.reviewCount = allVenueReviews.length;
      venue.updatedAt = new Date().toISOString();

      // Notify owner
      db.notifications.push({
        id: db.generateId('notif'),
        userId: venue.ownerId,
        title: 'Có đánh giá mới cho sân của bạn',
        message: `${req.user.name} vừa để lại đánh giá ${numRating}★ cho ${venue.name}: "${comment.substring(0, 60)}..."`,
        type: 'NEW_REVIEW',
        link: `/venues/${venue.id}`,
        isRead: false,
        createdAt: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Gửi đánh giá thành công!',
        data: newReview
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi gửi đánh giá' });
    }
  },

  // GET /api/reviews/owner/all
  getOwnerReviews: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }
      const ownerVenues = req.user.role === 'ADMIN'
        ? db.venues
        : db.venues.filter(v => v.ownerId === req.user?.id);
      const ownerVenueIds = new Set(ownerVenues.map(v => v.id));

      const reviews = db.reviews
        .filter(r => ownerVenueIds.has(r.venueId))
        .map(r => ({
          ...r,
          ownerResponse: r.ownerReply?.content || ''
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ success: true, count: reviews.length, data: reviews });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // POST /api/reviews/:id/reply (Owner replies)
  replyReview: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const contentText = req.body.content || req.body.response;

      if (!contentText || !contentText.trim()) {
        res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
        return;
      }

      const review = db.reviews.find(r => r.id === id);
      if (!review) {
        res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
        return;
      }

      const venue = db.venues.find(v => v.id === review.venueId);
      if (req.user?.role !== 'ADMIN' && venue?.ownerId !== req.user?.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền phản hồi đánh giá của sân này' });
        return;
      }

      review.ownerReply = {
        content: contentText.trim(),
        createdAt: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Phản hồi đánh giá thành công',
        data: review
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // DELETE /api/reviews/:id (Admin only)
  deleteReview: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const review = db.reviews.find(r => r.id === id);
      if (!review) {
        res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
        return;
      }

      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Chỉ Quản trị viên mới được xóa đánh giá' });
        return;
      }

      db.reviews = db.reviews.filter(r => r.id !== id);

      // Recompute venue rating
      const venue = db.venues.find(v => v.id === review.venueId);
      if (venue) {
        const remaining = db.reviews.filter(r => r.venueId === venue.id);
        venue.reviewCount = remaining.length;
        venue.rating = remaining.length > 0
          ? Number((remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length).toFixed(1))
          : 5.0;
      }

      res.json({ success: true, message: 'Đã xóa đánh giá thành công' });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};
