import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, ArrowRight, Images, Trophy } from 'lucide-react';
import { IVenue } from '../../types/index.js';
import { Badge } from '../common/Badge.js';

interface VenueCardProps {
  venue: IVenue;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {
  const venueImages = venue.images.filter(Boolean);
  const primaryImage = venueImages[0] || '/images/turf-pitch.png';
  const supportingImages = venueImages.slice(1, 3);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-950/10">
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-400" />
      {/* Image & Badges Container */}
      <div className={`relative h-56 w-full overflow-hidden bg-slate-950 ${supportingImages.length ? 'grid grid-cols-[minmax(0,2fr)_minmax(88px,1fr)] gap-1' : ''}`}>
        <div className="relative min-w-0 overflow-hidden">
          <img
            src={primaryImage}
            alt={`Ảnh chính ${venue.name} do chủ sân cung cấp`}
            onError={(event) => { event.currentTarget.src = '/images/turf-pitch.png'; }}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
        {supportingImages.length > 0 && (
          <div className={`grid min-w-0 gap-1 ${supportingImages.length > 1 ? 'grid-rows-2' : 'grid-rows-1'}`}>
            {supportingImages.map((image, index) => (
              <div key={image} className="relative min-h-0 overflow-hidden">
                <img
                  src={image}
                  alt={`Không gian ${venue.name} ${index + 2}`}
                  loading="lazy"
                  onError={(event) => { event.currentTarget.src = '/images/turf-pitch.png'; }}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {index === supportingImages.length - 1 && venueImages.length > 3 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-950/65 text-xs font-black text-white backdrop-blur-[1px]">
                    +{venueImages.length - 3} ảnh
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <Badge variant="emerald" size="sm" className="bg-slate-950/75 font-bold text-emerald-300 shadow-xs backdrop-blur-md">
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
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-2 text-xs font-semibold text-white">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[11px]">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{venue.openTime} - {venue.closeTime}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <Images className="h-3 w-3 text-lime-300" /> Ảnh từ chủ sân
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
            <Trophy className="h-3.5 w-3.5" /> Điểm hẹn sân cỏ
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
    </article>
  );
};
