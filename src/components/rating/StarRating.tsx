"use client";

import React from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 'md',
  showNumber = true,
  interactive = false,
  onRatingChange,
  className = ''
}) => {
  const starSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6';
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg';
  
  const stars = [];
  
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= rating;
    const isHalfFilled = i - 0.5 <= rating && i > rating;
    
    if (isFilled) {
      stars.push(
        <Star 
          key={i} 
          className={`${starSize} fill-yellow-400 text-yellow-400 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onRatingChange?.(i)}
        />
      );
    } else if (isHalfFilled) {
      stars.push(
        <div key={i} className="relative">
          <Star className={`${starSize} text-gray-300`} />
          <Star 
            className={`${starSize} fill-yellow-400 text-yellow-400 absolute inset-0 overflow-hidden`} 
            style={{ clipPath: `inset(0 ${(1 - (rating % 1)) * 100}% 0 0)` }}
          />
        </div>
      );
    } else {
      stars.push(
        <Star 
          key={i} 
          className={`${starSize} text-gray-300 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform hover:text-yellow-400' : ''}`}
          onClick={() => interactive && onRatingChange?.(i)}
        />
      );
    }
  }
  
  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {stars}
      {showNumber && (
        <span className={`ms-1 ${textSize} text-muted-foreground`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
