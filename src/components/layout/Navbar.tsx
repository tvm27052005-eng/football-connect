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
  Sparkles,
  Zap,
  Flame
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store.js';
import { useNotificationStore } from '../../stores/notification.store.js';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, switchDemoRole } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAllAsRead } = useNotificationStore();

  const isAdminRoute = location.pathname.startsWith('/admin');

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

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
    { name: 'Cáp kèo & Đối thủ', path: '/matches', icon: Users, badge: 'HOT' },
    { name: 'Đặt lịch sân', path: '/booking/create', icon: Calendar },
    ...(isAuthenticated && user?.role !== 'ADMIN' ? [{ name: 'Lịch của tôi', path: '/bookings' }] : []),
    ...(isAuthenticated && user?.role !== 'ADMIN' ? [{ name: 'Phòng chat', path: '/chat', icon: MessageSquare }] : [])
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/90 text-slate-800 transition-all shadow-xs">
      {/* Top Sport Utility Bar */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs text-slate-300 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Zap className="w-3 h-3 mr-1 text-emerald-400 fill-emerald-400" /> FOOTBALL CONNECT
          </span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">Nền tảng đặt sân & kết nối cộng đồng đá bóng số 1</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white group-hover:scale-105 transition-all duration-300">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  FOOTBALL
                </span>
                <span className="font-black text-xl sm:text-2xl tracking-tight text-emerald-600">
                  CONNECT
                </span>
              </div>
              <span className="text-[10px] tracking-widest uppercase text-emerald-700/80 block -mt-1 font-bold">
                Cộng Đồng Bóng Đá Phong Trào
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {!isAdminRoute && (
            <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                      isActive
                        ? 'text-emerald-900 bg-white font-extrabold shadow-sm border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                    }`}
                  >
                    {link.icon && <link.icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />}
                    {link.name}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-xs flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 fill-white" />
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Menu */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                {/* Notification Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="relative p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer"
                    title="Thông báo"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                            <Bell className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-sm text-slate-900">Thông báo mới</span>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đánh dấu đã đọc
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            Bạn chưa có thông báo mới nào
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <Link
                              key={n.id}
                              to={n.link || '/bookings'}
                              onClick={() => setShowNotifMenu(false)}
                              className={`p-3.5 block hover:bg-slate-50 transition-colors ${
                                !n.isRead ? 'bg-emerald-50/40' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    !n.isRead ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-transparent'
                                  }`}
                                />
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
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
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border border-amber-200/80 text-xs font-bold hover:shadow-xs transition-all"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    Quản Lý Sân
                  </Link>
                )}

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-900 border border-purple-200/80 text-xs font-bold hover:shadow-xs transition-all"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    Quản Trị Admin
                  </Link>
                )}

                {/* User Profile Dropdown */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200/80 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-[11px] font-bold text-slate-900">{user?.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{user?.role}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-3.5 border-b border-slate-100 bg-slate-50">
                        <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{user?.email}</div>
                      </div>

                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-500" /> Hồ sơ cá nhân
                        </Link>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" /> Đăng xuất
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
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs transition-all"
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
