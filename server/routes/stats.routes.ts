import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/owner', authenticateToken, requireRole('OWNER', 'ADMIN'), statsController.getOwnerStats);
router.get('/admin', authenticateToken, requireRole('ADMIN'), statsController.getAdminStats);

export default router;
