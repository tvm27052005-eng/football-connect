import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, RefreshCw, ChevronDown, MapPin, Calendar, Zap, MessageSquare } from 'lucide-react';
import { sendAIMessage, AIMessageItem } from '../../services/ai.api.js';
import { useNavigate } from 'react-router-dom';

const QUICK_PROMPTS = [
  ' Sân bóng ở Cầu Giấy',
  ' Hướng dẫn đặt sân',
  ' Kèo giao hữu đang mở',
  ' Bảng giá thuê sân'
];

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessageItem[]>([
    {
      id: 'welcome_1',
      sender: 'ai',
      text: 'Xin chào! Mình là **Football Connect AI Assistant** ⚽. Mình có thể giúp gì cho bạn hôm nay? (Tìm sân, cáp kèo, bảng giá, hướng dẫn...)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: AIMessageItem = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const data = await sendAIMessage(query, messages);
      const aiMsg: AIMessageItem = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Xin lỗi, tôi chưa thể trả lời lúc này. Bạn vui lòng thử lại nhé!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: AIMessageItem = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: 'Có lỗi kết nối máy chủ AI. Vui lòng kiểm tra lại đường truyền của bạn!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'ai',
        text: 'Đã làm mới đoạn chat! Bạn cần Football Connect AI hỗ trợ thông tin gì tiếp theo? ⚽',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Basic formatting helper for bold text and quick links
  const renderFormattedText = (text: string) => {
    // Split text by newlines
    const lines = text.split('\n');

    return (
      <div className="space-y-1 text-sm leading-relaxed">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} className="h-2" />;

          // Parse markdown bold **word**
          const parts = line.split(/(\*\*.*?\*\*)/g);

          return (
            <p key={lIdx} className="break-words">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pIdx} className="font-semibold text-emerald-950 dark:text-emerald-100">{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
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
        <div className="flex flex-col w-[calc(100vw-2rem)] sm:w-[380px] md:w-[420px] h-[520px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-3.5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  Football Connect AI
                  <span className="bg-emerald-400/30 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                    Beta
                  </span>
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
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3.5">
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderFormattedText(msg.text)
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
              <div className="flex gap-2.5 items-center">
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
                disabled={loading}
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
              <MapPin className="w-3 h-3 text-emerald-500" /> Xem sân bóng
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => { setIsOpen(false); navigate('/matches'); }}
              className="flex items-center gap-1 hover:text-emerald-600 transition"
            >
              <Zap className="w-3 h-3 text-amber-500" /> Cáp kèo ngay
            </button>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi cho AI (VD: Tìm sân Cầu Giấy)..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-sm px-3.5 py-2.5 rounded-xl outline-none transition text-slate-800 placeholder:text-slate-400"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
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
