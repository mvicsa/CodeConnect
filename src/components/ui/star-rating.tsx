import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  /** Current rating value (0-5) */
  value?: number;
  /** Average rating for display (0-5) */
  averageRating?: number;
  /** Number of total ratings/votes */
  ratingsCount?: number;
  /** Whether the component is interactive (can be clicked) */
  interactive?: boolean;
  /** Whether the component is in a loading/submitting state */
  loading?: boolean;
  /** Size of the stars */
  size?: 'sm' | 'md' | 'lg';
  /** Show the numeric rating and count */
  showText?: boolean;
  /** Show user's personal rating */
  showUserRating?: boolean;
  /** Callback when a star is clicked */
  onRate?: (rating: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function StarRating({
  value = 0,
  averageRating,
  ratingsCount = 0,
  interactive = false,
  loading = false,
  size = 'md',
  showText = true,
  showUserRating = false,
  onRate,
  className,
  disabled = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const starSize = sizeMap[size];
  
  // Use average rating for display if provided, otherwise use value
  const displayRating = averageRating ?? value;
  const currentRating = interactive ? (hoverRating || value) : displayRating;
  
  const handleStarClick = (rating: number) => {
    if (!interactive || disabled || loading) return;
    onRate?.(rating);
  };

  const handleStarHover = (rating: number) => {
    if (!interactive || disabled || loading) return;
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    if (!interactive || disabled || loading) return;
    setHoverRating(0);
  };

  // Calculate stars for display-only mode (with half stars)
  const getDisplayStars = () => {
    const filled = Math.floor(displayRating);
    const hasHalf = displayRating - filled >= 0.5;
    const empty = 5 - filled - (hasHalf ? 1 : 0);

    return (
      <>
        {[...Array(filled)].map((_, i) => (
          <Star
            key={`filled-${i}`}
            size={starSize}
            className="text-yellow-400"
            fill="currentColor"
          />
        ))}
        {hasHalf && (
          <Star
            key="half"
            size={starSize}
            className="text-yellow-400 opacity-50"
            fill="currentColor"
          />
        )}
        {[...Array(empty)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={starSize}
            className="text-gray-300"
            fill="none"
          />
        ))}
      </>
    );
  };

  // Calculate stars for interactive mode
  const getInteractiveStars = () => {
    return [1, 2, 3, 4, 5].map((starNumber) => {
      const isFilled = currentRating >= starNumber;
      return (
        <button
          key={starNumber}
          type="button"
          disabled={disabled || loading}
          onClick={() => handleStarClick(starNumber)}
          onMouseEnter={() => handleStarHover(starNumber)}
          className={cn(
            'transition-colors duration-150',
            interactive && !disabled && !loading && 'hover:scale-110 transform transition-transform',
            disabled || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          )}
        >
          <Star
            size={starSize}
            className={cn(
              'transition-colors duration-150',
              isFilled ? 'text-yellow-400' : 'text-gray-300'
            )}
            fill={isFilled ? 'currentColor' : 'none'}
          />
        </button>
      );
    });
  };

  return (
    <div 
      className={cn('flex flex-col gap-1', className)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-0.5">
        {interactive ? getInteractiveStars() : getDisplayStars()}
      </div>
      
      {showText && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          {averageRating !== undefined ? (
            <span>
              {averageRating.toFixed(1)} ({ratingsCount} {ratingsCount === 1 ? 'vote' : 'votes'})
            </span>
          ) : (
            ratingsCount > 0 && (
              <span>
                ({ratingsCount} {ratingsCount === 1 ? 'vote' : 'votes'})
              </span>
            )
          )}
        </div>
      )}
      
      {showUserRating && value > 0 && (
        <span className="text-xs text-primary font-medium">
          Your rating: {value}
        </span>
      )}
      
      {loading && (
        <span className="text-xs text-muted-foreground">
          Saving...
        </span>
      )}
    </div>
  );
}

// Helper component for prominent display (like in playground header)
export function StarRatingDisplay({
  averageRating = 0,
  ratingsCount = 0,
  className,
}: {
  averageRating?: number;
  ratingsCount?: number;
  className?: string;
}) {
  if (ratingsCount === 0) return null;
  
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <StarRating
          averageRating={averageRating}
          ratingsCount={ratingsCount}
          size="lg"
          showText={false}
          interactive={false}
        />
      </div>
      <span className="text-lg font-semibold text-muted-foreground">
        {averageRating.toFixed(1)} ({ratingsCount} {ratingsCount === 1 ? 'vote' : 'votes'})
      </span>
    </div>
  );
} 