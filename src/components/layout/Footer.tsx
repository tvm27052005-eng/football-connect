import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, Heart, Zap, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1 - Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/football-connect-logo.png"
                alt="Football Connect"
                className="w-12 h-12 rounded-xl object-cover shadow-md shadow-emerald-500/20"
              />
              <span className="font-black text-xl text-white tracking-tight">
                FOOTBALL <span className="text-emerald-500">CONNECT</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống công nghệ quản lý sân bóng đá và kết nối ghép đối trực tuyến hàng đầu Việt Nam. Giải quyết triệt để vấn đề tìm sân, chống trùng lịch và thúc đẩy văn hóa bóng đá phong trào lành mạnh.
            </p>
          </div>

          {/* Col 2 - For Players */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5"> Dành Cho Cầu Thủ
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/venues" className="hover:text-emerald-400 transition-colors">
                  Tìm sân cỏ nhân tạo gần bạn
                </Link>
              </li>
              <li>
                <Link to="/matches" className="hover:text-emerald-400 transition-colors">
                  Cáp kèo đá giao lưu & tìm đối thủ
                </Link>
              </li>
              <li>
                <Link to="/booking/create" className="hover:text-emerald-400 transition-colors">
                  Đặt lịch sân trực tuyến 24/7
                </Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-emerald-400 transition-colors">
                  Phòng chat & thảo luận đội bóng
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 - For Owners */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5"> Dành Cho Chủ Sân
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/owner/dashboard" className="hover:text-amber-400 transition-colors">
                  Phần mềm quản lý cụm sân bóng
                </Link>
              </li>
              <li>
                <Link to="/owner/venues" className="hover:text-amber-400 transition-colors">
                  Cài đặt bảng giá & sân con theo giờ
                </Link>
              </li>
              <li>
                <Link to="/owner/bookings" className="hover:text-amber-400 transition-colors">
                  Theo dõi đơn đặt & doanh thu ngày
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-purple-400 transition-colors">
                  Cổng quản trị hệ thống (Admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 - Contact & Support */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Hỗ Trợ & Liên Hệ
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300 font-semibold">
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span>Hotline: 1900 6868 (8:00 - 23:00)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300 font-semibold">
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>hotro@footballconnect.vn</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-300 font-medium">
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span>Khu Công nghệ Cầu Giấy, Hà Nội & Quận 1, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>©Football Connect - Nền tảng công nghệ thể thao hàng đầu thế giới.</p>
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <span>Được phát triển với niềm đam mê cho bóng đá Việt Nam</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
