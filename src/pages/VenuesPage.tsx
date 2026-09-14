import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { IVenue } from '../types/index.js';
import { VenueCard } from '../components/venue/VenueCard.js';
import { VenueFilter } from '../components/venue/VenueFilter.js';
import { LoadingSkeleton, EmptyState, Pagination } from '../components/common/LoadingSkeleton.js';
import { GoogleMapView } from '../components/common/GoogleMapView.js';
import { MapPin, LayoutGrid, Map } from 'lucide-react';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Danh Sách Sân Bóng Cỏ Nhân Tạo
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Tìm kiếm và đặt lịch sân bóng đá chất lượng cao tại Hà Nội, TP. HCM và các tỉnh thành.
        </p>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span>Tìm thấy <strong className="text-emerald-700 font-bold">{venues.length}</strong> cụm sân phù hợp</span>

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
