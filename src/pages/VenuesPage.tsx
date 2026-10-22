import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { IVenue } from '../types/index.js';
import { VenueCard } from '../components/venue/VenueCard.js';
import { VenueFilter } from '../components/venue/VenueFilter.js';
import { LoadingSkeleton, EmptyState, Pagination } from '../components/common/LoadingSkeleton.js';
import { GoogleMapView } from '../components/common/GoogleMapView.js';
import { MapPin, LayoutGrid, Map, Images, Search, Trophy } from 'lucide-react';

export const VenuesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'GRID' | 'MAP'>('GRID');

  // Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [fieldType, setFieldType] = useState(searchParams.get('fieldType') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (city) params.append('city', city);
      if (fieldType) params.append('fieldType', fieldType);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await api.get(`/venues?${params.toString()}`);
      setVenues(res.data.data);
    } catch (e) {
      console.error('Failed to load venues:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, fieldType, sortBy]);

  const handleSearchSubmit = () => {
    fetchVenues();
  };

  const handleReset = () => {
    setSearchQuery('');
    setCity('');
    setFieldType('');
    setSortBy('rating_desc');
    setSearchParams({});
  };

  // Pagination slicing
  const totalPages = Math.ceil(venues.length / itemsPerPage);
  const displayedVenues = venues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const venuePreviewImages = venues.flatMap((venue) => venue.images.filter(Boolean)).slice(0, 3);
  const coverImage = venuePreviewImages[0] || '/images/turf-pitch-top.png';
  const supportingPreviewImages = [
    venuePreviewImages[1] || '/images/turf-pitch.png',
    venuePreviewImages[2] || '/images/stadium-7.png'
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Sports editorial header using images managed by venue owners */}
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-900/40 bg-[#07160f] text-white shadow-2xl shadow-emerald-950/15">
        <div className="absolute inset-0">
          <img
            src={coverImage}
            alt=""
            aria-hidden="true"
            onError={(event) => { event.currentTarget.src = '/images/turf-pitch-top.png'; }}
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06120c] via-[#07160f]/95 to-emerald-950/70" />
          <div className="absolute -right-24 top-0 h-full w-1/2 -skew-x-12 border-l border-lime-400/20 bg-emerald-500/5" />
        </div>

        <div className="relative z-10 grid items-stretch gap-8 p-6 sm:p-9 lg:grid-cols-12 lg:p-12">
          <div className="flex flex-col justify-center lg:col-span-7">
            <div className="mb-4 inline-flex w-fit items-center gap-2 border-l-4 border-lime-400 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-lime-300 backdrop-blur-md">
              <Trophy className="h-3.5 w-3.5" /> Hệ thống sân bóng Football Connect
            </div>
            <h1 className="max-w-2xl text-3xl font-black uppercase italic leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Chọn sân chuẩn.
              <span className="mt-2 block text-lime-400">Sẵn sàng bóng lăn.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Khám phá hình ảnh thực tế do chủ sân cung cấp, so sánh khu vực, loại sân, mức giá và chọn khung giờ phù hợp với đội của bạn.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2">
                <Search className="h-3.5 w-3.5 text-lime-300" /> Bộ lọc nhanh
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2">
                <Map className="h-3.5 w-3.5 text-lime-300" /> Xem trên bản đồ
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2">
                <Images className="h-3.5 w-3.5 text-lime-300" /> Ảnh từ chủ sân
              </span>
            </div>
          </div>

          <div className="hidden min-h-72 grid-cols-5 grid-rows-2 gap-2 lg:col-span-5 lg:grid">
            <figure className="relative col-span-3 row-span-2 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <img src={coverImage} alt="Ảnh sân nổi bật do chủ sân cung cấp" onError={(event) => { event.currentTarget.src = '/images/turf-pitch-top.png'; }} className="h-full w-full object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-4 pt-12 text-xs font-bold text-white">
                Hình ảnh thực tế từ các cụm sân
              </figcaption>
            </figure>
            {supportingPreviewImages.map((image, index) => (
              <div key={`${image}-${index}`} className="col-span-2 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                <img src={image} alt={`Không gian sân bóng ${index + 2}`} onError={(event) => { event.currentTarget.src = index === 0 ? '/images/turf-pitch.png' : '/images/stadium-7.png'; }} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Component */}
      <VenueFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        city={city}
        onCityChange={setCity}
        fieldType={fieldType}
        onFieldTypeChange={setFieldType}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onReset={handleReset}
      />

      {/* Venues Grid / Map View */}
      {isLoading ? (
        <LoadingSkeleton count={6} type="card" />
      ) : venues.length === 0 ? (
        <EmptyState
          title="Không tìm thấy sân bóng phù hợp"
          description="Hãy thử đổi khu vực hoặc xóa bớt tiêu chí lọc để tìm thêm nhiều sân khác."
          icon={MapPin}
          action={{
            label: 'Xóa bộ lọc tìm kiếm',
            onClick: handleReset
          }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 border-l-4 border-emerald-500 pl-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Danh sách sân</span>
              <span>Tìm thấy <strong className="font-black text-slate-900">{venues.length}</strong> cụm sân phù hợp</span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                onClick={() => setViewMode('GRID')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'GRID'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Danh Sách Thẻ
              </button>
              <button
                onClick={() => setViewMode('MAP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'MAP'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Map className="w-3.5 h-3.5" /> Bản Đồ Google Maps
              </button>
            </div>
          </div>

          {viewMode === 'MAP' ? (
            <GoogleMapView
              venues={venues}
              title="Bản Đồ Tất Cả Cụm Sân Bóng"
              height="h-[500px]"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
