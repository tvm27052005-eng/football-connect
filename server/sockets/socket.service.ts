import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { db } from '../models/db.js';
import { IMessage } from '../types/index.js';

export function initSocketService(io: SocketIOServer): void {
  // Middleware for socket auth
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (token && typeof token === 'string') {
      try {
        const payload = verifyToken(token);
        (socket as unknown as { user: typeof payload }).user = payload;
      } catch {
        // Allow guest or handle invalid gracefully
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const socketUser = (socket as unknown as { user?: { id: string; name: string; email: string } }).user;
    if (socketUser) {
      // Join personal room for realtime notifications
      socket.join(`user:${socketUser.id}`);
      io.emit('user_online', { userId: socketUser.id, status: 'ONLINE' });
    }

    // Join conversation room
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', { conversationId, userName });
    });

    socket.on('stop_typing', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conv:${conversationId}`).emit('user_stop_typing', { conversationId });
    });

    // Realtime message event
    socket.on('send_message', (data: {
      conversationId: string;
      senderId: string;
      senderName: string;
      senderAvatar?: string;
      content: string;
    }) => {
      const { conversationId, senderId, senderName, senderAvatar, content } = data;
      if (!conversationId || !content || !content.trim()) return;

      const conversation = db.conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const newMessage: IMessage = {
        id: db.generateId('msg'),
        conversationId,
        senderId,
        senderName,
        senderAvatar,
        content: content.trim(),
        type: 'TEXT',
        readBy: [senderId],
        createdAt: new Date().toISOString()
      };

      db.messages.push(newMessage);

      conversation.lastMessage = {
        content: newMessage.content,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        createdAt: newMessage.createdAt
      };
      conversation.updatedAt = newMessage.createdAt;

      // Broadcast to room
      io.to(`conv:${conversationId}`).emit('receive_message', newMessage);

      // Notify other participants if not in the room
      conversation.participantIds.forEach(pId => {
        if (pId !== senderId) {
          io.to(`user:${pId}`).emit('notification_received', {
            id: db.generateId('notif'),
            userId: pId,
            title: `Tin nhắn mới từ ${senderName}`,
            message: content.substring(0, 50),
            type: 'NEW_MESSAGE',
            link: `/chat`,
            createdAt: new Date().toISOString()
          });
        }
      });
    });

    socket.on('disconnect', () => {
      if (socketUser) {
        io.emit('user_offline', { userId: socketUser.id });
      }
    });
  });
}
