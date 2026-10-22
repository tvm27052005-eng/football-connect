import { Response } from 'express';
import { z } from 'zod';
import { PayOS } from '@payos/node';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import {
  encryptPayOSSecret,
  ownerPaymentSummary
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

      const client = new PayOS({
        ...parsed.data,
        timeout: 10_000,
        maxRetries: 0
      });
      const account = await client.payoutsAccount.balance();
      if (!account.accountNumber || !account.accountName) {
        res.status(422).json({ success: false, message: 'payOS chưa trả về tài khoản nhận tiền hợp lệ.' });
        return;
      }

      const updatedUser = {
        ...user,
        payos: {
          clientId: parsed.data.clientId,
          apiKeyEncrypted: encryptPayOSSecret(parsed.data.apiKey),
          checksumKeyEncrypted: encryptPayOSSecret(parsed.data.checksumKey),
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          bankBin: parsed.data.bankBin || undefined,
          connectedAt: new Date().toISOString()
        }
      };
      await db.syncUser(updatedUser);
      res.json({
        success: true,
        message: 'Đã kết nối tài khoản payOS thành công.',
        data: ownerPaymentSummary(id)
      });
    } catch (error) {
      console.error('Lỗi kết nối payOS của chủ sân:', error);
      res.status(502).json({
        success: false,
        message: 'Không thể xác thực thông tin payOS. Kiểm tra lại credential và thử lại.'
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
