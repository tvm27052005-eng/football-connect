import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Profile endpoints
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.put('/change-password', authenticateToken, userController.changePassword);

// Admin endpoints
router.get('/admin/all', authenticateToken, requireRole('ADMIN'), userController.getAllUsers);
router.put('/admin/:id/status', authenticateToken, requireRole('ADMIN'), userController.toggleUserStatus);
router.put('/admin/:id/role', authenticateToken, requireRole('ADMIN'), userController.changeUserRole);

router.get('/', authenticateToken, requireRole('ADMIN'), userController.getAllUsers);
router.put('/:id/toggle-status', authenticateToken, requireRole('ADMIN'), userController.toggleUserStatus);
router.put('/:id/role', authenticateToken, requireRole('ADMIN'), userController.changeUserRole);

export default router;
