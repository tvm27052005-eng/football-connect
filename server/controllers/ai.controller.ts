import { Request, Response } from 'express';
import { z } from 'zod';
import { answerQuestion } from '../services/assistant.service.js';

export const chatInput = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z.array(z.object({ sender: z.enum(['user', 'ai']), text: z.string().max(2000) })).max(10).default([]),
}).refine(value => value.history.reduce((n, m) => n + m.text.length, 0) <= 12000);

export async function chatWithAI(req: Request, res: Response) {
  const parsed = chatInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ code: 'INVALID_INPUT', error: 'Câu hỏi tối đa 2.000 ký tự; lịch sử tối đa 10 tin, 12.000 ký tự.' }); return; }
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json(await answerQuestion(parsed.data.message, parsed.data.history));
  } catch {
    res.status(503).json({ code: 'UNAVAILABLE', error: 'Trợ lý tạm thời chưa sẵn sàng. Vui lòng thử lại.' });
  }
}
