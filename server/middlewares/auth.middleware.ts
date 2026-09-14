import { Request, Response, NextFunction } from 'express';
import { verifyToken, IJwtPayload } from '../utils/jwt.js';
import { db } from '../models/db.js';
import { UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: IJwtPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập hoặc token không hợp lệ' });
    return;
  }

  try {
    const payload = verifyToken(token);
    const userInDb = db.users.find(u => u.id === payload.id);
    if (!userInDb || !userInDb.isActive) {
      res.status(403).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa' });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Yêu cầu xác thực' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}
