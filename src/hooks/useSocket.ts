import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store.js';
import { useChatStore } from '../stores/chat.store.js';
import { useNotificationStore } from '../stores/notification.store.js';
import { IMessage, INotification } from '../types/index.js';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user, token } = useAuthStore();
  const { addIncomingMessage, setUserTyping, clearUserTyping } = useChatStore();
  const { addRealtimeNotification } = useNotificationStore();

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io({
      auth: { token },
      query: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Connected to Football Connect realtime server
    });

    socket.on('receive_message', (message: IMessage) => {
      addIncomingMessage(message);
    });

    socket.on('notification_received', (notification: INotification) => {
      addRealtimeNotification(notification);
    });

    socket.on('user_typing', ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      setUserTyping(conversationId, userName);
    });

    socket.on('user_stop_typing', ({ conversationId }: { conversationId: string }) => {
      clearUserTyping(conversationId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id]);

  const joinConversation = (conversationId: string) => {
    socketRef.current?.emit('join_conversation', conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socketRef.current?.emit('leave_conversation', conversationId);
  };

  const emitTyping = (conversationId: string) => {
    socketRef.current?.emit('typing', { conversationId });
  };

  const emitStopTyping = (conversationId: string) => {
    socketRef.current?.emit('stop_typing', { conversationId });
  };

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    emitTyping,
    emitStopTyping
  };
}
