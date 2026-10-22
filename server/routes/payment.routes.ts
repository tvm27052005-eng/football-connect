import { Router } from 'express';
import { z } from 'zod';
import { getPayOS, paymentPolicy } from '../services/payos.service.js';
import { ownerPaymentController } from '../controllers/payment.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { receivePayment } from '../services/booking-payment.service.js';
import { BookingError } from '../services/booking-payment.state.js';

const router = Router();
const eventData = z.object({
  orderCode: z.number().int().positive(), paymentLinkId: z.string().min(1).max(100),
  amount: z.number().int().positive(), reference: z.string().min(1).max(200),
  transactionDateTime: z.string().min(1).max(50), currency: z.literal('VND'),
  accountNumber: z.string().min(1).max(100), code: z.string()
});

router.get('/policy', (_req, res) => res.json({ success: true, data: paymentPolicy() }));
router.get('/owner/config', authenticateToken, requireRole('OWNER', 'ADMIN'), ownerPaymentController.getConfig);
router.put('/owner/config', authenticateToken, requireRole('OWNER', 'ADMIN'), ownerPaymentController.saveConfig);
router.delete('/owner/config', authenticateToken, requireRole('OWNER', 'ADMIN'), ownerPaymentController.disconnect);
router.post('/payos/webhook/:channelId', async (req, res) => {
  try {
    const client = getPayOS(req.params.channelId);
    let verified;
    try { verified = await client.webhooks.verify(req.body); }
    catch { res.status(401).json({ success: false, message: 'Chữ ký thanh toán không hợp lệ.' }); return; }
    const parsed = eventData.safeParse(verified);
    if (!parsed.success) { res.status(400).json({ success: false }); return; }
    await receivePayment(req.params.channelId, parsed.data);
    res.json({ success: true });
  } catch (error) {
    res.status(error instanceof BookingError ? error.status : 503).json({ success: false, message: 'Chưa xử lý được giao dịch.' });
  }
});
export default router;
