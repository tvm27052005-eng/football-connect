import { create } from 'zustand';
import { IConversation, IMessage } from '../types/index.js';
import { api } from '../services/api.js';

interface ChatState {
  conversations: IConversation[];
  activeConversation: IConversation | null;
  messages: IMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  typingUsers: Record<string, string>; // conversationId -> userName
  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, attachment?: IMessage['attachment']) => Promise<void>;
  addIncomingMessage: (message: IMessage) => void;
  setUserTyping: (conversationId: string, userName: string) => void;
  clearUserTyping: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  error: null,
  typingUsers: {},

  fetchConversations: async () => {
    try {
      set({ isLoadingConversations: true, error: null });
      const res = await api.get('/conversations');
      set({ conversations: res.data.data, isLoadingConversations: false });
    } catch (error) {
      set({
        isLoadingConversations: false,
        error: error instanceof Error ? error.message : 'Không thể tải danh sách hội thoại'
      });
    }
  },

  selectConversation: async (conversationId: string) => {
    try {
      set({ isLoadingMessages: true, error: null });
      const currentConvs = get().conversations;
      const found = currentConvs.find((c) => c.id === conversationId);
      if (found) {
        set({
          activeConversation: found,
          conversations: currentConvs.map((conversation) =>
            conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
          )
        });
      }

      const res = await api.get(`/conversations/${conversationId}/messages`);
      set({ messages: res.data.data, isLoadingMessages: false });
    } catch (error) {
      set({
        isLoadingMessages: false,
        error: error instanceof Error ? error.message : 'Không thể tải tin nhắn'
      });
    }
  },

  sendMessage: async (content: string, attachment?: IMessage['attachment']) => {
    const active = get().activeConversation;
    if (!active || (!content.trim() && !attachment)) return;

    try {
      set({ error: null });
      const res = await api.post(`/conversations/${active.id}/messages`, { content, attachment });
      const newMsg = res.data.data;
      set((state) => {
        const messages = state.messages.some((message) => message.id === newMsg.id)
          ? state.messages
          : [...state.messages, newMsg];
        const conversations = state.conversations.map((conversation) =>
          conversation.id === active.id
            ? {
                ...conversation,
                lastMessage: {
                  content: newMsg.content,
                  senderId: newMsg.senderId,
                  senderName: newMsg.senderName,
                  createdAt: newMsg.createdAt
                },
                updatedAt: newMsg.createdAt
              }
            : conversation
        );
        return { messages, conversations };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể gửi tin nhắn' });
    }
  },

  addIncomingMessage: (message: IMessage) => {
    set((state) => {
      const conversation = state.conversations.find((item) => item.id === message.conversationId);

      const updatedConversations = conversation
        ? state.conversations.map((item) => item.id === message.conversationId
          ? {
              ...item,
              lastMessage: {
                content: message.content,
                senderId: message.senderId,
                senderName: message.senderName,
                createdAt: message.createdAt
              },
              updatedAt: message.createdAt,
              unreadCount: item.id === state.activeConversation?.id
                ? item.unreadCount
                : (item.unreadCount || 0) + 1
            }
          : item)
        : state.conversations;

      // If it belongs to active conversation, append message
      if (state.activeConversation && state.activeConversation.id === message.conversationId) {
        const exists = state.messages.some((m) => m.id === message.id);
        if (exists) return { conversations: updatedConversations };
        return { messages: [...state.messages, message], conversations: updatedConversations };
      }
      return { conversations: updatedConversations };
    });
  },

  setUserTyping: (conversationId: string, userName: string) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [conversationId]: userName }
    }));
  },

  clearUserTyping: (conversationId: string) => {
    set((state) => {
      const newTyping = { ...state.typingUsers };
      delete newTyping[conversationId];
      return { typingUsers: newTyping };
    });
  }
}));
