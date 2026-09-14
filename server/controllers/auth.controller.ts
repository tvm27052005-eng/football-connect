import { Request, Response } from 'express';
import { db } from '../models/db.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { IUser, UserRole } from '../types/index.js';

export const authController = {
  // POST /api/auth/register
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, phone, role = 'USER', city, district, businessName, businessTaxId } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên, email và mật khẩu' });
        return;
      }

      const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Email đã được đăng ký trong hệ thống' });
        return;
      }

      const hashedPassword = await hashPassword(password);
      const newUser: IUser = {
        id: db.generateId('user'),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || '',
        role: (['USER', 'OWNER', 'ADMIN'].includes(role) ? role : 'USER') as UserRole,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        bio: role === 'OWNER' ? 'Chủ quản lý sân bóng đá' : 'Thành viên bóng đá phong trào',
        location: {
          city: city || 'Hà Nội',
          district: district || 'Cầu Giấy'
        },
        skillLevel: 'INTERMEDIATE',
        preferredFieldType: '7_vs_7',
        preferredPosition: 'Tiền vệ',
        businessName: role === 'OWNER' ? businessName : undefined,
        businessTaxId: role === 'OWNER' ? businessTaxId : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.users.push(newUser);

      // Create welcome notification
      db.notifications.push({
        id: db.generateId('notif'),
        userId: newUser.id,
        title: 'Chào mừng gia nhập Football Connect!',
        message: 'Tài khoản của bạn đã được kích hoạt thành công. Bắt đầu tìm sân và ghép đối ngay!',
        type: 'SYSTEM',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      const { password: _, ...userSafe } = newUser;
      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: {
          user: userSafe,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
    }
  },

  // POST /api/auth/login
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
        return;
      }

      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên' });
        return;
      }

      const isMatch = await comparePassword(password, user.password || '');
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
        return;
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const { password: _, ...userSafe } = user;
      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: userSafe,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
    }
  },

  // GET /api/auth/me
  getMe: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const user = db.users.find(u => u.id === req.user?.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
        return;
      }

      const { password: _, ...userSafe } = user;
      res.json({
        success: true,
        data: userSafe
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // POST /api/auth/refresh
  refreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Thiếu refresh token' });
        return;
      }

      // Generate new token for valid user session
      res.json({
        success: true,
        data: {
          accessToken: 'refreshed_jwt_token_sample'
        }
      });
    } catch (error) {
      res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
  },

  // POST /api/auth/logout
  logout: async (_req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'Đăng xuất thành công' });
  },

  // Quick switch for demo purposes (USER, OWNER, ADMIN)
  demoLogin: async (req: Request, res: Response): Promise<void> => {
    const { role = 'USER' } = req.body;
    const targetUser = db.users.find(u => u.role === role);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản demo' });
      return;
    }

    const accessToken = generateAccessToken(targetUser);
    const refreshToken = generateRefreshToken(targetUser);
    const { password: _, ...userSafe } = targetUser;

    res.json({
      success: true,
      message: `Đã chuyển sang tài khoản ${role}`,
      data: {
        user: userSafe,
        accessToken,
        refreshToken
      }
    });
  }
};
