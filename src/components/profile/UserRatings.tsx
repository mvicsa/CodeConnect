'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { ratingService } from '@/services/ratingService';

interface UserRatingsProps {
  userId: string;
}

const UserRatings: React.FC<UserRatingsProps> = ({ userId }) => {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRatings = async () => {
      try {
        setLoading(true);
        // Fetch received ratings to get stats
        const response = await ratingService.getUserReceivedRatings(userId, 1, 100);
        
        if (response.ratings && response.ratings.length > 0) {
          const total = response.pagination.total || 0;
          const average = response.ratings.reduce((sum, rating) => sum + rating.overallRating, 0) / response.ratings.length;
          
          setTotalRatings(total);
          setAverageRating(average);
        } else {
          setTotalRatings(0);
          setAverageRating(null);
        }
      } catch (error) {
        console.error('Failed to fetch user ratings:', error);
        setTotalRatings(0);
        setAverageRating(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserRatings();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center'>
        <span className='text-2xl font-bold'>-</span>
        <span className='text-sm text-muted-foreground'>Loading...</span>
      </div>
    );
  }

  // Don't show anything if no ratings
  if (totalRatings === 0) {
    return null;
  }

  return (
    <div className='flex flex-col items-center justify-center'>
      <div className='flex items-center gap-1'>
        <Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
        <span className='text-2xl font-bold'>{averageRating?.toFixed(1) || '0.0'}</span>
      </div>
      <span className='text-sm text-muted-foreground'>
        {totalRatings} Rating{totalRatings !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

export default UserRatings;
