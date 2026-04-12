import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'chart' | 'list' | 'sensor' | 'kpi' | 'trend-chart' | 'air-quality' | 'alerts' | 'stats';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = 'card', count = 1, className }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'kpi') {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'sensor') {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
            <Skeleton className="h-12 w-full mt-4 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={cn("p-5 rounded-xl bg-card border border-border", className)}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn("rounded-xl bg-card border border-border overflow-hidden", className)}>
        <div className="p-4 border-b border-border">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-4">
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          {items.map((i) => (
            <div key={i} className="flex gap-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-3", className)}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'trend-chart') {
    return (
      <div className={cn("p-5 rounded-xl bg-card border border-border", className)}>
        <div className="mb-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-72 w-full rounded-lg mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-16 flex-1 rounded-lg" />
          <Skeleton className="h-16 flex-1 rounded-lg" />
        </div>
      </div>
    );
  }

  if (variant === 'air-quality') {
    return (
      <div className={cn("lg:col-span-2 rounded-xl border border-border p-6", className)}>
        <div className="mb-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Gauge section */}
          <div className="xl:col-span-4 flex flex-col items-center justify-center">
            <Skeleton className="h-52 w-52 rounded-full mb-6" />
            <div className="w-full space-y-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
          {/* Chart section */}
          <div className="xl:col-span-8 rounded-xl border border-border p-4">
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'alerts') {
    return (
      <div className={cn("rounded-xl border border-border p-5", className)}>
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: count || 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-background/50 border border-border/50">
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-56 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-16 rounded-md flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="p-4 rounded-lg bg-card border border-border">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-6 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={cn("grid gap-4", className)}>
      {items.map((i) => (
        <div key={i} className="p-5 rounded-xl bg-card border border-border">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
