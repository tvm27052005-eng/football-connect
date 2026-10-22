import { Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { IConversation, IMessage } from '../types/index.js';
import { emitConversationMessage } from '../sockets/socket.service.js';

export const chatController = {
  // GET /api/conversations
  getConversations: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const userId = req.user.id;
      const userConvs = db.conversations
        .filter(c => c.participantIds.includes(userId))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      const enriched = userConvs.map(c => {
        // Find other participants info
        const otherParticipantIds = c.participantIds.filter(id => id !== userId);
        const otherUsers = db.users
          .filter(u => otherParticipantIds.includes(u.id))
          .map(({ password: _, ...u }) => u);

        const unreadCount = db.messages.filter(
          m => m.conversationId === c.id && !m.readBy.includes(userId) && m.senderId !== userId
        ).length;

        let displayTitle = c.title;
        let displayAvatar = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=150';

        if (c.type === 'DIRECT' && otherUsers.length > 0) {
          displayTitle = otherUsers[0].name;
          displayAvatar = otherUsers[0].avatar || displayAvatar;
        }

        return {
          ...c,
          displayTitle,
          displayAvatar,
          otherUsers,
          unreadCount
        };
      });

      res.json({ success: true, data: enriched });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET /api/conversations/:id/messages
  getMessages: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const { id } = req.params;
      const conversation = db.conversations.find(c => c.id === id);

      if (!conversation) {
        res.status(404).json({ success: false, message: 'Hội thoại không tồn tại' });
        return;
      }

      if (!conversation.participantIds.includes(req.user.id) && req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
        return;
      }

      const messages = db.messages
        .filter(m => m.conversationId === id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Auto mark as read
      messages.forEach(m => {
        if (req.user && !m.readBy.includes(req.user.id)) {
          m.readBy.push(req.user.id);
        }
      });
      await Promise.all(messages.map((message) => db.syncMessage(message)));

      res.json({ success: true, data: messages });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // POST /api/conversations/:id/messages
  sendMessage: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const { id } = req.params;
      const { content, type = 'TEXT', attachment } = req.body;

      if ((!content || !content.trim()) && !attachment?.url) {
        res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
        return;
      }

      const conversation = db.conversations.find(c => c.id === id);
      if (!conversation) {
        res.status(404).json({ success: false, message: 'Hội thoại không tồn tại' });
        return;
      }

      if (!conversation.participantIds.includes(req.user.id)) {
        res.status(403).json({ success: false, message: 'Bạn không thuộc phòng chat này' });
        return;
      }

      const user = db.users.find(u => u.id === req.user?.id);
      const attachmentOnlyLabel = attachment?.mimeType?.startsWith('image/')
        ? 'Đã gửi ảnh'
        : 'Đã gửi tệp';
      const newMessage: IMessage = {
        id: db.generateId('msg'),
        conversationId: id,
        senderId: req.user.id,
        senderName: req.user.name,
        senderAvatar: user?.avatar,
        content: content?.trim() || attachmentOnlyLabel,
        type,
        attachment: attachment?.url ? {
          url: String(attachment.url),
          filename: String(attachment.filename || 'Tệp đính kèm'),
          mimeType: String(attachment.mimeType || 'application/octet-stream'),
          size: Number(attachment.size) || 0
        } : undefined,
        readBy: [req.user.id],
        createdAt: new Date().toISOString()
      };

      await db.syncMessage(newMessage);

      conversation.lastMessage = {
        content: newMessage.content,
        senderId: req.user.id,
        senderName: req.user.name,
        createdAt: newMessage.createdAt
      };
      conversation.updatedAt = newMessage.createdAt;
      await db.syncConversation(conversation);
      emitConversationMessage(newMessage, conversation.participantIds);

      res.status(201).json({ success: true, data: newMessage });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // POST /api/conversations/direct
  getOrCreateDirectConversation: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const { targetUserId } = req.body;
      if (!targetUserId) {
        res.status(400).json({ success: false, message: 'Thiếu targetUserId' });
        return;
      }

      const targetUser = db.users.find(u => u.id === targetUserId);
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'Người nhận không tồn tại' });
        return;
      }

      // Check if direct conversation already exists between the two
      let conv = db.conversations.find(c =>
        c.type === 'DIRECT' &&
        c.participantIds.includes(req.user?.id || '') &&
        c.participantIds.includes(targetUserId)
      );

      if (!conv) {
        conv = {
          id: db.generateId('conv'),
          type: 'DIRECT',
          title: targetUser.name,
          participantIds: [req.user.id, targetUserId],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.syncConversation(conv);
      }

      res.json({ success: true, data: conv });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};
