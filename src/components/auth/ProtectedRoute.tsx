import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store.js';
import { UserRole } from '../../types/index.js';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const RoleRoute: React.FC<{ allowedRoles: UserRole[]; children?: React.ReactNode }> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 text-2xl">
          🚫
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Không đủ quyền truy cập</h2>
        <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
          Khu vực này yêu cầu vai trò <span className="font-bold text-amber-600">{allowedRoles.join(' hoặc ')}</span>. Vai trò hiện tại của bạn là <span className="font-bold text-emerald-600">{user?.role}</span>.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          👉 Mẹo: Bạn có thể bấm vào <strong className="text-emerald-600">Demo Role Switcher</strong> trên cùng thanh menu để chuyển đổi vai trò ngay lập tức!
        </p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
