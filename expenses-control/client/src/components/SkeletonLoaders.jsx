import React from 'react';

/**
 * Reusable skeleton loader component.
 * Renders animated placeholder shapes matching content layout.
 */
export function SkeletonLine({ width = 'w-3/4', className = '' }) {
  return (
    <div className={`h-4 rounded-md skeleton-shimmer ${width} ${className}`} aria-hidden="true" />
  );
}

export function SkeletonCircle({ size = 'w-12 h-12', className = '' }) {
  return (
    <div className={`${size} rounded-full skeleton-shimmer ${className}`} aria-hidden="true" />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full skeleton-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-2/3" />
          <SkeletonLine width="w-1/3" className="h-3" />
        </div>
        <div className="w-16 h-5 rounded-md skeleton-shimmer flex-shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonGroupGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for expense list items
 */
export function SkeletonExpenseList({ count = 3 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-2">
              <SkeletonLine width="w-3/5" className="h-5" />
              <SkeletonLine width="w-2/5" className="h-3" />
            </div>
            <div className="w-20 h-6 rounded-md skeleton-shimmer flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}