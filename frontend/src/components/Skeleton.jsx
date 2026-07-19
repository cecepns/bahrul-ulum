import React from "react";

export const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 border-b border-slate-100 flex items-center px-6 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded flex-1"></div>
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 flex items-center px-6 gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 bg-slate-100 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          <div className="h-8 bg-slate-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse flex flex-col gap-4">
      <div className="h-40 bg-slate-100 rounded-xl w-full"></div>
      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      <div className="h-3 bg-slate-150 rounded w-1/2"></div>
    </div>
  );
};
