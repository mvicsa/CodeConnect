import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const RoomCardSkeleton = () => {
  return (
    <Card className="dark:border-transparent p-6">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2">
                <div>
                  <div className="group flex items-center gap-2">
                    <Skeleton className="h-4 sm:h-5 lg:h-6 w-48 truncate" />
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </div>
              <Skeleton className="text-xs sm:text-sm text-muted-foreground mb-4 h-8 w-full" />
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-border/50 pt-4">
            <div className="flex flex-1 sm:flex-none items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-7 sm:h-8 w-24" />
              <Skeleton className="h-7 sm:h-8 w-24" />
            </div>
            
            <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
              <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" />
              <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
