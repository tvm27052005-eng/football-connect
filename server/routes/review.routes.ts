import { Router } from 'express';
import { reviewController } from '../controllers/review.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', reviewController.getVenueReviews);
router.get('/owner/all', authenticateToken, requireRole('OWNER', 'ADMIN'), reviewController.getOwnerReviews);
router.post('/', authenticateToken, reviewController.createReview);
router.post('/:id/reply', authenticateToken, requireRole('OWNER', 'ADMIN'), reviewController.replyReview);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), reviewController.deleteReview);

export default router;
