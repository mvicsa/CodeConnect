import { Skeleton } from '../ui/skeleton'
import { Card, CardContent, CardHeader } from '../ui/card'

// Skeleton for profile ratings stats (3 cards layout)
export const RatingStatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {/* Average Rating Card */}
    <Card>
      <CardContent className="text-center p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-8 w-12" />
        </div>
        <Skeleton className="h-4 w-20 mx-auto" />
      </CardContent>
    </Card>
    
    {/* Total Ratings Card */}
    <Card>
      <CardContent className="text-center p-4">
        <Skeleton className="h-8 w-8 mx-auto mb-2" />
        <Skeleton className="h-4 w-16 mx-auto" />
      </CardContent>
    </Card>
    
    {/* 4+ Star Ratings Card */}
    <Card>
      <CardContent className="text-center p-4">
        <Skeleton className="h-8 w-8 mx-auto mb-2" />
        <Skeleton className="h-4 w-20 mx-auto" />
      </CardContent>
    </Card>
  </div>
)

// Skeleton for main ratings page stats (2 cards layout)
export const MyRatingStatsSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={className}>
    <Skeleton className="h-6 w-24 mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Session Ratings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-full" />
              ))}
            </div>
          </div>
          <div className="text-center">
            <Skeleton className="h-8 w-8 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-6 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        </CardContent>
      </Card>
      
      {/* Session Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex flex-col items-center justify-center flex-grow">
          <div className="text-center">
            <Skeleton className="h-8 w-32 mx-auto mb-2" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

export const RatingCardSkeleton = () => (
  <Card>
    <CardContent className="px-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          {/* Header with name and rating */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-full" />
              ))}
            </div>
          </div>
          
          {/* Room name */}
          <Skeleton className="h-4 w-32" />
          
          {/* Rating categories */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex flex-col items-center justify-center bg-accent/50 p-2 rounded-lg gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex flex-col items-center justify-center bg-accent/50 p-2 rounded-lg gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex flex-col items-center justify-center bg-accent/50 p-2 rounded-lg gap-2">
              <Skeleton className="h-4 w-18" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex flex-col items-center justify-center bg-accent/50 p-2 rounded-lg gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          
          {/* Button - View Details */}
          <div className="flex justify-end">
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export const RatingsSkeleton = () => (
  <div className="space-y-4">
    {/* Rating Stats Skeleton */}
    <RatingStatsSkeleton />
    
    {/* Ratings List Skeleton */}
    <div>
      <Skeleton className="h-6 w-24 mb-3" />
      <div className="space-y-3">
        <RatingCardSkeleton />
        <RatingCardSkeleton />
        <RatingCardSkeleton />
      </div>
    </div>
  </div>
)

export default RatingsSkeleton
