import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-2 !px-1 rounded-lg">
      <Skeleton className="h-7 w-7 rounded-full" />
      <Skeleton className="h-4 w-24 hidden md:block" />
      <Skeleton className="h-4 w-4 rounded-full hidden md:block" />
    </div>
  );
}
