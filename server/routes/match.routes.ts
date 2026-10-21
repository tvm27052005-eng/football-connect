import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public / General listings
router.get('/', matchController.getAllMatches);
router.get('/recommendations', authenticateToken, matchController.getMatchRecommendations);
router.get('/admin/all', authenticateToken, requireRole('ADMIN'), matchController.getAllMatches);
router.get('/mine', authenticateToken, matchController.getMyMatches);
// Keep named collection routes before the dynamic /:id route.
router.get('/:id', matchController.getMatchById);

// Authenticated Actions
router.post('/', authenticateToken, matchController.createMatch);
router.post('/:id/join', authenticateToken, matchController.joinMatch);
router.delete('/:id/leave', authenticateToken, matchController.leaveMatch);
router.put('/:id/approve', authenticateToken, requireRole('ADMIN'), matchController.approveMatch);
router.put('/:id/cancel', authenticateToken, matchController.cancelMatch);

export default router;
