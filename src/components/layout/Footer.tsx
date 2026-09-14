import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 text-sm mt-auto shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                FOOTBALL <span className="text-emerald-600">CONNECT</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hệ thống quản lý lịch sân bóng đá và nền tảng kết nối ghép đối trực tuyến hàng đầu Việt Nam. Giải quyết bài toán đặt sân nhanh, chống trùng lịch và ghép kèo văn minh.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Hệ thống bảo mật & chống double-booking 100%
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Dành cho Cầu thủ</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/venues" className="hover:text-emerald-700 transition-colors">
                  Tìm sân cỏ nhân tạo gần đây
                </Link>
              </li>
              <li>
                <Link to="/matches" className="hover:text-emerald-700 transition-colors">
                  Ghép đối & Tìm đồng đội
                </Link>
              </li>
              <li>
                <Link to="/booking/create" className="hover:text-emerald-700 transition-colors">
                  Đặt sân trực tuyến 24/7
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Dành cho Chủ sân</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/owner/dashboard" className="hover:text-amber-700 transition-colors">
                  Phần mềm Quản lý Cụm sân
                </Link>
              </li>
              <li>
                <Link to="/owner/venues" className="hover:text-amber-700 transition-colors">
                  Quản lý bảng giá & Sân con
                </Link>
              </li>
              <li>
                <Link to="/owner/bookings" className="hover:text-amber-700 transition-colors">
                  Lịch đặt & Giữ chỗ chống trùng
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-purple-700 transition-colors">
                  Bảng Quản trị viên (Admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Liên hệ & Hỗ trợ</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hotline: 1900 6868 (8:00 - 22:00)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>support@footballconnect.vn</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tòa nhà TechHub, Cầu Giấy, Hà Nội & Quận 1, TP. HCM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2025 Football Connect Vietnam. Nền tảng thể thao công nghệ cao.</p>
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <span>Xây dựng với</span> <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> <span>cho cộng đồng bóng đá phong trào</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
