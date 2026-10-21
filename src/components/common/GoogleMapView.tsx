import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Compass, Star, ChevronRight } from 'lucide-react';
import { IVenue } from '../../types/index.js';

interface GoogleMapViewProps {
  venues?: IVenue[];
  venue?: IVenue;
  latitude?: number;
  longitude?: number;
  address?: string;
  title?: string;
  height?: string;
  onSelectVenue?: (venue: IVenue) => void;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  venues = [],
  venue,
  latitude,
  longitude,
  address,
  title,
  height = 'h-80 sm:h-96',
  onSelectVenue
}) => {
  // Active venue selection if passing multiple venues
  const [activeVenueId, setActiveVenueId] = useState<string>(
    venue?.id || (venues.length > 0 ? venues[0].id : '')
  );

  const currentVenue = venue || venues.find((v) => v.id === activeVenueId) || venues[0];

  const currentLat = currentVenue?.latitude ?? latitude;
  const currentLng = currentVenue?.longitude ?? longitude;
  const currentAddress = currentVenue
    ? `${currentVenue.name}, ${currentVenue.address}, ${currentVenue.district}, ${currentVenue.city}`
    : address || 'Hà Nội';

  const hasCoordinates = Number.isFinite(currentLat) && Number.isFinite(currentLng);
  const mapEmbedUrl = hasCoordinates
    ? `https://www.google.com/maps?q=loc:${currentLat},${currentLng}&z=17&output=embed`
    : '';
  const directMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentAddress)}`;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs space-y-0">
      {/* Top Header Strip */}
      <div className="p-4 sm:px-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <MapPin className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{title || (currentVenue ? currentVenue.name : 'Vị Trí Bản Đồ Google Maps')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Google Maps Live
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 truncate max-w-md">
              {currentVenue ? `${currentVenue.address}, ${currentVenue.district}, ${currentVenue.city}` : currentAddress}
            </p>
          </div>
        </div>

        <a
          href={directMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" /> Dẫn Đường Qua Google Maps <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Multiple Venues Quick Selector Chips */}
      {venues.length > 1 && (
        <div className="p-3 bg-slate-100/90 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase text-slate-500 shrink-0 px-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-emerald-600" /> Cụm sân trên bản đồ:
          </span>
          {venues.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setActiveVenueId(v.id);
                if (onSelectVenue) onSelectVenue(v);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                v.id === currentVenue?.id
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>{v.name}</span>
              <span className={`text-[10px] px-1 py-0.2 rounded font-extrabold ${v.id === currentVenue?.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                ★ {v.rating.toFixed(1)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Map Container */}
      <div className={`relative w-full ${height} bg-slate-100`}>
        {hasCoordinates ? (
          <iframe
            title="Google Map Location"
            src={mapEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 text-center text-sm text-slate-500">
            Chưa có tọa độ được chủ sân xác nhận trên bản đồ.
          </div>
        )}

        {/* Selected Venue Floating Quick Info Card */}
        {currentVenue && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-2xl shadow-lg space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-snug">{currentVenue.name}</h4>
                <p className="text-[10px] text-slate-500 truncate max-w-[220px] mt-0.5">{currentVenue.address}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                <Star className="w-3 h-3 fill-amber-500" />
                <span>{currentVenue.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="font-extrabold text-emerald-700">
                {currentVenue.priceRange.min.toLocaleString('vi-VN')} đ/h
              </span>
              <a
                href={`/venues/${currentVenue.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                Đặt sân này <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
