import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={clsx('animate-pulse rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100', className)} />
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 4,
  columns = 5,
}) => (
  <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
    <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
      <Skeleton className="h-4 w-40" />
    </div>
    <div className="space-y-3 p-6">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={colIndex} className="h-12 w-full" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardGridSkeleton: React.FC<{ cards?: number }> = ({ cards = 3 }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: cards }).map((_, index) => (
      <div key={index} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
        <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);
