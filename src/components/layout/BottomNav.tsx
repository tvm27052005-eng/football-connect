import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Users, Calendar, User, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store.js';
import { useChatStore } from '../../stores/chat.store.js';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { conversations } = useChatStore();

  const totalUnreadChat = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const items = [
    { label: 'Trang chủ', path: '/', icon: Home },
    { label: 'Sân bóng', path: '/venues', icon: Search },
    { label: 'Tìm đối', path: '/matches', icon: Users },
    { label: 'Lịch đặt', path: isAuthenticated ? '/bookings' : '/login', icon: Calendar },
    {
      label: isAuthenticated ? 'Tin nhắn' : 'Tài khoản',
      path: isAuthenticated ? '/chat' : '/login',
      icon: isAuthenticated ? MessageSquare : User,
      badge: isAuthenticated && totalUnreadChat > 0 ? totalUnreadChat : undefined
    }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {item.badge && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
