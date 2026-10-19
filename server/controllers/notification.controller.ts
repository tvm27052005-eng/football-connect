import { Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const notificationController = {
  // GET /api/notifications
  getMyNotifications: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const notifs = db.notifications
        .filter(n => n.userId === req.user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const unreadCount = notifs.filter(n => !n.isRead).length;

      res.json({
        success: true,
        unreadCount,
        data: notifs
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // PUT /api/notifications/:id/read
  markAsRead: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const notif = db.notifications.find(n => n.id === id && n.userId === req.user?.id);

      if (notif) {
        notif.isRead = true;
        await db.syncNotification(notif);
      }

      res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // PUT /api/notifications/read-all
  markAllAsRead: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      for (const n of db.notifications) {
        if (n.userId === req.user?.id) {
          n.isRead = true;
          await db.syncNotification(n);
        }
      }

      res.json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};
