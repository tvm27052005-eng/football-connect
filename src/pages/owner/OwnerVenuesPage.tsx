import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  MapPin,
  Star,
  Edit,
  Trash2,
  CheckCircle2,
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2,
  Link2,
  LocateFixed
} from 'lucide-react';
import { api } from '../../services/api.js';
import { uploadApi } from '../../services/upload.api.js';
import { IVenue } from '../../types/index.js';
import { OwnerSidebar } from '../../components/layout/OwnerSidebar.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { VenueLocationPicker } from '../../components/common/VenueLocationPicker.js';

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
    images: [] as string[]
  });

  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [isFindingLocation, setIsFindingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
    'Hà Nội': { latitude: 21.0285, longitude: 105.8542 },
    'TP. Hồ Chí Minh': { latitude: 10.8231, longitude: 106.6297 },
    'Đà Nẵng': { latitude: 16.0544, longitude: 108.2022 }
  };

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
      images: []
    });
    setUrlInput('');
    setUploadError('');
    setLocationError('');
    setLocation(null);
    setIsLocationConfirmed(false);
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
      images: Array.isArray(v.images) ? [...v.images] : []
    });
    setUrlInput('');
    setUploadError('');
    setLocationError('');
    setLocation(
      Number.isFinite(v.latitude) && Number.isFinite(v.longitude)
        ? { latitude: v.latitude, longitude: v.longitude }
        : null
    );
    setIsLocationConfirmed(Number.isFinite(v.latitude) && Number.isFinite(v.longitude));
    setShowModal(true);
  };

  const findVenueLocation = async () => {
    if (!form.address.trim() || !form.district.trim() || !form.city.trim()) {
      setLocationError('Vui lòng nhập đầy đủ địa chỉ, quận/huyện và thành phố trước khi tìm vị trí.');
      return;
    }
    try {
      setIsFindingLocation(true);
      setLocationError('');
      setUploadError('');
      const response = await api.get('/venues/geocode', {
        params: {
          address: form.address.trim(),
          district: form.district.trim(),
          city: form.city.trim()
        },
        timeout: 20000
      });
      const { latitude, longitude } = response.data.data;
      if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
        throw new Error('Dịch vụ bản đồ chưa trả về tọa độ hợp lệ.');
      }
      setLocation({ latitude, longitude });
      setIsLocationConfirmed(false);
    } catch (error: unknown) {
      const fallback = cityCoordinates[form.city];
      if (fallback) {
        setLocation(fallback);
        setIsLocationConfirmed(false);
        setLocationError('Chưa tìm được đúng số nhà. Bản đồ đã mở theo khu vực thành phố; hãy kéo ghim đến sân rồi xác nhận.');
      } else {
        setLocationError(
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không thể tìm vị trí. Vui lòng kiểm tra lại địa chỉ và thử lại.'
        );
      }
    } finally {
      setIsFindingLocation(false);
    }
  };

  const handleMapLocationChange = (latitude: number, longitude: number) => {
    setLocation({ latitude, longitude });
    setIsLocationConfirmed(false);
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    setUploadError('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setUploadError('Chỉ hỗ trợ các tệp định dạng hình ảnh (PNG, JPG, WEBP, JPEG)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`Ảnh "${file.name}" vượt quá kích thước cho phép (tối đa 5MB)`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      setIsUploading(true);
      const uploadedUrls = await uploadApi.uploadMultiple(validFiles, 'football-connect/venues');
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    } catch (err: unknown) {
      console.error('Lỗi khi tải ảnh lên:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể tải ảnh lên máy chủ. Vui lòng thử lại.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('/uploads/')
    ) {
      setUploadError('Vui lòng nhập đường dẫn URL hợp lệ (bắt đầu bằng http:// hoặc https://)');
      return;
    }
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, trimmed]
    }));
    setUrlInput('');
    setUploadError('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    setForm((prev) => {
      const target = prev.images[indexToPrimary];
      const others = prev.images.filter((_, idx) => idx !== indexToPrimary);
      return {
        ...prev,
        images: [target, ...others]
      };
    });
  };

  const handleDeleteVenue = async (venueId: string, venueName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cụm sân "${venueName}"? Toàn bộ sân con thuộc cụm cũng sẽ bị ảnh hưởng.`)) {
      return;
    }
    try {
      await api.delete(`/venues/${venueId}`);
      setVenues((prev) => prev.filter((v) => v.id !== venueId));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Lỗi khi xóa cụm sân';
      alert(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const finalImages =
        form.images.length > 0
          ? form.images
          : ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'];

      if (!location || !isLocationConfirmed) {
        throw new Error('Vui lòng tìm và xác nhận vị trí trên bản đồ trước khi lưu cụm sân.');
      }
      const payload = {
        name: form.name,
        address: form.address,
        city: form.city,
        district: form.district,
        openTime: form.openTime,
        closeTime: form.closeTime,
        description: form.description,
        amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean),
        images: finalImages,
        latitude: location.latitude,
        longitude: location.longitude
      };

      if (editingVenue) {
        await api.put(`/venues/${editingVenue.id}`, payload);
      } else {
        await api.post('/venues', payload);
      }

      setShowModal(false);
      fetchOwnerVenues();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message :
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Lỗi khi lưu thông tin cụm sân';
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
              Thêm mới cụm sân bóng, tải ảnh thực tế, cập nhật tiện ích và giờ mở cửa để tiếp đón cầu thủ.
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
                      src={v.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600'}
                      alt={v.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold">
                      <ImageIcon className="w-3 h-3 text-emerald-400" />
                      <span>{v.images?.length || 1} ảnh</span>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-amber-600 border border-slate-200 text-xs font-bold shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {v.rating.toFixed(1)}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base text-slate-900">{v.name}</h3>
                    <Badge
                      variant={v.status === 'ACTIVE' ? 'emerald' : v.status === 'PENDING_APPROVAL' ? 'amber' : 'rose'}
                      size="sm"
                    >
                      {v.status === 'ACTIVE' ? 'Đã được duyệt' : v.status === 'PENDING_APPROVAL' ? 'Chờ admin duyệt' : 'Chưa được phép hoạt động'}
                    </Badge>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {v.address}, {v.district}, {v.city}
                      </span>
                    </p>

                    <div className="text-xs text-slate-600">
                      Giờ hoạt động:{' '}
                      <strong className="text-emerald-700 font-bold">
                        {v.openTime} - {v.closeTime}
                      </strong>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {v.amenities.slice(0, 3).map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200"
                        >
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
                  <button
                    onClick={() => handleDeleteVenue(v.id, v.name)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    title="Xóa cụm sân"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
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
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[78vh] overflow-y-auto pr-1">
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
                  onChange={(e) => {
                    setForm({ ...form, city: e.target.value });
                    setIsLocationConfirmed(false);
                  }}
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
                  onChange={(e) => {
                    setForm({ ...form, district: e.target.value });
                    setIsLocationConfirmed(false);
                  }}
                  placeholder="VD: Cầu Giấy"
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
                onChange={(e) => {
                  setForm({ ...form, address: e.target.value });
                  setIsLocationConfirmed(false);
                }}
                placeholder="Số 88 Lê Đức Thọ, Mỹ Đình"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <label className="block text-slate-800 font-bold">Xác nhận vị trí trên bản đồ *</label>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Tìm theo địa chỉ rồi kéo ghim đến đúng lối vào sân nếu cần.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={findVenueLocation}
                  disabled={isFindingLocation}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold"
                >
                  {isFindingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                  {isFindingLocation ? 'Đang tìm...' : 'Tìm vị trí'}
                </button>
              </div>
              {locationError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px]">
                  {locationError}
                </div>
              )}
              {location && (
                <>
                  <VenueLocationPicker
                    latitude={location.latitude}
                    longitude={location.longitude}
                    onChange={handleMapLocationChange}
                  />
                  <button
                    type="button"
                    onClick={() => setIsLocationConfirmed(true)}
                    className={`w-full py-2 rounded-lg text-xs font-bold border ${
                      isLocationConfirmed
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {isLocationConfirmed ? 'Đã xác nhận vị trí' : 'Xác nhận vị trí này'}
                  </button>
                </>
              )}
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
                placeholder="Bãi đỗ xe ô tô, Đèn chiếu sáng LED, Phòng thay đồ..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Mô tả cụm sân</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Giới thiệu về vị trí sân, chất lượng cỏ, dịch vụ phụ trợ..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            {/* Khu vực Tải & Quản lý Hình Ảnh Cụm Sân */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-slate-800 font-bold text-xs">
                    Hình ảnh cụm sân ({form.images.length} ảnh)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Thêm ảnh để người đặt sân chiêm ngưỡng mặt cỏ, không gian và cơ sở vật chất. Ảnh đầu tiên sẽ làm ảnh bìa chính.
                  </p>
                </div>
              </div>

              {/* Upload Dropzone / Button */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                  isUploading
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files);
                    }
                  }}
                />

                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-2 text-emerald-600 gap-2">
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <span className="font-semibold text-xs">Đang tải và tối ưu hóa hình ảnh lên máy chủ...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                      >
                        Bấm vào đây để chọn ảnh từ máy tính
                      </button>
                      <span className="text-slate-500"> hoặc kéo thả ảnh vào khu vực này</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Hỗ trợ JPG, PNG, WEBP tối đa 5MB mỗi ảnh. Có thể chọn nhiều ảnh cùng lúc.
                    </p>
                  </div>
                )}
              </div>

              {/* Tùy chọn thêm bằng URL */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Link2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Hoặc dán link ảnh (URL) vào đây..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] cursor-pointer transition-colors shrink-0"
                >
                  Thêm URL
                </button>
              </div>

              {/* Thông báo lỗi upload nếu có */}
              {uploadError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px]">
                  {uploadError}
                </div>
              )}

              {/* Danh sách ảnh đã chọn */}
              {form.images.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Danh sách ảnh đã thêm ({form.images.length})</span>
                    <span className="italic text-[10px] text-slate-400">Click &ldquo;Đặt làm bìa&rdquo; để đổi ảnh đại diện</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1.5 bg-slate-50/50 rounded-xl border border-slate-200">
                    {form.images.map((imgUrl, index) => (
                      <div
                        key={index}
                        className={`group relative rounded-lg overflow-hidden border bg-white aspect-4/3 flex items-center justify-center transition-all ${
                          index === 0
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Sân bóng ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600';
                          }}
                        />

                        {/* Badge ảnh đại diện */}
                        {index === 0 ? (
                          <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-white" /> Ảnh bìa
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-emerald-600 text-white text-[9px] font-medium px-1.5 py-0.5 rounded backdrop-blur-xs transition-all cursor-pointer flex items-center gap-1"
                            title="Đặt ảnh này làm ảnh bìa chính"
                          >
                            <Star className="w-2.5 h-2.5" /> Đặt làm bìa
                          </button>
                        )}

                        {/* Nút xóa ảnh */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title="Xóa ảnh này"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/40 text-[9px] text-white">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-800 text-[11px] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Chưa có ảnh nào được tải lên. Nếu để trống, hệ thống sẽ tự dùng ảnh sân cỏ mẫu tiêu chuẩn.</span>
                </div>
              )}
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
                disabled={isSubmitting || isUploading}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  'Lưu Thông Tin Cụm Sân'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};
