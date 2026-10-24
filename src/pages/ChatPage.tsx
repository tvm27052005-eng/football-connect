import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Users,
  Search,
  CheckCheck,
  Smile,
  Shield,
  Clock,
  Sparkles
  ,Paperclip, Image as ImageIcon, X, FileText
} from 'lucide-react';
import { useChatStore } from '../stores/chat.store.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useSocket } from '../hooks/useSocket.js';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton.js';
import { uploadApi } from '../services/upload.api.js';
import { OwnerSidebar } from '../components/layout/OwnerSidebar.js';
import { AdminSidebar } from '../components/layout/AdminSidebar.js';

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetConvId = searchParams.get('id');

  const { user } = useAuthStore();
  const {
    conversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    error,
    fetchConversations,
    selectConversation,
    sendMessage,
    typingUsers
  } = useChatStore();

  const { joinConversation, leaveConversation, emitTyping, emitStopTyping } = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await fetchConversations();
      const convs = useChatStore.getState().conversations;
      if (targetConvId) {
        selectConversation(targetConvId);
      } else if (convs.length > 0 && !useChatStore.getState().activeConversation) {
        selectConversation(convs[0].id);
      }
    };
    loadData();
  }, [fetchConversations, targetConvId, selectConversation]);

  useEffect(() => {
    if (activeConversation) {
      joinConversation(activeConversation.id);
      return () => {
        leaveConversation(activeConversation.id);
      };
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (!activeConversation || !user) return;

    emitTyping(activeConversation.id);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(activeConversation.id);
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || !activeConversation || isUploadingFile) return;

    emitStopTyping(activeConversation.id);
    const text = inputMessage;
    setInputMessage('');
    let attachment;
    try {
      if (selectedFile) {
        setIsUploadingFile(true);
        attachment = await uploadApi.uploadChatFile(selectedFile);
      }
      setSelectedFile(null);
      await sendMessage(text, attachment);
    } catch (uploadError) {
      console.error('Failed to send attachment:', uploadError);
      setInputMessage(text);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Tệp không được vượt quá 10MB');
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
    event.target.value = '';
  };

  const filteredConversations = conversations.filter((c) => {
    const title = c.displayTitle || c.title || '';
    return title.toLowerCase().includes(searchFilter.toLowerCase());
  });

  const portalSidebar = user?.role === 'OWNER'
    ? <OwnerSidebar />
    : user?.role === 'ADMIN'
      ? <AdminSidebar />
      : null;

  return (
    <div className={`flex min-h-[calc(100vh-4rem)] ${portalSidebar ? 'flex-col md:flex-row' : ''}`}>
      {portalSidebar}
      <div className="flex-1 min-w-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs h-[calc(100vh-10rem)] grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Left: Conversations List */}
        <div className="md:col-span-4 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50 min-h-0">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="flex items-center">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" /> Trò Chuyện Trực Tuyến
              </h2>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm đoạn hội thoại..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Conversations scroll area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80">
            {isLoadingConversations ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-200/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Chưa có cuộc hội thoại nào
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConversation?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isActive ? 'bg-emerald-50/80 border-l-2 border-emerald-600' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.displayAvatar || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=150'}
                        alt="avatar"
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200"
                      />
                      {conv.type === 'MATCH' && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                          ⚽
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {conv.displayTitle || conv.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {conv.lastMessage?.content || 'Bắt đầu cuộc trò chuyện...'}
                      </p>
                    </div>

                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-1">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Messages Viewport */}
        <div className="md:col-span-8 lg:col-span-8 flex flex-col bg-white min-h-0">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <img
                    src={activeConversation.displayAvatar || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=150'}
                    alt="avatar"
                    className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200"
                  />
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeConversation.displayTitle || activeConversation.title}
                  </h3>
                </div>
              </div>

              {/* Messages Body */}
              <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3">
                {isLoadingMessages ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-slate-100 rounded-xl w-1/3 animate-pulse" />
                    <div className="h-10 bg-slate-100 rounded-xl w-1/2 ml-auto animate-pulse" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <span>Hãy gửi tin nhắn đầu tiên để kết nối nhé!</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={msg.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + msg.senderId}
                            alt={msg.senderName}
                            className="w-6 h-6 rounded-full bg-slate-100 shrink-0 mb-1 border border-slate-200"
                          />
                        )}

                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                            isMe
                              ? 'bg-emerald-600 text-white font-medium rounded-br-none'
                              : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200/80'
                          }`}
                        >
                          {!isMe && (
                            <div className="text-[10px] font-bold text-emerald-700 mb-0.5">
                              {msg.senderName}
                            </div>
                          )}
                          {msg.content && !(msg.attachment && (msg.content === 'Đã gửi ảnh' || msg.content === 'Đã gửi tệp')) && (
                            <div className="leading-relaxed break-words">{msg.content}</div>
                          )}
                          {msg.attachment && (
                            msg.attachment.mimeType.startsWith('image/') ? (
                              <a href={msg.attachment.url} target="_blank" rel="noreferrer" className="block mt-2">
                                <img
                                  src={msg.attachment.url}
                                  alt={msg.attachment.filename}
                                  className="max-w-full max-h-48 rounded-lg object-contain bg-black/5"
                                />
                              </a>
                            ) : (
                              <a
                                href={msg.attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2 underline ${
                                  isMe ? 'bg-emerald-700/60 text-white' : 'bg-white text-emerald-700'
                                }`}
                              >
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="truncate">{msg.attachment.filename}</span>
                              </a>
                            )
                          )}
                          <div
                            className={`text-[9px] mt-1 text-right ${
                              isMe ? 'text-emerald-100 font-medium' : 'text-slate-400'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {typingUsers[activeConversation.id] && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 italic">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>{typingUsers[activeConversation.id]} đang soạn tin nhắn...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-2">
                {selectedFile && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                    <span className="flex items-center gap-2 truncate">
                      {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      <span className="truncate">{selectedFile.name}</span>
                    </span>
                    <button type="button" onClick={() => setSelectedFile(null)} className="p-1 hover:text-red-600" aria-label="Bỏ tệp đính kèm">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder="Nhập tin nhắn trao đổi về sân bóng, kèo đấu..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="p-2.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                  aria-label="Đính kèm tệp hoặc hình ảnh"
                  title="Đính kèm tệp hoặc hình ảnh (tối đa 10MB)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={(!inputMessage.trim() && !selectedFile) || isUploadingFile}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 text-xs">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-emerald-600 flex items-center justify-center mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Chọn một cuộc trò chuyện</h3>
              <p className="max-w-xs text-slate-500">
                Trao đổi trực tiếp với Quản lý sân, Đội trưởng hoặc các đồng đội tham gia trận bóng.
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
