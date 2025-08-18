import { useState, useCallback } from 'react';
import { CreateRatingDto, RatingResponseDto } from '@/types/rating';
import { ratingService } from '@/services/ratingService';
import { toast } from 'sonner';

export const useRating = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRating = useCallback(async (
    sessionId: string, 
    ratingData: CreateRatingDto
  ): Promise<RatingResponseDto | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await ratingService.createRating(sessionId, ratingData);
      toast.success('Thank you for your rating!');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit rating';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    submitRating,
    clearError,
  };
};
