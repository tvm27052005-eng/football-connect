import { api } from './api.js';

export interface AIMessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  notice?: string;
  supportEmail?: string;
  actions?: AssistantAction[];
}

export interface AssistantAction {
  id: 'find-venues' | 'create-booking' | 'my-bookings' | 'friendly-matches' | 'messages' | 'profile' | 'login' | 'register';
  label: string;
  path: string;
}

export async function sendAIMessage(message: string, history: AIMessageItem[], signal?: AbortSignal) {
  let remaining = 12000;
  const context = history.filter(m => !m.id.startsWith('welcome')).slice(-10).reverse().map(m => {
    const text = m.text.slice(0, Math.min(2000, remaining));
    remaining -= text.length;
    return { sender: m.sender, text };
  }).filter(m => m.text).reverse();
  const response = await api.post('/ai/chat', {
    message,
    history: context
  }, { timeout: 30000, signal });
  return response.data;
}
