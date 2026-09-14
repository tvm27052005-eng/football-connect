import React, { useState, useEffect } from 'react';
import { Plus, Grid3X3, DollarSign, Edit, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api.js';
import { IField, IVenue } from '../../types/index.js';
import { OwnerSidebar } from '../../components/layout/OwnerSidebar.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';

export const OwnerFieldsPage: React.FC = () => {
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [fields, setFields] = useState<IField[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<IField | null>(null);

  const [form, setForm] = useState({
    name: '',
    fieldType: '7_vs_7',
    pricePerHour: 350000,
    surfaceType: 'ARTIFICIAL_TURF',
    hasLighting: true,
    hasRoof: false,
    status: 'ACTIVE'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVenues = async () => {
    try {
      const res = await api.get('/venues/owner/my-venues');
      setVenues(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedVenueId(res.data.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFields = async () => {
    if (!selectedVenueId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/fields?venueId=${selectedVenueId}`);
      setFields(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    fetchFields();
  }, [selectedVenueId]);

  const handleOpenCreate = () => {
    setEditingField(null);
    setForm({
      name: '',
      fieldType: '7_vs_7',
      pricePerHour: 350000,
      surfaceType: 'ARTIFICIAL_TURF',
      hasLighting: true,
      hasRoof: false,
      status: 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (f: IField) => {
    setEditingField(f);
    setForm({
      name: f.name,
      fieldType: f.fieldType,
      pricePerHour: f.pricePerHour,
      surfaceType: f.surfaceType,
      hasLighting: f.hasLighting,
      hasRoof: f.hasRoof,
      status: f.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenueId) return;

    try {
      setIsSubmitting(true);
      if (editingField) {
        await api.put(`/fields/${editingField.id}`, form);
      } else {
        await api.post('/fields', {
          ...form,
          venueId: selectedVenueId
        });
      }
      setShowModal(false);
      fetchFields();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi lưu sân con';
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
              Quản Lý Sân Con & Bảng Giá Khai Thác
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phân loại cấu hình sân 5, sân 7, sân 11, thiết lập đơn giá mỗi giờ và bảo trì định kỳ.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm Sân Con Mới
          </button>
        </div>

        {/* Venue Filter Picker */}
        <div className="flex items-center gap-3 bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs">
          <label className="text-xs font-bold text-slate-700">Đang quản lý cụm sân:</label>
          <select
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-semibold"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.district})
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} type="row" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-slate-900">{f.name}</h3>
                    <Badge
                      variant={f.status === 'ACTIVE' ? 'emerald' : f.status === 'MAINTENANCE' ? 'amber' : 'slate'}
                      size="sm"
                    >
                      {f.status === 'ACTIVE' ? 'Sẵn sàng phục vụ' : f.status === 'MAINTENANCE' ? 'Đang bảo trì cỏ' : 'Tạm dừng'}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Quy mô:</span>
                      <strong className="text-slate-900">
                        {f.fieldType === '5_vs_5' ? 'Sân 5 người' : f.fieldType === '7_vs_7' ? 'Sân 7 người' : 'Sân 11 người'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Đơn giá giờ:</span>
                      <strong className="text-emerald-700 font-bold">{f.pricePerHour.toLocaleString('vi-VN')} đ/h</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Mặt cỏ:</span>
                      <span className="text-slate-700">Cỏ nhân tạo đạt chuẩn</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Đèn cao áp / Mái che:</span>
                      <span className="text-slate-700">
                        {f.hasLighting ? '💡 Có đèn' : 'Không'} • {f.hasRoof ? '🏠 Có mái' : 'Sân trời'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(f)}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-600" /> Sửa cấu hình
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingField ? 'Sửa Cấu Hình Sân Con' : 'Thêm Sân Con Mới'}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tên Sân Con *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Sân 7A - Gần Khán Đài"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Loại sân</label>
                <select
                  value={form.fieldType}
                  onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
                >
                  <option value="5_vs_5">Sân 5 người</option>
                  <option value="7_vs_7">Sân 7 người</option>
                  <option value="11_vs_11">Sân 11 người</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Giá thuê 1 Giờ (VNĐ)</label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={form.pricePerHour}
                  onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Trạng thái vận hành</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
              >
                <option value="ACTIVE">Hoạt động bình thường (ACTIVE)</option>
                <option value="MAINTENANCE">Đang bảo trì mặt cỏ (MAINTENANCE)</option>
                <option value="INACTIVE">Tạm dừng tiếp khách (INACTIVE)</option>
              </select>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={form.hasLighting}
                  onChange={(e) => setForm({ ...form, hasLighting: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                />
                <span>Có dàn đèn chiếu sáng</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={form.hasRoof}
                  onChange={(e) => setForm({ ...form, hasRoof: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                />
                <span>Có mái che</span>
              </label>
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
                {isSubmitting ? 'Đang lưu...' : 'Lưu Sân Con'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};
