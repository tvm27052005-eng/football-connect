import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, notificationController.getMyNotifications);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

export default router;
