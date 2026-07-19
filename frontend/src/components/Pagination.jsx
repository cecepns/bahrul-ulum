import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange
}) => {
  if (totalPages <= 1 && total <= limit) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-slate-100 mt-4">
        <span className="text-sm text-slate-500">
          Menampilkan <span className="font-semibold text-slate-700">{total}</span> data
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Tampilkan</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {[10, 25, 50, 100].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Calculate shown range
  const startRange = (page - 1) * limit + 1;
  const endRange = Math.min(page * limit, total);

  // Generate page numbers array
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-slate-100 mt-4">
      {/* Total Data Info */}
      <span className="text-sm text-slate-500">
        Menampilkan <span className="font-semibold text-slate-700">{startRange}-{endRange}</span> dari <span className="font-semibold text-slate-700">{total}</span> data
      </span>

      <div className="flex flex-wrap items-center gap-4">
        {/* Limit Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Tampilkan</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
          >
            {[10, 25, 50, 100].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-600"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Page Numbers */}
          {pages.map((p) => {
            // Logic to truncate pages if totalPages is large
            if (totalPages > 5) {
              if (p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1 text-slate-400">...</span>;
                }
                return null;
              }
            }

            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  page === p
                    ? "bg-emerald-500 text-white font-semibold"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-600"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
