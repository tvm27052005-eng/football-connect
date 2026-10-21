import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { IMessage } from '../types/index.js';
import { db } from '../models/db.js';

let socketServer: SocketIOServer | null = null;

export function emitConversationMessage(message: IMessage, participantIds: string[]): void {
  if (!socketServer) return;

  socketServer.to(`conv:${message.conversationId}`).emit('receive_message', message);
  participantIds
    .filter((participantId) => participantId !== message.senderId)
    .forEach((participantId) => {
      socketServer?.to(`user:${participantId}`).emit('notification_received', {
        id: `notif_${message.id}`,
        userId: participantId,
        title: `Tin nhắn mới từ ${message.senderName}`,
        message: message.content.substring(0, 50),
        type: 'NEW_MESSAGE',
        link: `/chat?id=${message.conversationId}`,
        createdAt: message.createdAt
      });
    });
}

export function initSocketService(io: SocketIOServer): void {
  socketServer = io;
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
      if (!socketUser || !db.conversations.some((conversation) =>
        conversation.id === conversationId && conversation.participantIds.includes(socketUser.id)
      )) {
        return;
      }
      socket.join(`conv:${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Typing indicators
    socket.on('typing', ({ conversationId }: { conversationId: string }) => {
      if (!socketUser || !db.conversations.some((conversation) =>
        conversation.id === conversationId && conversation.participantIds.includes(socketUser.id)
      )) {
        return;
      }
      socket.to(`conv:${conversationId}`).emit('user_typing', {
        conversationId,
        userName: socketUser.name
      });
    });

    socket.on('stop_typing', ({ conversationId }: { conversationId: string }) => {
      if (!socketUser || !db.conversations.some((conversation) =>
        conversation.id === conversationId && conversation.participantIds.includes(socketUser.id)
      )) {
        return;
      }
      socket.to(`conv:${conversationId}`).emit('user_stop_typing', { conversationId });
    });

    socket.on('disconnect', () => {
      if (socketUser) {
        io.emit('user_offline', { userId: socketUser.id });
      }
    });
  });
}
