import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, Lock, Unlock, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { IUser } from '../../types/index.js';
import { AdminSidebar } from '../../components/layout/AdminSidebar.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton.js';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users/admin/all');
      setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: IUser) => {
    const newStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await api.put(`/users/admin/${user.id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi cập nhật trạng thái';
      alert(msg);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'USER' | 'OWNER' | 'ADMIN') => {
    try {
      await api.put(`/users/admin/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi phân quyền';
      alert(msg);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Người Dùng & Phân Quyền (RBAC)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phân quyền tài khoản USER, OWNER, ADMIN và khóa tài khoản vi phạm chính sách.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 shadow-xs">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 font-medium"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="USER">Cầu thủ (USER)</option>
              <option value="OWNER">Chủ sân (OWNER)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={4} type="row" />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="Không tìm thấy người dùng nào"
            description="Không có tài khoản nào khớp với tiêu chí tìm kiếm của bạn."
            icon={Users}
          />
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold">Người Dùng</th>
                    <th className="p-4 font-bold">Vai Trò</th>
                    <th className="p-4 font-bold">Khu Vực</th>
                    <th className="p-4 font-bold">Trạng Thái</th>
                    <th className="p-4 font-bold text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.id}
                            alt={u.name}
                            className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value as any)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                        >
                          <option value="USER">USER (Cầu thủ)</option>
                          <option value="OWNER">OWNER (Chủ sân)</option>
                          <option value="ADMIN">ADMIN (Quản trị)</option>
                        </select>
                      </td>
                      <td className="p-4 text-slate-700">
                        {u.location?.district ? `${u.location.district}, ${u.location.city}` : 'Toàn quốc'}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={u.status === 'ACTIVE' ? 'emerald' : 'rose'}
                          size="sm"
                        >
                          {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
