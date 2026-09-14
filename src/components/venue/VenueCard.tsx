import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { IVenue } from '../../types/index.js';
import { Badge } from '../common/Badge.js';

interface VenueCardProps {
  venue: IVenue;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {
  return (
    <div className="group bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col shadow-xs">
      {/* Image & Badges Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
        <img
          src={venue.images[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600'}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant="emerald" size="sm" className="backdrop-blur-md bg-white/90 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
            {venue.status === 'ACTIVE' ? 'Đang mở cửa' : 'Tạm đóng'}
          </Badge>
        </div>

        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-amber-200 text-amber-800 text-xs font-bold shadow-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{venue.rating.toFixed(1)}</span>
            <span className="text-slate-500 font-normal text-[10px]">({venue.reviewCount})</span>
          </div>
        </div>

        {/* Bottom overlay text */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-medium drop-shadow-xs">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span>{venue.openTime} - {venue.closeTime}</span>
          </div>
          <span className="text-emerald-300 font-bold">
            {venue.totalFields || 4} sân bóng
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {venue.name}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{venue.address}, {venue.district}, {venue.city}</span>
          </p>

          {/* Amenities & Field Types */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {venue.availableFieldTypes?.map((ft) => (
              <span
                key={ft}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                {ft === '5_vs_5' ? 'Sân 5' : ft === '7_vs_7' ? 'Sân 7' : 'Sân 11'}
              </span>
            ))}
            {venue.amenities.slice(0, 2).map((a, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Footer info & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Giá thuê từ</span>
            <span className="text-sm font-extrabold text-emerald-700">
              {venue.priceRange.min.toLocaleString('vi-VN')} đ
              <span className="text-xs font-normal text-slate-400"> /h</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/venues/${venue.id}`}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors"
            >
              Chi tiết
            </Link>
            <Link
              to={`/booking/create?venueId=${venue.id}`}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center gap-1"
            >
              Đặt ngay <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
