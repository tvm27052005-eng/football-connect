import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, chatController.getConversations);
router.post('/direct', authenticateToken, chatController.getOrCreateDirectConversation);
router.get('/:id/messages', authenticateToken, chatController.getMessages);
router.post('/:id/messages', authenticateToken, chatController.sendMessage);

export default router;
