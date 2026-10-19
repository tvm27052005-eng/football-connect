import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { api } from '../../services/api.js';
import { IUser } from '../../types/index.js';
import { AdminSidebar } from '../../components/layout/AdminSidebar.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton.js';

const ROLE_CONFIG = {
  USER: { label: 'Cầu thủ', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  OWNER: { label: 'Chủ sân', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  ADMIN: { label: 'Quản trị', className: 'bg-red-100 text-red-800 border-red-200' }
} as const;

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchName = u.name.toLowerCase().includes(q);
    const matchEmail = u.email.toLowerCase().includes(q);
    return matchName || matchEmail;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quản lý người dùng
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Theo dõi danh sách tài khoản và trạng thái hoạt động của người dùng.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
            />
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
                  {filteredUsers.map((u) => {
                    const roleConfig = ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.USER;

                    return (
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
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${roleConfig.className}`}
                          >
                            {roleConfig.label}
                          </span>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
