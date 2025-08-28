'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ratingService } from '@/services/ratingService';

interface UserRatingsStatsProps {
  userId: string;
}

const UserRatingsStats: React.FC<UserRatingsStatsProps> = ({ userId }) => {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [fourStarRatings, setFourStarRatings] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRatings = async () => {
      try {
        setLoading(true);
        // Fetch ratings for the specific user profile
        const response = await ratingService.getUserReceivedRatings(userId, 1, 100);
        
        if (response.ratings && response.ratings.length > 0) {
          const total = response.pagination.total || 0;
          const average = response.ratings.reduce((sum, rating) => sum + rating.overallRating, 0) / response.ratings.length;
          
          setTotalRatings(total);
          setAverageRating(average);
          setFourStarRatings(response.ratings.filter(r => r.overallRating >= 4).length);
        } else {
          setTotalRatings(0);
          setAverageRating(null);
          setFourStarRatings(0);
        } 
      } catch (error) {
        console.error('Failed to fetch user ratings:', error);
        setTotalRatings(0);
        setAverageRating(null);
        setFourStarRatings(0);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserRatings();
    }
  }, [userId]);

  // Don't show anything if no ratings
  if (totalRatings === 0) {
    return null;
  }

  return (
    <div className='mt-4'>
      <Card className='w-full dark:border-0 shadow-none gap-3'>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            <span>Session Ratings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='text-center bg-accent/50 p-3 rounded-lg'>
            <span className='text-sm text-muted-foreground'>Average Rating</span>
            <div className='font-semibold text-lg'>
              {loading ? (
                <span className='text-muted-foreground'>-</span>
              ) : (
                <div className='flex items-center justify-center gap-1'>
                  <Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
                  <span>{averageRating?.toFixed(1) || '0.0'}</span>
                </div>
              )}
            </div>
          </div>
          <div className='text-center bg-accent/50 p-3 rounded-lg'>
            <div className='text-sm text-muted-foreground'>Total Ratings</div>
            <div className='text-2xl font-bold text-primary'>
              {loading ? '-' : totalRatings}
            </div>
          </div>
          <div className='text-center bg-accent/50 p-3 rounded-lg'>
            <div className='text-sm text-muted-foreground'>4+ Star Ratings</div>
            <div className='text-2xl font-bold text-green-600'>
              {loading ? '-' : fourStarRatings}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRatingsStats;
