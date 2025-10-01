'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ratingService } from '@/services/ratingService';
import { RatingResponseDto } from '@/types/rating';
import { Button } from '@/components/ui/button';
import { RatingCard } from '@/components/rating';
import { calculateAverageRating } from '@/lib/ratingUtils';
import { RatingsSkeleton, RatingCardSkeleton } from '@/components/rating/RatingSkeleton';

interface UserRatingsDetailedProps {
  userId: string;
}

const UserRatingsDetailed: React.FC<UserRatingsDetailedProps> = ({ userId }) => {
  const [ratings, setRatings] = useState<RatingResponseDto[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [fourStarCount, setFourStarCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchUserRatings = async () => {
      try {
        setLoading(true);
        const response = await ratingService.getUserReceivedRatings(userId, 1, 3);
        
        if (response.ratings && response.ratings.length > 0) {
          const total = response.pagination.total || 0;
          
          // Calculate average from all ratings, not just the first 3
          let average = 0;
          if (total <= 100) { // If total is small enough, fetch all to get accurate average
            const allRatingsResponse = await ratingService.getUserReceivedRatings(userId, 1, total);
            if (allRatingsResponse.ratings && allRatingsResponse.ratings.length > 0) {
              average = calculateAverageRating(allRatingsResponse.ratings);
            }
          } else {
            // For large numbers, calculate from first 3 as fallback
            average = calculateAverageRating(response.ratings);
          }
          
          setRatings(response.ratings);
          setTotalRatings(total);
          setAverageRating(average);
          setHasMore(response.pagination.hasNext || false);
          
          // Calculate 4+ star count from all ratings if we have them
          if (total <= 100) { // If total is small enough, fetch all to get accurate count
            const allRatingsResponse = await ratingService.getUserReceivedRatings(userId, 1, total);
            if (allRatingsResponse.ratings) {
              const fourStar = allRatingsResponse.ratings.filter(r => r.overallRating >= 4).length;
              setFourStarCount(fourStar);
            }
          } else {
            // For large numbers, estimate based on average
            const estimatedFourPlus = Math.round((average / 5) * total * 0.8);
            setFourStarCount(Math.max(0, estimatedFourPlus));
          }
        } else {
          setRatings([]);
          setTotalRatings(0);
          setAverageRating(null);
          setFourStarCount(0);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to fetch user ratings:', error);
        setRatings([]);
        setTotalRatings(0);
        setAverageRating(null);
        setFourStarCount(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserRatings();
    }
  }, [userId]);

  const loadMoreRatings = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      // Use the same limit (3) as the initial load for consistency
      const response = await ratingService.getUserReceivedRatings(userId, nextPage, 3);
      
      if (response.ratings && response.ratings.length > 0) {
        setRatings(prev => [...prev, ...response.ratings]);
        setCurrentPage(nextPage);
        setHasMore(response.pagination.hasNext || false);
      }
    } catch (error) {
      console.error('Failed to load more ratings:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Removed duplicate functions - now using shared components and utilities

  if (loading) {
    return <RatingsSkeleton />;
  }

  // Show empty state if no ratings, but still display the tab
  if (totalRatings === 0) {
    return (
      <div className="space-y-4">
        {/* Rating Summary - Show zeros when no ratings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="text-center p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-6 w-6 text-muted-foreground" />
                <span className="text-2xl font-bold text-muted-foreground">0.0</span>
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center p-4">
              <div className="text-2xl font-bold text-muted-foreground">0</div>
              <p className="text-sm text-muted-foreground">Total Ratings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center p-4">
              <div className="text-2xl font-bold text-muted-foreground">0</div>
              <p className="text-sm text-muted-foreground">4+ Star Ratings</p>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Ratings Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              This user hasn&apos;t received any ratings yet. Ratings will appear here once other users rate their sessions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              <span className="text-2xl font-bold">{averageRating?.toFixed(1) || '0.0'}</span>
            </div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold text-primary mb-2">{totalRatings}</div>
            <p className="text-sm text-muted-foreground">Total Ratings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {fourStarCount}
            </div>
            <p className="text-sm text-muted-foreground">4+ Star Ratings</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Ratings */}
      <div>
        <h5 className="text-lg font-semibold mb-3">All Ratings</h5>
        <div className="space-y-3">
          {ratings.map((rating) => (
            <RatingCard
              key={rating._id}
              rating={rating}
              showRoomName={true}
              showViewDetails={true}
              showRaterInfo={true}
              compact={true}
            />
          ))}
        </div>
        
        {/* Loading More Skeleton */}
        {loadingMore && (
          <div className="space-y-3 mt-4">
            <RatingCardSkeleton />
            <RatingCardSkeleton />
            <RatingCardSkeleton />
          </div>
        )}
        
        {hasMore && !loadingMore && (
          <div className="text-center mt-4">
            <Button
              onClick={loadMoreRatings}
              variant="outline"
            >
              Load More Ratings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRatingsDetailed;
