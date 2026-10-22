import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, RefreshCw, ChevronDown, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { sendAIMessage, AIMessageItem, AssistantAction } from '../../services/ai.api.js';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store.js';
import { AssistantText } from './AssistantText.js';

const QUICK_PROMPTS = [
  'Football-Connect có những chức năng gì?',
  'Hướng dẫn sử dụng website.',
  'Tôi gặp lỗi khi sử dụng website.',
  'Tôi muốn tìm thông tin bóng đá.',
  'Tôi muốn liên hệ với bộ phận hỗ trợ.'
];

const STORAGE_KEY = 'fc_assistant_session_v1';
const TRUSTED_ACTIONS: Record<AssistantAction['id'], { label: string; path: string }> = {
  'find-venues': { label: 'Mở Tìm sân bóng', path: '/venues' },
  'create-booking': { label: 'Mở Đặt lịch sân', path: '/booking/create' },
  'my-bookings': { label: 'Mở Lịch đặt của tôi', path: '/bookings' },
  'friendly-matches': { label: 'Mở Kèo giao hữu', path: '/matches' },
  messages: { label: 'Mở Tin nhắn', path: '/chat' },
  profile: { label: 'Mở Hồ sơ', path: '/profile' },
  login: { label: 'Mở Đăng nhập', path: '/login' },
  register: { label: 'Mở Đăng ký', path: '/register' },
};
const getTrustedActions = (actions: unknown): AssistantAction[] => Array.isArray(actions)
  ? actions.flatMap(item => {
      const id = item && typeof item === 'object' && 'id' in item ? (item as { id?: string }).id : undefined;
      const trusted = id && id in TRUSTED_ACTIONS ? TRUSTED_ACTIONS[id as AssistantAction['id']] : null;
      return trusted ? [{ id: id as AssistantAction['id'], ...trusted }] : [];
    }).slice(0, 3)
  : [];
const welcome = (): AIMessageItem => ({ id: 'welcome', sender: 'ai', text: 'Xin chào! 👋 Chào mừng bạn đến với Football-Connect. Mình là trợ lý ảo, sẵn sàng giúp bạn tìm kiếm thông tin và giải đáp thắc mắc về website. Bạn cần hỗ trợ điều gì?', timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) });

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const userId = useAuthStore(s => s.user?.id || 'guest');
  const ownerRef = useRef(userId);
  const [messages, setMessages] = useState<AIMessageItem[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.owner === userId && saved.expires > Date.now() && Array.isArray(saved.messages)) {
        const valid = saved.messages.slice(-40).filter((m: AIMessageItem) => typeof m.id === 'string' && ['user', 'ai'].includes(m.sender) && typeof m.text === 'string' && m.text.length <= 6000 && typeof m.timestamp === 'string')
          .map((m: AIMessageItem) => ({ ...m, actions: getTrustedActions(m.actions) }));
        if (valid.length) return valid;
      }
    } catch { /* Storage can be unavailable in private browsing. */ }
    return [welcome()];
  });
  const requestRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ownerRef.current !== userId) {
      ownerRef.current = userId;
      requestRef.current?.abort(); busyRef.current = false;
      setMessages([welcome()]); setInput(''); setError(''); setRetry(''); setLoading(false);
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* optional storage */ }
      return;
    }
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ owner: userId, expires: Date.now() + 24 * 60 * 60 * 1000, messages: messages.slice(-40) })); } catch { /* optional storage */ }
  }, [messages, userId]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading, error]);

  const handleSend = async (textToSend?: string, isRetry = false) => {
    const query = (textToSend || input).trim();
    if (!query || busyRef.current || cooldown) return;
    if (query.length > 2000) { setError('Câu hỏi tối đa 2.000 ký tự.'); return; }
    busyRef.current = true;
    const controller = new AbortController(); requestRef.current = controller;
    setError(''); setRetry('');

    const userMsg: AIMessageItem = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!isRetry) setMessages(prev => [...prev, userMsg].slice(-40));
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = isRetry && messages.at(-1)?.sender === 'user' ? messages.slice(0, -1) : messages;
      const data = await sendAIMessage(query, history, controller.signal);
      if (controller.signal.aborted) return;
      const aiMsg: AIMessageItem = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Xin lỗi, tôi chưa thể trả lời lúc này. Bạn vui lòng thử lại nhé!',
        notice: data.reason === 'TIMEOUT' ? 'AI hết thời gian chờ · Đang dùng hướng dẫn website' : data.reason ? 'AI tạm gián đoạn · Đang dùng hướng dẫn website' : data.mode === 'knowledge' ? 'Nguồn: hướng dẫn website' : undefined,
        supportEmail: data.handoff?.email || undefined,
        actions: getTrustedActions(data.actions),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      if (controller.signal.aborted) return;
      setRetry(query);
      if (error.response?.status === 429) {
        setCooldown(Math.min(120, Number(error.response.headers['retry-after']) || 60));
        setError('Bạn đã gửi quá nhiều yêu cầu. Hãy chờ rồi thử lại.');
      } else setError(error.code === 'ECONNABORTED' ? 'Hết thời gian chờ. Bạn có thể thử lại câu hỏi.' : 'Không thể kết nối. Kiểm tra mạng rồi thử lại câu hỏi.');
    } finally {
      if (requestRef.current === controller) { busyRef.current = false; setLoading(false); }
    }
  };

  const handleClearHistory = () => {
    requestRef.current?.abort(); requestRef.current = null; busyRef.current = false;
    setMessages([welcome()]); setInput(''); setError(''); setRetry(''); setLoading(false);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* optional storage */ }
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          aria-label="Mở trợ lý Football-Connect"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
          title="Trợ lý AI Football Connect"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-bounce" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="hidden md:inline font-semibold text-sm pr-1">Hỏi AI Trợ Lý</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Chat Box Modal */}
      {isOpen && (
        <div role="dialog" aria-label="Football-Connect Assistant" onKeyDown={e => { if (e.key === 'Escape') setIsOpen(false); }} className="flex flex-col w-[calc(100vw-2rem)] sm:w-[380px] md:w-[420px] h-[560px] max-h-[calc(100dvh-7rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 motion-reduce:transition-none">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-3.5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  Football-Connect Assistant
                </h3>
                <p className="text-[11px] text-emerald-100/90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  Sẵn sàng giải đáp 24/7
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 hover:bg-white/15 rounded-lg transition text-emerald-100 hover:text-white"
                title="Xóa lịch sử chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg transition text-emerald-100 hover:text-white"
                title="Thu nhỏ"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div role="log" aria-live="polite" aria-relevant="additions" className="flex-1 min-h-0 p-4 overflow-y-auto bg-slate-50 space-y-3.5">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3 rounded-2xl shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{msg.text}</p>
                  ) : (
                    <AssistantText text={msg.text} />
                  )}

                  {msg.notice && <p className="mt-2 text-[10px] text-slate-500">{msg.notice}</p>}
                  {msg.supportEmail && /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(msg.supportEmail) && <a className="block mt-2 text-sm underline text-emerald-700" href={`mailto:${msg.supportEmail}?subject=Football-Connect%20Support`}>Soạn email hỗ trợ (chưa gửi)</a>}
                  {msg.sender === 'ai' && getTrustedActions(msg.actions).length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {getTrustedActions(msg.actions).map(action => (
                        <button
                          key={action.id}
                          onClick={() => { setIsOpen(false); navigate(action.path); }}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          {action.label}<ArrowRight className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-emerald-100/80' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* AI Typing Indicator */}
            {loading && (
              <div role="status" aria-label="Trợ lý đang trả lời" className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-xs shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
            {QUICK_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSend(prompt)}
                disabled={loading || cooldown > 0}
                className="text-xs whitespace-nowrap bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-500">
            <button
              onClick={() => { setIsOpen(false); navigate('/venues'); }}
              className="flex items-center gap-1 hover:text-emerald-600 transition"
            >
              <MapPin className="w-3 h-3 text-emerald-500" /> Tìm sân bóng
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => { setIsOpen(false); navigate('/booking/create'); }}
              className="flex items-center gap-1 hover:text-emerald-600 transition"
            >
              <Calendar className="w-3 h-3 text-amber-500" /> Đặt lịch sân
            </button>
          </div>

          {/* Input Box */}
          {error && <div role="alert" className="px-3 py-2 text-xs text-red-700 bg-red-50">{error} {retry && <button disabled={loading || cooldown > 0} className="underline disabled:opacity-50" onClick={() => handleSend(retry, true)}>Thử lại {cooldown > 0 ? `(${cooldown}s)` : ''}</button>}</div>}
          <p className="px-3 pt-2 text-[10px] text-slate-500">Lịch sử lưu trong tab tối đa 24 giờ. Không gửi mật khẩu/OTP. Khi bật AI, nội dung được gửi tới nhà cung cấp.</p>
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <textarea
              ref={inputRef}
              aria-label="Câu hỏi cho trợ lý"
              rows={2}
              maxLength={2000}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend(); } }}
              placeholder="Nhập câu hỏi cho AI (VD: Tìm sân Cầu Giấy)..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-sm px-3.5 py-2.5 rounded-xl outline-none transition text-slate-800 placeholder:text-slate-400"
              disabled={loading}
            />
            <button
              aria-label="Gửi câu hỏi"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading || cooldown > 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white p-2.5 rounded-xl transition shadow-sm flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
