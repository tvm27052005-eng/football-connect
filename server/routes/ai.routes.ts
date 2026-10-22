import { Router } from 'express';
import { chatWithAI } from '../controllers/ai.controller.js';
import { assistantRateLimit } from '../middlewares/assistant.middleware.js';

const router = Router();

// POST /api/ai/chat
router.post('/chat', assistantRateLimit(), chatWithAI);

export default router;
