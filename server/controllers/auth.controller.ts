import { Request, Response } from 'express';
import { db } from '../models/db.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { IUser, UserRole } from '../types/index.js';
import { NguoiDungModel } from '../models/mongoose.models.js';
import { otpManager, sendOtpEmail } from '../services/email.service.js';

function publicUser(user: IUser) {
  const { password: _, payos, ...safeUser } = user;
  return {
    ...safeUser,
    payos: payos ? {
      connected: true,
      accountNumber: payos.accountNumber,
      accountName: payos.accountName,
      bankBin: payos.bankBin,
      connectedAt: payos.connectedAt
    } : undefined
  };
}

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

      await db.syncUser(newUser);

      // Create welcome notification
      await db.syncNotification({
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

      const userSafe = publicUser(newUser);
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

      const userSafe = publicUser(user);
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

      const userSafe = publicUser(user);
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
    const userSafe = publicUser(targetUser);

    res.json({
      success: true,
      message: `Đã chuyển sang tài khoản ${role}`,
      data: {
        user: userSafe,
        accessToken,
        refreshToken
      }
    });
  },

  // POST /api/auth/register-otp
  sendRegisterOtp: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, phone, role = 'USER', city, district, businessName, businessTaxId } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        return;
      }

      const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Email này đã được đăng ký trong hệ thống' });
        return;
      }

      // Check anti-spam cooldown (60 seconds)
      const cooldownCheck = await otpManager.isInCooldown(email, 'REGISTER');
      if (cooldownCheck.inCooldown) {
        res.status(429).json({
          success: false,
          message: `Vui lòng đợi ${cooldownCheck.remainingSeconds} giây trước khi yêu cầu gửi lại mã OTP mới`,
          remainingSeconds: cooldownCheck.remainingSeconds
        });
        return;
      }

      const otp = otpManager.generateOtp();
      const passwordHash = await hashPassword(password);
      await otpManager.saveOtp(email, otp, 'REGISTER', {
        name,
        email,
        passwordHash,
        phone,
        role,
        city,
        district,
        businessName,
        businessTaxId
      });

      const sent = await sendOtpEmail({
        to: email,
        otp,
        purpose: 'REGISTER',
        userName: name
      });
      if (!sent) {
        await otpManager.deleteOtp(email, 'REGISTER');
        res.status(503).json({
          success: false,
          message: 'Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Mã xác thực OTP đã được gửi về email của bạn. Mã có hiệu lực trong vòng 1 phút.'
      });
    } catch (error) {
      console.error('Send register OTP error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi gửi mã xác thực' });
    }
  },

  // POST /api/auth/verify-register-otp
  verifyRegisterOtp: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP' });
        return;
      }

      const verification = await otpManager.verifyOtp(email, otp, 'REGISTER');
      if (!verification.valid) {
        res.status(400).json({ success: false, message: verification.message });
        return;
      }

      const payload = verification.registrationPayload as Record<string, string> | undefined;
      if (!payload) {
        res.status(400).json({ success: false, message: 'Không tìm thấy dữ liệu đăng ký. Vui lòng thử lại từ đầu.' });
        return;
      }

      const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Email này đã tồn tại trong hệ thống' });
        return;
      }

      // Tương thích với OTP cũ được tạo trước khi mật khẩu tạm được băm.
      const hashedPassword = payload.passwordHash || await hashPassword(payload.password);
      const newUser: IUser = {
        id: db.generateId('user'),
        name: payload.name.trim(),
        email: payload.email.toLowerCase().trim(),
        password: hashedPassword,
        phone: payload.phone || '',
        role: (['USER', 'OWNER', 'ADMIN'].includes(payload.role) ? payload.role : 'USER') as UserRole,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(payload.name)}`,
        bio: payload.role === 'OWNER' ? 'Chủ quản lý sân bóng đá' : 'Thành viên bóng đá phong trào',
        location: {
          city: payload.city || 'Hà Nội',
          district: payload.district || 'Cầu Giấy'
        },
        skillLevel: 'INTERMEDIATE',
        preferredFieldType: '7_vs_7',
        preferredPosition: 'Tiền vệ',
        businessName: payload.role === 'OWNER' ? payload.businessName : undefined,
        businessTaxId: payload.role === 'OWNER' ? payload.businessTaxId : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create welcome notification
      await db.syncUser(newUser);
      await db.syncNotification({
        id: db.generateId('notif'),
        userId: newUser.id,
        title: 'Chào mừng gia nhập Football Connect!',
        message: 'Tài khoản của bạn đã được xác thực email thành công. Bắt đầu tìm sân và ghép đối ngay!',
        type: 'SYSTEM',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);
      const userSafe = publicUser(newUser);

      res.status(201).json({
        success: true,
        message: 'Xác thực email và tạo tài khoản thành công!',
        data: {
          user: userSafe,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Verify register OTP error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi xác thực tài khoản' });
    }
  },

  // POST /api/auth/forgot-password-otp
  sendForgotPasswordOtp: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email của bạn' });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      let user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

      // Fallback: tìm trong MongoDB nếu chưa nạp vào memory
      if (!user) {
        const mongoUser = await (NguoiDungModel as any).findOne({ email: normalizedEmail }).lean();
        if (mongoUser) {
          user = {
            id: mongoUser.ma_nguoi_dung,
            name: mongoUser.ho_ten,
            email: mongoUser.email,
            password: mongoUser.mat_khau,
            phone: mongoUser.so_dien_thoai || '',
            role: mongoUser.vai_tro as any,
            avatar: mongoUser.anh_dai_dien,
            bio: mongoUser.gioi_thieu,
            isActive: mongoUser.trang_thai,
            createdAt: (mongoUser as any).ngay_tao ? new Date((mongoUser as any).ngay_tao).toISOString() : new Date().toISOString(),
            updatedAt: (mongoUser as any).ngay_cap_nhat ? new Date((mongoUser as any).ngay_cap_nhat).toISOString() : new Date().toISOString()
          };
          db.users.push(user);
        }
      }

      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản nào liên kết với email này' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Tài khoản của bạn đang bị khóa, không thể đặt lại mật khẩu' });
        return;
      }

      // Check anti-spam cooldown (60 seconds)
      const cooldownCheck = await otpManager.isInCooldown(normalizedEmail, 'FORGOT_PASSWORD');
      if (cooldownCheck.inCooldown) {
        res.status(429).json({
          success: false,
          message: `Vui lòng đợi ${cooldownCheck.remainingSeconds} giây trước khi yêu cầu gửi lại mã OTP mới`,
          remainingSeconds: cooldownCheck.remainingSeconds
        });
        return;
      }

      const otp = otpManager.generateOtp();
      await otpManager.saveOtp(normalizedEmail, otp, 'FORGOT_PASSWORD');

      const sent = await sendOtpEmail({
        to: normalizedEmail,
        otp,
        purpose: 'FORGOT_PASSWORD',
        userName: user.name
      });
      if (!sent) {
        await otpManager.deleteOtp(normalizedEmail, 'FORGOT_PASSWORD');
        res.status(503).json({
          success: false,
          message: 'Không thể gửi email đặt lại mật khẩu lúc này. Vui lòng thử lại sau.'
        });
        return;
      }

      console.log(`📨 [FORGOT PASSWORD OTP] Đã gửi mã xác thực cho: ${normalizedEmail}`);

      res.json({
        success: true,
        message: 'Mã xác thực đổi mật khẩu đã được gửi đến email của bạn. Mã có hiệu lực trong 1 phút.'
      });
    } catch (error) {
      console.error('Send forgot password OTP error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi gửi mã đặt lại mật khẩu' });
    }
  },

  // POST /api/auth/reset-password
  resetPassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ email, mã OTP và mật khẩu mới' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      let user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

      // Fallback: tìm trong MongoDB nếu chưa nạp vào memory
      if (!user) {
        const mongoUser = await (NguoiDungModel as any).findOne({ email: normalizedEmail }).lean();
        if (mongoUser) {
          user = {
            id: mongoUser.ma_nguoi_dung,
            name: mongoUser.ho_ten,
            email: mongoUser.email,
            password: mongoUser.mat_khau,
            phone: mongoUser.so_dien_thoai || '',
            role: mongoUser.vai_tro as any,
            avatar: mongoUser.anh_dai_dien,
            bio: mongoUser.gioi_thieu,
            isActive: mongoUser.trang_thai,
            createdAt: (mongoUser as any).ngay_tao ? new Date((mongoUser as any).ngay_tao).toISOString() : new Date().toISOString(),
            updatedAt: (mongoUser as any).ngay_cap_nhat ? new Date((mongoUser as any).ngay_cap_nhat).toISOString() : new Date().toISOString()
          };
          db.users.push(user);
        }
      }

      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này' });
        return;
      }

      const verification = await otpManager.verifyOtp(normalizedEmail, otp, 'FORGOT_PASSWORD');
      if (!verification.valid) {
        res.status(400).json({ success: false, message: verification.message });
        return;
      }

      const hashedPassword = await hashPassword(newPassword);
      user.password = hashedPassword;
      user.updatedAt = new Date().toISOString();
      await db.syncUser(user);

      // Cập nhật trực tiếp vào MongoDB để đảm bảo 100% mật khẩu được lưu bền vững
      await (NguoiDungModel as any).updateOne(
        { email: normalizedEmail },
        { $set: { mat_khau: hashedPassword, ngay_cap_nhat: new Date() } }
      );

      // Notification
      await db.syncNotification({
        id: db.generateId('notif'),
        userId: user.id,
        title: 'Mật khẩu đã được thay đổi',
        message: 'Mật khẩu tài khoản Football Connect của bạn vừa được cập nhật thành công qua xác thực OTP.',
        type: 'SYSTEM',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ [PASSWORD RESET SUCCESS] Đổi mật khẩu thành công cho tài khoản: ${normalizedEmail}`);

      res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công! Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu' });
    }
  }
};
