import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Swords,
  Star,
  Flag,
  ArrowLeft,
  FileCode2
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard Toàn Sàn', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Người Dùng', path: '/admin/users', icon: Users },
    { name: 'Phê Duyệt Cụm Sân', path: '/admin/venues', icon: Building2 },
    { name: 'Sổ Cái Đặt Sân', path: '/admin/bookings', icon: CalendarCheck }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-100 bg-slate-50/75">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-sm">
            🛡️
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Quản Trị Hệ Thống</h3>
            <p className="text-[11px] text-purple-700 font-semibold">Toàn quyền ADMIN</p>
          </div>
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
                  ? 'bg-purple-50 text-purple-800 border border-purple-200 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
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
          <ArrowLeft className="w-4 h-4" /> Về giao diện Người dùng
        </Link>
      </div>
    </aside>
  );
};
