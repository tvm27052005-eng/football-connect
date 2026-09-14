import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Public / General listings
router.get('/', matchController.getAllMatches);
router.get('/recommendations', authenticateToken, matchController.getMatchRecommendations);
router.get('/:id', matchController.getMatchById);

// Authenticated Actions
router.post('/', authenticateToken, matchController.createMatch);
router.post('/:id/join', authenticateToken, matchController.joinMatch);
router.delete('/:id/leave', authenticateToken, matchController.leaveMatch);
router.put('/:id/cancel', authenticateToken, matchController.cancelMatch);

export default router;
