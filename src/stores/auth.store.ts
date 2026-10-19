import { create } from 'zustand';
import { IUser, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<IUser>;
  register: (data: Record<string, unknown>) => Promise<IUser>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (userData: Partial<IUser>) => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  setAuthSession: (user: IUser, token: string) => void;
}

const savedUser = localStorage.getItem('fc_user');
const savedToken = localStorage.getItem('fc_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  isLoading: false,
  isAuthenticated: !!savedToken,
  error: null,

  setAuthSession: (user, token) => {
    localStorage.setItem('fc_token', token);
    localStorage.setItem('fc_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false, error: null });
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, accessToken } = response.data.data;
      localStorage.setItem('fc_token', accessToken);
      localStorage.setItem('fc_user', JSON.stringify(user));
      set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đăng nhập thất bại';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', formData);
      const { user, accessToken } = response.data.data;
      localStorage.setItem('fc_token', accessToken);
      localStorage.setItem('fc_user', JSON.stringify(user));
      set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đăng ký thất bại';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  logout: () => {
    localStorage.removeItem('fc_token');
    localStorage.removeItem('fc_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchCurrentUser: async () => {
    const token = localStorage.getItem('fc_token');
    if (!token) return;
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data;
      localStorage.setItem('fc_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('fc_token');
      localStorage.removeItem('fc_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  updateUser: (userData) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...userData };
      localStorage.setItem('fc_user', JSON.stringify(updated));
      return { user: updated };
    });
  },

  switchDemoRole: async (role: UserRole) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/demo-login', { role });
      const { user, accessToken } = res.data.data;
      localStorage.setItem('fc_token', accessToken);
      localStorage.setItem('fc_user', JSON.stringify(user));
      set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Demo login switch error:', error);
    }
  }
}));
