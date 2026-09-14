import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Star, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { IVenue } from '../../types/index.js';
import { OwnerSidebar } from '../../components/layout/OwnerSidebar.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';

export const OwnerVenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<IVenue | null>(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    openTime: '06:00',
    closeTime: '23:00',
    description: '',
    amenities: 'Bãi đỗ xe ô tô, Đèn chiếu sáng LED, Phòng thay đồ, Căng tin nước',
    images: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOwnerVenues = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/venues/owner/my-venues');
      setVenues(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerVenues();
  }, []);

  const handleOpenCreate = () => {
    setEditingVenue(null);
    setForm({
      name: '',
      address: '',
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      openTime: '06:00',
      closeTime: '23:00',
      description: '',
      amenities: 'Bãi đỗ xe ô tô, Đèn chiếu sáng LED, Phòng thay đồ, Căng tin nước',
      images: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v: IVenue) => {
    setEditingVenue(v);
    setForm({
      name: v.name,
      address: v.address,
      city: v.city,
      district: v.district,
      openTime: v.openTime,
      closeTime: v.closeTime,
      description: v.description,
      amenities: v.amenities.join(', '),
      images: v.images.join(', ')
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        name: form.name,
        address: form.address,
        city: form.city,
        district: form.district,
        openTime: form.openTime,
        closeTime: form.closeTime,
        description: form.description,
        amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean),
        images: form.images.split(',').map((s) => s.trim()).filter(Boolean)
      };

      if (editingVenue) {
        await api.put(`/venues/${editingVenue.id}`, payload);
      } else {
        await api.post('/venues', payload);
      }

      setShowModal(false);
      fetchOwnerVenues();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi lưu thông tin cụm sân';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <OwnerSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Cụm Sân Bóng Trực Thuộc
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Thêm mới cụm sân bóng, cập nhật tiện ích và giờ mở cửa để tiếp đón cầu thủ.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm Cụm Sân Mới
          </button>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="relative h-44 bg-slate-100 border-b border-slate-100">
                    <img
                      src={v.images[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600'}
                      alt={v.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-amber-600 border border-slate-200 text-xs font-bold shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {v.rating.toFixed(1)}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base text-slate-900">{v.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{v.address}, {v.district}, {v.city}</span>
                    </p>

                    <div className="text-xs text-slate-600">
                      Giờ hoạt động: <strong className="text-emerald-700 font-bold">{v.openTime} - {v.closeTime}</strong>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {v.amenities.slice(0, 3).map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/75 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-600" /> Chỉnh sửa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingVenue ? 'Chỉnh Sửa Cụm Sân' : 'Thêm Cụm Sân Bóng Mới'}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tên Cụm Sân *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Cụm Sân Bóng Cỏ Nhân Tạo V-Sport"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Thành phố</label>
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quận / Huyện *</label>
                <input
                  type="text"
                  required
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Địa chỉ chi tiết *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Số 88 Lê Đức Thọ, Mỹ Đình"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Giờ mở cửa</label>
                <input
                  type="text"
                  value={form.openTime}
                  onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                  placeholder="06:00"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Giờ đóng cửa</label>
                <input
                  type="text"
                  value={form.closeTime}
                  onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                  placeholder="23:00"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Tiện ích (cách nhau bởi dấu phẩy)</label>
              <input
                type="text"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Mô tả sân</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu Thông Tin Cụm Sân'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};
