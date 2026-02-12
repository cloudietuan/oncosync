import { Skeleton } from '@/components/ui/skeleton';

interface ChartSkeletonProps {
  height?: number;
  bars?: number;
}

export const ChartSkeleton = ({ height = 300, bars = 8 }: ChartSkeletonProps) => (
  <div className="vax-card" style={{ minHeight: height }}>
    <Skeleton className="h-4 w-48 mb-4" />
    <div className="flex items-end gap-2 h-[200px] pt-4">
      {Array.from({ length: bars }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-md"
          style={{
            height: `${30 + Math.random() * 60}%`,
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </div>
    <div className="flex justify-between mt-3">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-3 w-12" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="vax-card">
    <Skeleton className="h-4 w-32 mb-4" />
    <div className="space-y-3">
      <div className="flex gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4" style={{ animationDelay: `${i * 100}ms` }}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="vax-card-compact p-4">
    <Skeleton className="h-3 w-16 mb-2" />
    <Skeleton className="h-7 w-12 mb-1" />
    <Skeleton className="h-2.5 w-20" />
  </div>
);

export const StatGridSkeleton = ({ count = 7 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);
