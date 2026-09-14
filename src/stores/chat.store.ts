import { create } from 'zustand';
import { IConversation, IMessage } from '../types/index.js';
import { api } from '../services/api.js';

interface ChatState {
  conversations: IConversation[];
  activeConversation: IConversation | null;
  messages: IMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: Record<string, string>; // conversationId -> userName
  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
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
  typingUsers: {},

  fetchConversations: async () => {
    try {
      set({ isLoadingConversations: true });
      const res = await api.get('/conversations');
      set({ conversations: res.data.data, isLoadingConversations: false });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  selectConversation: async (conversationId: string) => {
    try {
      set({ isLoadingMessages: true });
      const currentConvs = get().conversations;
      const found = currentConvs.find((c) => c.id === conversationId);
      if (found) {
        set({ activeConversation: found });
      }

      const res = await api.get(`/conversations/${conversationId}/messages`);
      set({ messages: res.data.data, isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content: string) => {
    const active = get().activeConversation;
    if (!active || !content.trim()) return;

    try {
      const res = await api.post(`/conversations/${active.id}/messages`, { content });
      const newMsg = res.data.data;
      set((state) => ({
        messages: [...state.messages, newMsg]
      }));
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  },

  addIncomingMessage: (message: IMessage) => {
    set((state) => {
      // If it belongs to active conversation, append message
      if (state.activeConversation && state.activeConversation.id === message.conversationId) {
        const exists = state.messages.some((m) => m.id === message.id);
        if (exists) return state;
        return { messages: [...state.messages, message] };
      }
      return state;
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
