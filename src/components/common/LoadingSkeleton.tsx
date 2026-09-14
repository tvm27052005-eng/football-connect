import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

export const LoadingSkeleton: React.FC<{ count?: number; type?: 'card' | 'row' }> = ({
  count = 3,
  type = 'card'
}) => {
  return (
    <div className={type === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse space-y-4"
        >
          {type === 'card' && <div className="h-44 bg-slate-100 rounded-xl w-full" />}
          <div className="h-5 bg-slate-200/80 rounded-md w-3/4" />
          <div className="h-4 bg-slate-100 rounded-md w-1/2" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 bg-slate-100 rounded-full w-16" />
            <div className="h-6 bg-slate-100 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ title, description, icon: Icon = Inbox, action }) => {
  return (
    <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-300 rounded-2xl max-w-md mx-auto my-6 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-xs"
      >
        Trang trước
      </button>

      {Array.from({ length: totalPages }).map((_, i) => {
        const page = i + 1;
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-xs"
      >
        Trang sau
      </button>
    </div>
  );
};
