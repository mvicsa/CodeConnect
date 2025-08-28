"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, User } from 'lucide-react';
import { RatingResponseDto } from '@/types/rating';
import { StarRating } from './StarRating';
import { calculateAverageRating } from '@/lib/ratingUtils';

export interface RatingStatsProps {
  ratings: RatingResponseDto[];
  totalRatings?: number;
  averageRating?: number;
  fourStarCount?: number;
  userInfo?: {
    firstName?: string;
    lastName?: string;
  };
  title?: string;
  subtitle?: string;
  showUserInfo?: boolean;
  className?: string;
}

export const RatingStats: React.FC<RatingStatsProps> = ({
  ratings,
  totalRatings,
  averageRating,
  fourStarCount,
  userInfo,
  title = "My Stats",
  subtitle,
  showUserInfo = true,
  className = ''
}) => {
  const calculatedAverage = averageRating ?? calculateAverageRating(ratings);
  const calculatedTotal = totalRatings ?? ratings.length;
  const calculatedFourStar = fourStarCount ?? ratings.filter(r => r.overallRating >= 4).length;

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Session Ratings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Rating</span>
              <div className="font-semibold text-lg">
                {calculatedTotal > 0 ? (
                  <StarRating rating={calculatedAverage} size="md" />
                ) : (
                  "N/A"
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {calculatedTotal}
              </div>
              <div className="text-sm text-muted-foreground">Total Ratings</div>
            </div>
            {calculatedTotal > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {calculatedFourStar}
                </div>
                <div className="text-sm text-muted-foreground">4+ Star Ratings</div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {showUserInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span>Session Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userInfo && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {String(userInfo.firstName || '')} {String(userInfo.lastName || '')}
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {subtitle || "Ratings for your sessions"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
