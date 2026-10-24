import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Trophy, Shield, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store.js';
import { api } from '../services/api.js';
import { OwnerSidebar } from '../components/layout/OwnerSidebar.js';
import { AdminSidebar } from '../components/layout/AdminSidebar.js';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.location?.city || 'Hà Nội',
    district: user?.location?.district || 'Cầu Giấy',
    skillLevel: user?.skillLevel || 'INTERMEDIATE',
    preferredFieldType: user?.preferredFieldType || '7_vs_7',
    preferredPosition: user?.preferredPosition || 'Tiền vệ (MF)',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const isPortalProfile = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const profileDescription = user?.role === 'OWNER'
    ? 'Cập nhật thông tin đại diện và khu vực hoạt động của cụm sân.'
    : user?.role === 'ADMIN'
      ? 'Cập nhật thông tin tài khoản quản trị hệ thống.'
      : 'Cập nhật kỹ năng, vị trí thi đấu và khu vực để nhận gợi ý ghép kèo chuẩn xác nhất.';

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.location?.city || 'Hà Nội',
        district: user.location?.district || 'Cầu Giấy',
        skillLevel: user.skillLevel || 'INTERMEDIATE',
        preferredFieldType: user.preferredFieldType || '7_vs_7',
        preferredPosition: user.preferredPosition || 'Tiền vệ (MF)',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.put('/users/profile', {
        name: formData.name,
        phone: formData.phone,
        location: {
          city: formData.city,
          district: formData.district
        },
        skillLevel: formData.skillLevel,
        preferredFieldType: formData.preferredFieldType,
        preferredPosition: formData.preferredPosition,
        bio: formData.bio,
        avatar: formData.avatar
      });

      updateUser(res.data.data);
      setSuccessMsg('Cập nhật hồ sơ thành công!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể cập nhật hồ sơ';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={isPortalProfile ? 'flex min-h-[calc(100vh-4rem)] flex-col md:flex-row' : ''}>
      {user?.role === 'OWNER' && <OwnerSidebar />}
      {user?.role === 'ADMIN' && <AdminSidebar />}
      <div className={`w-full max-w-4xl px-4 py-8 sm:px-6 ${isPortalProfile ? 'flex-1 lg:mx-8' : 'mx-auto'} space-y-8`}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Hồ Sơ & Cài Đặt
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {profileDescription}
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* User Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
          <img
            src={formData.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user?.id}
            alt={formData.name}
            className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-emerald-500/30 object-cover shadow-xs"
          />
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500">{user?.email}</p>
            <span className="inline-block px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
              Vai trò: {user?.role}
            </span>
          </div>
        </div>

        {/* Basic Info */}
       
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" /> Thông Tin Cơ Bản
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Họ và tên</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Thành phố sinh sống</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Quận / Huyện</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
              />
            </div>
          </div>
        </div>
        

        {/* Football Specs */}
         {user?.role === 'USER' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-600" /> Kỹ Năng & Sở Thích Bóng Đá
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Trình độ kỹ năng</label>
              <select
                value={formData.skillLevel}
                onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
              >
                <option value="BEGINNER">Tập sự / Mới tập</option>
                <option value="INTERMEDIATE">Trung bình / Khá</option>
                <option value="ADVANCED">Nâng cao / Chuyên nghiệp</option>
                <option value="PRO">Bán chuyên / Chuyên</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Loại sân ưa thích</label>
              <select
                value={formData.preferredFieldType}
                onChange={(e) => setFormData({ ...formData, preferredFieldType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
              >
                <option value="5_vs_5">Sân 5 người</option>
                <option value="7_vs_7">Sân 7 người</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Vị trí sở trường</label>
              <select
                value={formData.preferredPosition}
                onChange={(e) => setFormData({ ...formData, preferredPosition: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
              >
                <option value="Tiền đạo (ST/FW)">Tiền đạo (ST/FW)</option>
                <option value="Tiền vệ (MF)">Tiền vệ (MF)</option>
                <option value="Hậu vệ (DF/CB)">Hậu vệ (DF/CB)</option>
                <option value="Thủ môn (GK)">Thủ môn (GK)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Tiểu sử / Phong cách đá</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Chia sẻ về lối đá, thể lực hoặc đội bóng yêu thích..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
         )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi Hồ Sơ'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
