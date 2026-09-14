import React from 'react';
import { Search, Filter, MapPin, X } from 'lucide-react';

interface VenueFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  city: string;
  onCityChange: (c: string) => void;
  fieldType: string;
  onFieldTypeChange: (ft: string) => void;
  sortBy: string;
  onSortByChange: (s: string) => void;
  onReset: () => void;
}

export const VenueFilter: React.FC<VenueFilterProps> = ({
  searchQuery,
  onSearchChange,
  city,
  onCityChange,
  fieldType,
  onFieldTypeChange,
  sortBy,
  onSortByChange,
  onReset
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm tên sân, đường, quận hoặc địa điểm..."
          className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* City */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Khu vực / Thành phố
          </label>
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Tất cả thành phố</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
          </select>
        </div>

        {/* Field Type */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Loại sân bóng
          </label>
          <select
            value={fieldType}
            onChange={(e) => onFieldTypeChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Tất cả loại sân</option>
            <option value="5_vs_5">Sân 5 người</option>
            <option value="7_vs_7">Sân 7 người</option>
            <option value="11_vs_11">Sân 11 người</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Sắp xếp theo
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="rating_desc">⭐ Đánh giá cao nhất</option>
            <option value="price_asc">💵 Giá: Thấp đến Cao</option>
            <option value="price_desc">💵 Giá: Cao đến Thấp</option>
            <option value="reviews_desc">🔥 Nhiều đánh giá nhất</option>
          </select>
        </div>

        {/* Reset button */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" /> Xóa bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
};
