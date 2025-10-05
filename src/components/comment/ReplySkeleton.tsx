import React from 'react';

interface CommentSkeletonProps {
  count?: number;
  isReply?: boolean;
}

const CommentSkeleton: React.FC<CommentSkeletonProps> = ({ count = 2, isReply = false }) => {
  return (
    <div className={`${isReply ? 'mt-3' : ''} space-y-3`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex gap-3 p-3">
            {/* Avatar skeleton */}
            <div className="w-8 h-8 bg-accent rounded-full flex-shrink-0"></div>
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              {/* Header skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 bg-accent rounded w-20"></div>
                <div className="h-3 bg-accent rounded w-16"></div>
                <div className="h-3 bg-accent rounded w-12"></div>
              </div>
              
              {/* Text skeleton */}
              <div className="space-y-1">
                <div className="h-4 bg-accent rounded w-full"></div>
                <div className="h-4 bg-accent rounded w-3/4"></div>
              </div>
              
              {/* Actions skeleton */}
              <div className="flex gap-4 mt-2">
                <div className="h-3 bg-accent rounded w-12"></div>
                <div className="h-3 bg-accent rounded w-8"></div>
                <div className="h-3 bg-accent rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentSkeleton;
