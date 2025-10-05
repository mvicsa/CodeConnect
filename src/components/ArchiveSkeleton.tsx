import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ArchiveSkeletonProps {
  count?: number;
  showHeader?: boolean;
}

export default function ArchiveSkeleton({ count = 1, showHeader = false }: ArchiveSkeletonProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
        </div>
      )}
      
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="shadow-none dark:border-transparent">
          <CardContent>
            <div className="space-y-6">
              {/* Header skeleton */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              
              {/* Content skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              
              {/* Code block skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <div className="bg-background/50 p-4 rounded-lg space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              
              {/* Tags skeleton */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-3">
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
