import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { IVenue } from '../../types/index.js';
import { Badge } from '../common/Badge.js';

interface VenueCardProps {
  venue: IVenue;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {
  return (
    <div className="group bg-white border border-slate-200/90 hover:border-emerald-500/60 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col shadow-xs">
      {/* Image & Badges Container */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-100">
        <img
          src={venue.images[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600'}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <Badge variant="emerald" size="sm" className="backdrop-blur-md bg-white/95 text-emerald-800 font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            {venue.status === 'ACTIVE' ? 'Đang mở cửa' : 'Tạm bảo trì'}
          </Badge>
        </div>

        <div className="absolute top-3.5 right-3.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-amber-200/80 text-amber-900 text-xs font-black shadow-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{venue.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal text-[10px]">({venue.reviewCount})</span>
          </div>
        </div>

        {/* Bottom overlay text on image */}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-xs text-white font-semibold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[11px]">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{venue.openTime} - {venue.closeTime}</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/80 backdrop-blur-md text-[11px] font-extrabold text-white">
            {venue.totalFields || 4} sân cỏ
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Sân đạt chuẩn chất lượng
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {venue.name}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{venue.address}, {venue.district}, {venue.city}</span>
          </p>

          {/* Amenities & Field Types */}
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {venue.availableFieldTypes?.map((ft) => (
              <span
                key={ft}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
              >
                {ft === '5_vs_5' ? 'Sân 5' : 'Sân 7' }
              </span>
            ))}
            {venue.amenities.slice(0, 2).map((a, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80"
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Footer info & CTA */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Giá thuê chỉ từ</span>
            <div className="text-base sm:text-lg font-black text-emerald-700">
              {venue.priceRange.min.toLocaleString('vi-VN')} đ
              <span className="text-xs font-normal text-slate-400">/h</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/venues/${venue.id}`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/90 transition-colors"
            >
              Xem sân
            </Link>
            <Link
              to={`/booking/create?venueId=${venue.id}`}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-1 active:scale-95"
            >
              Đặt ngay <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
