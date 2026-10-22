import { GoogleGenAI } from '@google/genai';
export interface AssistantProvider {
  generate(system: string, messages: { sender: string; text: string }[], signal: AbortSignal): Promise<string>;
}
export function createProvider(): AssistantProvider | null {
  if (process.env.AI_PROVIDER !== 'gemini' || !process.env.GEMINI_API_KEY || !process.env.AI_MODEL) return null;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return { async generate(system, messages, signal) {
    const result = await ai.models.generateContent({
      model: process.env.AI_MODEL!,
      contents: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
      config: { systemInstruction: system, abortSignal: signal, maxOutputTokens: 1000, temperature: 0.2 },
    });
    if (!result.text?.trim()) throw new Error('EMPTY_RESPONSE');
    return result.text.slice(0, 6000);
  } };
}
