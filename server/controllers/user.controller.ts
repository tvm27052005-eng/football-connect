import { Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';

function publicUser(user: import('../types/index.js').IUser) {
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

export const userController = {
  // GET /api/users/profile
  getProfile: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = db.users.find(u => u.id === req.user?.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        return;
      }

      const safeUser = publicUser(user);
      const userBookings = db.bookings.filter(b => b.userId === user.id);
      const userMatches = db.matches.filter(m => m.creatorId === user.id);
      const joinedMatches = db.matchParticipants.filter(p => p.userId === user.id && p.status === 'CONFIRMED');

      res.json({
        success: true,
        data: {
          user: safeUser,
          stats: {
            totalBookings: userBookings.length,
            completedBookings: userBookings.filter(b => b.status === 'COMPLETED').length,
            totalMatchesCreated: userMatches.length,
            totalMatchesJoined: joinedMatches.length
          }
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // PUT /api/users/profile
  updateProfile: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userIndex = db.users.findIndex(u => u.id === req.user?.id);
      if (userIndex === -1) {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        return;
      }

      const {
        name,
        phone,
        avatar,
        bio,
        location,
        skillLevel,
        preferredFieldType,
        preferredPosition,
        businessName,
        businessTaxId
      } = req.body;

      const updatedUser = {
        ...db.users[userIndex],
        name: name || db.users[userIndex].name,
        phone: phone !== undefined ? phone : db.users[userIndex].phone,
        avatar: avatar || db.users[userIndex].avatar,
        bio: bio !== undefined ? bio : db.users[userIndex].bio,
        location: location || db.users[userIndex].location,
        skillLevel: skillLevel || db.users[userIndex].skillLevel,
        preferredFieldType: preferredFieldType || db.users[userIndex].preferredFieldType,
        preferredPosition: preferredPosition || db.users[userIndex].preferredPosition,
        businessName: businessName !== undefined ? businessName : db.users[userIndex].businessName,
        businessTaxId: businessTaxId !== undefined ? businessTaxId : db.users[userIndex].businessTaxId,
        updatedAt: new Date().toISOString()
      };

      await db.syncUser(updatedUser);
      const safeUser = publicUser(updatedUser);

      res.json({
        success: true,
        message: 'Cập nhật thông tin thành công',
        data: safeUser
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // PUT /api/users/change-password
  changePassword: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' });
        return;
      }
      if (newPassword.length < 6 || newPassword.length > 128) {
        res.status(400).json({ success: false, message: 'Mật khẩu mới phải có từ 6 đến 128 ký tự' });
        return;
      }
      if (currentPassword === newPassword) {
        res.status(400).json({ success: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
        return;
      }

      const user = db.users.find(u => u.id === req.user?.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        return;
      }

      const isMatch = await comparePassword(currentPassword, user.password || '');
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        return;
      }

      const updatedUser = {
        ...user,
        password: await hashPassword(newPassword),
        updatedAt: new Date().toISOString()
      };
      await db.syncUser(updatedUser);

      res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET /api/users (Admin only)
  getAllUsers: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { role, search, status } = req.query;
      let users = db.users.map(publicUser);

      if (role && typeof role === 'string' && role !== 'ALL') {
        users = users.filter(u => u.role === role);
      }

      if (status && typeof status === 'string' && status !== 'ALL') {
        const isActive = status === 'ACTIVE';
        users = users.filter(u => u.isActive === isActive);
      }

      if (search && typeof search === 'string') {
        const query = search.toLowerCase();
        users = users.filter(u =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.phone && u.phone.includes(query))
        );
      }

      res.json({ success: true, data: users });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // PUT /api/users/:id/toggle-status (Admin only)
  toggleUserStatus: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = db.users.find(u => u.id === id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        return;
      }

      if (user.role === 'ADMIN' && user.id === req.user?.id) {
        res.status(400).json({ success: false, message: 'Không thể tự khóa tài khoản Admin của chính mình' });
        return;
      }

      user.isActive = !user.isActive;
      user.updatedAt = new Date().toISOString();
      await db.syncUser(user);

      res.json({
        success: true,
        message: `Đã ${user.isActive ? 'mở khóa' : 'khóa'} tài khoản ${user.name}`,
        data: { id: user.id, isActive: user.isActive }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // PUT /api/users/:id/role (Admin only)
  changeUserRole: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['USER', 'OWNER', 'ADMIN'].includes(role)) {
        res.status(400).json({ success: false, message: 'Role không hợp lệ' });
        return;
      }

      const user = db.users.find(u => u.id === id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        return;
      }

      user.role = role;
      user.updatedAt = new Date().toISOString();
      await db.syncUser(user);

      res.json({
        success: true,
        message: `Đã chuyển đổi quyền tài khoản sang ${role}`,
        data: { id: user.id, role: user.role }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};
