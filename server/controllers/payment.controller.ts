import { Response } from 'express';
import { z } from 'zod';
import { PayOS } from '@payos/node';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import {
  encryptPayOSSecret,
  ownerPaymentSummary,
  paymentAppUrl
} from '../services/payos.service.js';

const configSchema = z.object({
  clientId: z.string().trim().min(1).max(200),
  apiKey: z.string().trim().min(1).max(300),
  checksumKey: z.string().trim().min(1).max(300),
  bankBin: z.string().regex(/^\d{6}$/).optional().or(z.literal(''))
});

function ownerId(req: AuthenticatedRequest): string {
  if (!req.user) throw new Error('UNAUTHENTICATED');
  return req.user.id;
}

export const ownerPaymentController = {
  getConfig: (req: AuthenticatedRequest, res: Response): void => {
    try {
      res.json({ success: true, data: ownerPaymentSummary(ownerId(req)) });
    } catch {
      res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' });
    }
  },

  saveConfig: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const parsed = configSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập đủ Client ID, API Key và Checksum Key payOS.' });
      return;
    }

    try {
      const id = ownerId(req);
      const user = db.users.find(item => item.id === id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản chủ sân.' });
        return;
      }

      const webhookUrl = `${paymentAppUrl()}/api/payments/payos/webhook/${encodeURIComponent(id)}`;
      const client = new PayOS({
        ...parsed.data,
        timeout: 10_000,
        maxRetries: 0
      });

      // payOS validates a webhook by calling it before returning. Persist a
      // provisional encrypted channel so that callback can verify its signature.
      const previousPayos = user.payos;
      const provisionalUser = {
        ...user,
        payos: {
          clientId: parsed.data.clientId,
          apiKeyEncrypted: encryptPayOSSecret(parsed.data.apiKey),
          checksumKeyEncrypted: encryptPayOSSecret(parsed.data.checksumKey),
          bankBin: parsed.data.bankBin || undefined,
          connectedAt: new Date().toISOString()
        }
      };

      await db.syncUser(provisionalUser);
      let account;
      try {
        account = await client.webhooks.confirm(webhookUrl);
      } catch (error) {
        await db.syncUser({ ...user, payos: previousPayos }).catch(rollbackError => {
          console.error('Không thể hoàn tác cấu hình payOS sau khi xác thực thất bại:', rollbackError);
        });
        throw error;
      }

      if (!account.accountNumber || !account.accountName) {
        await db.syncUser({ ...user, payos: previousPayos });
        res.status(422).json({ success: false, message: 'payOS chưa trả về tài khoản nhận tiền hợp lệ.' });
        return;
      }

      await db.syncUser({
        ...provisionalUser,
        payos: {
          ...provisionalUser.payos,
          accountNumber: account.accountNumber,
          accountName: account.accountName
        }
      });
      res.json({
        success: true,
        message: 'Đã kết nối tài khoản và đăng ký webhook payOS thành công.',
        data: ownerPaymentSummary(id)
      });
    } catch (error) {
      console.error('Lỗi kết nối payOS của chủ sân:', error);
      const detail = error instanceof Error ? error.message : '';
      const message = /HTTP 401|Unauthorized/i.test(detail)
        ? 'Client ID hoặc API Key payOS không chính xác.'
        : /signature|checksum/i.test(detail)
          ? 'Checksum Key payOS không chính xác.'
          : /webhook|APP_URL/i.test(detail)
            ? 'Không thể xác thực webhook payOS. Kiểm tra APP_URL trên Render và thử lại.'
            : 'Không thể xác thực kênh thanh toán payOS. Kiểm tra credential và trạng thái kênh rồi thử lại.';
      res.status(502).json({
        success: false,
        message
      });
    }
  },

  disconnect: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = ownerId(req);
      const user = db.users.find(item => item.id === id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản chủ sân.' });
        return;
      }
      const updatedUser = { ...user, payos: undefined };
      await db.syncUser(updatedUser);
      res.json({ success: true, message: 'Đã ngắt kết nối payOS.' });
    } catch (error) {
      console.error('Lỗi ngắt kết nối payOS của chủ sân:', error);
      res.status(500).json({ success: false, message: 'Không thể ngắt kết nối payOS lúc này.' });
    }
  }
};
