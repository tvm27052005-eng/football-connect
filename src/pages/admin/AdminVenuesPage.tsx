import React, { useState, useEffect } from 'react';
import { Building, MapPin, Star, Search } from 'lucide-react';
import { api } from '../../services/api.js';
import { IVenue } from '../../types/index.js';
import { AdminSidebar } from '../../components/layout/AdminSidebar.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton.js';

export const AdminVenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllVenues = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/venues/admin/all');
      setVenues(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      setVenues([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVenues();
  }, []);

  const handleUpdateStatus = async (venueId: string, status: 'APPROVED' | 'PENDING' | 'REJECTED') => {
    try {
      await api.put(`/venues/admin/${venueId}/status`, { status });
      fetchAllVenues();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi cập nhật kiểm duyệt';
      alert(msg);
    }
  };

  const filteredVenues = venues.filter((v) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchOwner = (v.ownerName || '').toLowerCase().includes(q);
      const matchAddress = v.address.toLowerCase().includes(q);
      if (!matchName && !matchOwner && !matchAddress) return false;
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
              Kiểm Duyệt & Giám Sát Cụm Sân Bóng
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phê duyệt hồ sơ cụm sân mới đăng ký hoặc tạm đình chỉ các cơ sở vi phạm tiêu chuẩn. Chỉ khi đã kiểm duyệt xong mới hoạt động.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên cụm sân, chủ sở hữu, địa chỉ..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
          />
        </div>

        {isLoading ? (
          <LoadingSkeleton count={4} type="row" />
        ) : filteredVenues.length === 0 ? (
          <EmptyState
            title="Không tìm thấy cụm sân nào"
            description="Chưa có sân bóng nào khớp với từ khóa tìm kiếm của bạn."
            icon={Building}
          />
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold">Cụm Sân</th>
                    <th className="p-4 font-bold">Chủ Cơ Sở</th>
                    <th className="p-4 font-bold">Khu Vực</th>
                    <th className="p-4 font-bold">Đánh Giá</th>
                    <th className="p-4 font-bold">Trạng Thái</th>
                    <th className="p-4 font-bold text-right">Phê Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredVenues.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.images[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=100'}
                            alt={v.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{v.name}</div>
                            <div className="text-[11px] text-slate-500">{v.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{v.ownerName || 'Chủ sân'}</div>
                        <div className="text-[10px] text-slate-500">{v.ownerPhone}</div>
                      </td>
                      <td className="p-4 text-slate-700">
                        {v.district}, {v.city}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {v.rating.toFixed(1)}
                          <span className="text-[10px] text-slate-400">({v.totalReviews || v.reviewCount || 0})</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={v.status === 'ACTIVE' ? 'emerald' : v.status === 'PENDING_APPROVAL' ? 'amber' : 'rose'}
                          size="sm"
                        >
                          {v.status === 'ACTIVE' ? 'Đã duyệt' : v.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' : 'Từ chối'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {v.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleUpdateStatus(v.id, 'APPROVED')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold transition-all cursor-pointer"
                            >
                              Duyệt sân
                            </button>
                          )}
                          {v.status !== 'CLOSED' && (
                            <button
                              onClick={() => handleUpdateStatus(v.id, 'REJECTED')}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold transition-all cursor-pointer"
                            >
                              Từ chối
                            </button>
                          )}
                        </div>
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
