import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface CommentSkeletonProps {
  count?: number;
  className?: string;
}

const CommentSkeleton = ({ count = 1, className }: CommentSkeletonProps) => {
  return (
    <div className={className}>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="flex gap-3 items-start">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[50px]" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentSkeleton;