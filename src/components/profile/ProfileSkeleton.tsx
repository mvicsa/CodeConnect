import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const ProfileHeaderSkeleton = ({ className = '' }: { className?: string }) => (
  <Card className={`pt-0 relative gap-0 dark:border-0 shadow-none ${className}`}>
    <CardHeader className="p-0 gap-0">
      {/* Cover Image Skeleton */}
      <div className="relative w-full h-48 lg:h-[300px]">
        <Skeleton className="w-full h-full rounded-t-xl" />
        
        {/* Edit Cover Button Skeleton (for own profile) */}
        <div className="absolute right-4 bottom-4">
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
        
        {/* Profile Menu Skeleton (for own profile) */}
        <div className="absolute top-3 right-3 z-10">
          <Skeleton className="w-7 h-7 rounded-sm" />
        </div>
      </div>
    </CardHeader>
    
    <CardContent className="text-center">
      {/* Followers/Following and Avatar Section */}
      <div className="flex items-end justify-center gap-4 -mt-15">
        {/* Followers */}
        <div className="flex flex-col items-center justify-center order-1">
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Following */}
        <div className="flex flex-col items-center justify-center order-3">
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Avatar */}
        <div className="order-2 relative">
          <Skeleton className="w-35 h-35 rounded-full border-6 border-card" />
          
          {/* Online Status Dot */}
          <Skeleton className="absolute bottom-2 start-5 w-5 h-5 rounded-full" />
          
          {/* Edit Avatar Button (for own profile) */}
          <div className="absolute bottom-0 right-0">
            <Skeleton className="w-7 h-7 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* User Info Section */}
      <div className="flex flex-col gap-1 mt-5">
        {/* Name and Admin Badge */}
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        {/* Username */}
        <Skeleton className="h-6 w-32 mx-auto" />
        
        {/* Action Buttons (for other profiles) */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export const AboutMeSkeleton = ({ className = '' }: { className?: string }) => (
  <Card className={`w-full dark:border-0 shadow-none ${className}`}>
    <CardHeader>
      <CardTitle className="text-xl font-bold mb-3">
        <Skeleton className="h-6 w-24" />
      </CardTitle>
      
      {/* Bio Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Location Info Skeletons */}
      <div className="space-y-2 mt-4">
        <div className="flex flex-row">
          <Skeleton className="h-4 w-12 mr-4" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex flex-row">
          <Skeleton className="h-4 w-16 mr-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-row">
          <Skeleton className="h-4 w-8 mr-4" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      {/* Social Links Section */}
      <div className="mt-4">
        <Skeleton className="h-4 w-16 mb-2" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </CardHeader>
  </Card>
)

export const SessionRatingsSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`mt-4 ${className}`}>
    <Card className="w-full dark:border-0 shadow-none gap-3">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Average Rating Card */}
        <div className="text-center bg-accent/50 p-3 rounded-lg">
          <Skeleton className="h-4 w-24 mx-auto mb-2" />
          <div className="flex items-center justify-center gap-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>
        
        {/* Total Ratings Card */}
        <div className="text-center bg-accent/50 p-3 rounded-lg">
          <Skeleton className="h-4 w-20 mx-auto mb-2" />
          <Skeleton className="h-8 w-6 mx-auto" />
        </div>
        
        {/* 4+ Star Ratings Card */}
        <div className="text-center bg-accent/50 p-3 rounded-lg">
          <Skeleton className="h-4 w-28 mx-auto mb-2" />
          <Skeleton className="h-8 w-6 mx-auto" />
        </div>
      </CardContent>
    </Card>
  </div>
)

export const SkillsSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`mt-4 ${className}`}>
    <Skeleton className="h-8 w-16 mb-4" />
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-7 w-16 rounded-full" />
      <Skeleton className="h-7 w-20 rounded-full" />
      <Skeleton className="h-7 w-14 rounded-full" />
      <Skeleton className="h-7 w-18 rounded-full" />
      <Skeleton className="h-7 w-22 rounded-full" />
    </div>
  </div>
)

export const ProfileSidebarSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`hidden md:block col-span-5 ${className}`}>
    <AboutMeSkeleton />
    <SessionRatingsSkeleton />
    <SkillsSkeleton />
  </div>
)
