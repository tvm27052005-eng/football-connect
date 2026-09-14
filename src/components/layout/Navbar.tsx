import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Users,
  Search,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Shield,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  FileCode2,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store.js';
import { useNotificationStore } from '../../stores/notification.store.js';
import { UserRole } from '../../types/index.js';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, switchDemoRole } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAllAsRead } = useNotificationStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Tìm sân bóng', path: '/venues', icon: Search },
    { name: 'Ghép đối & Kèo đá', path: '/matches', icon: Users, badge: 'Hot' },
    { name: 'Đặt sân nhanh', path: '/booking/create', icon: Calendar },
    ...(isAuthenticated ? [{ name: 'Lịch đặt sân', path: '/bookings' }] : []),
    ...(isAuthenticated ? [{ name: 'Trò chuyện', path: '/chat', icon: MessageSquare }] : [])
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs transition-all">
      {/* Top Demo Helper Bar */}
      <div className="bg-slate-900 px-4 py-1.5 text-xs text-slate-300 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="w-3 h-3 mr-1 text-emerald-400" /> Demo Role Switcher
          </span>
          <span className="hidden sm:inline text-slate-300">Chuyển vai trò nhanh để kiểm tra:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => switchDemoRole('USER')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
              user?.role === 'USER'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            👤 User (Cầu thủ)
          </button>
          <button
            onClick={() => switchDemoRole('OWNER')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
              user?.role === 'OWNER'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏟️ Owner (Chủ sân)
          </button>
          <button
            onClick={() => switchDemoRole('ADMIN')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
              user?.role === 'ADMIN'
                ? 'bg-purple-400 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🛡️ Admin (Quản trị)
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm text-white group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  FOOTBALL
                </span>
                <span className="font-black text-lg tracking-tight text-emerald-600">
                  CONNECT
                </span>
              </div>
              <span className="text-[10px] tracking-wider uppercase text-slate-500 block -mt-1 font-semibold">
                Sân bóng & Tìm đối
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/80 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4 opacity-80 text-slate-500" />}
                  {link.name}
                  {link.badge && (
                    <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors"
                    title="Thông báo"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold text-sm text-slate-900">Thông báo</span>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đọc tất cả
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 text-sm">
                            Chưa có thông báo nào
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <Link
                              key={n.id}
                              to={n.link || '/notifications'}
                              onClick={() => setShowNotifMenu(false)}
                              className={`p-3.5 block hover:bg-slate-50 transition-colors ${
                                !n.isRead ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    !n.isRead ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-transparent'
                                  }`}
                                />
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-900">{n.title}</h4>
                                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                                  <span className="text-[10px] text-slate-400 mt-1 block">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                                    {new Date(n.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Specific Dashboard Quick Link */}
                {user?.role === 'OWNER' && (
                  <Link
                    to="/owner/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-all"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    Quản lý Sân
                  </Link>
                )}

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition-all"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    Quản trị Admin
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-all"
                  >
                    <img
                      src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                      alt={user?.name}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200"
                    />
                    <div className="hidden md:block text-left pr-1">
                      <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{user?.name}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{user?.role}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 divide-y divide-slate-100 text-slate-800">
                      <div className="px-4 py-2.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {user?.role === 'USER' ? 'Cầu thủ' : user?.role === 'OWNER' ? 'Chủ sân' : 'Quản trị viên'}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                        >
                          <User className="w-4 h-4 text-slate-400" /> Hồ sơ cá nhân
                        </Link>
                        <Link
                          to="/bookings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                        >
                          <Calendar className="w-4 h-4 text-slate-400" /> Lịch đặt sân của tôi
                        </Link>
                        <Link
                          to="/chat"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                        >
                          <MessageSquare className="w-4 h-4 text-slate-400" /> Tin nhắn & Phòng chat
                        </Link>

                        {user?.role === 'OWNER' && (
                          <Link
                            to="/owner/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-amber-700 hover:bg-amber-50"
                          >
                            <Briefcase className="w-4 h-4 text-amber-600" /> Bảng điều khiển Chủ sân
                          </Link>
                        )}

                        {user?.role === 'ADMIN' && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-purple-700 hover:bg-purple-50"
                          >
                            <Shield className="w-4 h-4 text-purple-600" /> Bảng quản trị Hệ thống
                          </Link>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" /> Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-transform active:scale-95"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
