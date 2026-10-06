import { api } from './api.js';

export interface AIMessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export async function sendAIMessage(message: string, history: AIMessageItem[]) {
  const response = await api.post('/ai/chat', {
    message,
    history
  });
  return response.data;
}
