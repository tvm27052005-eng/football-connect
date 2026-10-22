import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Grid3X3,
  CalendarDays,
  MessageSquareQuote,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

export const OwnerSidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Tổng quan Doanh thu', path: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Cụm sân', path: '/owner/venues', icon: MapPin },
    { name: 'Quản lý Sân con & Giá', path: '/owner/fields', icon: Grid3X3 },
    { name: 'Lịch & Duyệt đặt sân', path: '/owner/bookings', icon: CalendarDays },
    { name: 'Đánh giá từ khách', path: '/owner/reviews', icon: MessageSquareQuote },
    { name: 'Phòng chat', path: '/chat', icon: MessageSquare }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-100 bg-slate-50/75">
        <div className="space-y-1.5">
          <img
            src="/images/football-connect-logo.png"
            alt="Football Connect"
            className="h-11 w-40 object-contain object-left"
          />
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">Cổng Chủ Sân</h3>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Về trang người dùng
        </Link>
      </div>
    </aside>
  );
};
