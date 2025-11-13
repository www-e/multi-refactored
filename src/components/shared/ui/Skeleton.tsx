'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
  isLoaded?: boolean;
}

export function Skeleton({ className, children, isLoaded = true }: SkeletonProps) {
  if (isLoaded) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn(
        'animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-700/60',
        className
      )}
    />
  );
}

// Specific skeleton for dashboard cards
export function DashboardCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-1/3 rounded bg-slate-200/60 dark:bg-slate-700/60"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 rounded-xl bg-slate-200/60 dark:bg-slate-700/60"></div>
        <div className="h-24 rounded-xl bg-slate-200/60 dark:bg-slate-700/60"></div>
        <div className="h-24 rounded-xl bg-slate-200/60 dark:bg-slate-700/60"></div>
      </div>
    </div>
  );
}

// Specific skeleton for data lists
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-slate-200/60 dark:bg-slate-700/60 rounded-lg">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-8 h-8 rounded-full bg-slate-300/60 dark:bg-slate-600/60"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-slate-300/60 dark:bg-slate-600/60"></div>
              <div className="h-3 w-16 rounded bg-slate-300/60 dark:bg-slate-600/60"></div>
            </div>
          </div>
          <div className="h-4 w-16 rounded bg-slate-300/60 dark:bg-slate-600/60"></div>
        </div>
      ))}
    </div>
  );
}