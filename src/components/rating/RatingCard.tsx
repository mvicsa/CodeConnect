"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Calendar, User, MessageSquare } from 'lucide-react';
import { RatingResponseDto } from '@/types/rating';
import { StarRating } from './StarRating';
import { getRatingColor, formatRatingText } from '@/lib/ratingUtils';
import { formatDate } from 'date-fns';
import Link from 'next/link';

export interface RatingCardProps {
  rating: RatingResponseDto;
  showRoomName?: boolean;
  showViewDetails?: boolean;
  showRaterInfo?: boolean;
  compact?: boolean;
  className?: string;
}

export const RatingCard: React.FC<RatingCardProps> = ({
  rating,
  showRoomName = true,
  showViewDetails = true,
  showRaterInfo = true,
  compact = false,
  className = ''
}) => {
  return (
    <Card className={className + (compact ? "py-5" : "")}>
      <CardContent className={compact ? "px-5" : ""}>
        <div className="flex items-start justify-between mb-4 flex-wrap">
          <div className="flex-1">
            {showRoomName && (
              <div className="flex items-center gap-2 mb-2">
                <Link 
                  href={`/meeting/${rating.sessionId}`} 
                  className="hover:underline hover:text-primary transition-colors"
                >
                  <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`}>
                    {rating.roomName || "Session"}
                  </h3>
                </Link>
                <Badge variant="outline" className={getRatingColor(rating.overallRating)}>
                  {formatRatingText(rating.overallRating)}
                </Badge>
                {rating.isAnonymous && (
                  <Badge variant="secondary">Anonymous</Badge>
                )}
              </div>
            )}
            
            <div className={`flex items-center flex-wrap gap-4 text-sm text-muted-foreground ${compact ? 'mb-2' : 'mb-3'}`}>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(rating.createdAt, "MMM d, yyyy hh:mm a")}
              </span>
              {showRaterInfo && rating.raterUsername && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {rating.isAnonymous ? (
                    'Anonymous User'
                  ) : (
                    <Link 
                      href={`/profile/${rating.raterUsername}`} 
                      className="hover:underline"
                    >
                      {rating.raterFirstName} {rating.raterLastName}
                    </Link>
                  )}
                </span>
              )}
            </div>
          </div>
          
          <div>
            <StarRating rating={rating.overallRating} size={compact ? 'sm' : 'md'} />
          </div>
        </div>

        {/* Rating Details */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-${compact ? '2' : '4'} mb-4`}>
          <div className={`text-center p-${compact ? '2' : '3'} bg-accent/50 rounded-lg`}>
            <div className={`text-muted-foreground mb-1 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
              Technical
            </div>
            <div className="flex items-center justify-center gap-1 font-semibold">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm">{rating.technicalKnowledge}</span>
            </div>
          </div>
          
          <div className={`text-center p-${compact ? '2' : '3'} bg-accent/50 rounded-lg`}>
            <div className={`text-muted-foreground mb-1 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
              Communication
            </div>
            <div className="flex items-center justify-center gap-1 font-semibold">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm">{rating.communication}</span>
            </div>
          </div>
          
          <div className={`text-center p-${compact ? '2' : '3'} bg-accent/50 rounded-lg`}>
            <div className={`text-muted-foreground mb-1 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
              Organization
            </div>
            <div className="flex items-center justify-center gap-1 font-semibold">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm">{rating.organization}</span>
            </div>
          </div>
          
          <div className={`text-center p-${compact ? '2' : '3'} bg-accent/50 rounded-lg`}>
            <div className={`text-muted-foreground mb-1 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
              Helpfulness
            </div>
            <div className="flex items-center justify-center gap-1 font-semibold">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm">{rating.helpfulness}</span>
            </div>
          </div>
        </div>

        {/* Comment */}
        {rating.comment && (
          <div className={`bg-accent/50 p-${compact ? '3' : '4'} rounded-lg mb-4`}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Comment</span>
            </div>
            <p className="text-sm">{rating.comment}</p>
          </div>
        )}

        {/* Actions */}
        {showViewDetails && (
          <div className="flex justify-end">
            <Link href={`/ratings/${rating._id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
