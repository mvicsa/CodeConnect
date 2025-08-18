'use client';

import { useState, useEffect } from 'react';
import { Star, Calendar, User, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ratingService } from '@/services/ratingService';
import { RatingResponseDto } from '@/types/rating';
import { formatDate } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
          const average = response.ratings.reduce((sum, rating) => sum + rating.overallRating, 0) / response.ratings.length;
          
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

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-yellow-600";
    if (rating >= 2.5) return "text-orange-600";
    return "text-red-600";
  };

  const renderStarRating = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(
          <Star key={i} className={`${starSize} fill-yellow-400 text-yellow-400`} />
        );
      } else if (i - 0.5 <= rating) {
        stars.push(
          <div key={i} className="relative">
            <Star className={`${starSize} text-gray-300`} />
            <Star className={`${starSize} fill-yellow-400 text-yellow-400 absolute inset-0 overflow-hidden`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className={`${starSize} text-gray-300`} />
        );
      }
    }
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className={`ml-1 text-xs ${size === 'sm' ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  // Don't show anything if no ratings
  if (totalRatings === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Star className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">No ratings yet</p>
        </CardContent>
      </Card>
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
            <Card key={rating._id}>
              <CardContent >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h6 className="font-semibold">
                        {rating.roomName || "Session"}
                      </h6>
                      <Badge variant="outline" className={getRatingColor(rating.overallRating)}>
                        {rating.overallRating} Star{rating.overallRating !== 1 ? 's' : ''}
                      </Badge>
                      {rating.isAnonymous && (
                        <Badge variant="secondary">Anonymous</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(rating.createdAt, "MMM d, yyyy")}
                      </span>
                      {rating.raterUsername && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <Link href={`/profile/${rating.raterUsername}`} className="hover:underline">
                            {rating.isAnonymous ? 'Anonymous User' : `${rating.raterFirstName} ${rating.raterLastName}`}
                          </Link>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {renderStarRating(rating.overallRating, 'sm')}
                  </div>
                </div>

                {/* Rating Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <div className="text-center p-2 bg-accent rounded text-sm">
                    <div className="text-muted-foreground">Technical</div>
                    <div className="font-semibold flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {rating.technicalKnowledge}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-accent rounded text-sm">
                    <div className="text-muted-foreground">Communication</div>
                    <div className="font-semibold flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {rating.communication}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-accent rounded text-sm">
                    <div className="text-muted-foreground">Organization</div>
                    <div className="font-semibold flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {rating.organization}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-accent rounded text-sm">
                    <div className="text-muted-foreground">Helpfulness</div>
                    <div className="font-semibold flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {rating.helpfulness}
                    </div>
                  </div>
                </div>

                {/* Comment */}
                {rating.comment && (
                  <div className="bg-accent/50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Comment</span>
                    </div>
                    <p className="text-sm">{rating.comment}</p>
                  </div>
                )}

                {/* View Details Button */}
                <div className="mt-3 flex justify-end">
                  <Link 
                    href={`/ratings/${rating._id}`}
                  >
                    <Button variant="outline" size="sm" className="text-sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {hasMore && (
          <div className="text-center mt-4">
            <button
              onClick={loadMoreRatings}
              disabled={loadingMore}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Loading...' : 'Load More Ratings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRatingsDetailed;
