"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Calendar, User, MessageCircle } from "lucide-react";
import { ratingService } from "@/services/ratingService";
import { RatingResponseDto } from "@/types/rating";
import { formatDate } from "date-fns";
import Link from "next/link";

interface MeetingRatingsProps {
  meetingId: string;
  meetingName: string;
  creatorId: string;
}

export const MeetingRatings = ({ meetingId }: MeetingRatingsProps) => {
  const [ratings, setRatings] = useState<RatingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllRatings, setShowAllRatings] = useState(false);

  const fetchMeetingRatings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const ratingsData = await ratingService.getSessionRatings(meetingId);
      setRatings(ratingsData || []);
    } catch (error) {
      console.error('Failed to fetch meeting ratings:', error);
      setError('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchMeetingRatings();
  }, [meetingId, fetchMeetingRatings]);

  // Also refresh ratings when meeting data changes
  useEffect(() => {
    if (meetingId) {
      fetchMeetingRatings();
    }
  }, [meetingId, fetchMeetingRatings]);

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

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-yellow-600";
    if (rating >= 2.5) return "text-orange-600";
    return "text-red-600";
  };

  const calculateAverageRating = () => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => sum + rating.overallRating, 0);
    return total / ratings.length;
  };

  const averageRating = calculateAverageRating();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={fetchMeetingRatings} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (ratings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Session Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Star className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No ratings yet for this session
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayedRatings = showAllRatings ? ratings : ratings.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Session Ratings
            <Badge variant="outline" className="ml-2">
              {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </div>
        {ratings.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Average:</span>
              {renderStarRating(averageRating, 'md')}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedRatings.map((rating) => (
            <div key={rating._id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getRatingColor(rating.overallRating)}>
                      {rating.overallRating} Star{rating.overallRating !== 1 ? 's' : ''}
                    </Badge>
                    {rating.isAnonymous && (
                      <Badge variant="secondary">Anonymous</Badge>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(rating.createdAt, "MMM d, yyyy hh:mm a")}
                    </span>
                    {rating.raterUsername && (
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {rating.isAnonymous ? 'Anonymous User' : (
                          <Link href={`/profile/${rating.raterUsername}`} className="hover:underline">
                            {rating.raterFirstName} {rating.raterLastName}
                          </Link>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {renderStarRating(rating.overallRating, 'md')}
                </div>
              </div>

              {/* Rating Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-accent rounded-lg">
                  <div className="text-muted-foreground mb-1 text-xs sm:text-sm">Technical</div>
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">{rating.technicalKnowledge}</span>
                  </div>
                </div>
                <div className="text-center p-3 bg-accent rounded-lg">
                  <div className="text-muted-foreground mb-1 text-xs sm:text-sm">Communication</div>
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">{rating.communication}</span>
                  </div>
                </div>
                <div className="text-center p-3 bg-accent rounded-lg">
                  <div className="text-muted-foreground mb-1 text-xs sm:text-sm">Organization</div>
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">{rating.organization}</span>
                  </div>
                </div>
                <div className="text-center p-3 bg-accent rounded-lg">
                  <div className="text-muted-foreground mb-1 text-xs sm:text-sm">Helpfulness</div>
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">{rating.helpfulness}</span>
                  </div>
                </div>
              </div>

              {/* Comment */}
              {rating.comment && (
                <div className="bg-accent/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Comment</span>
                  </div>
                  <p className="text-sm">{rating.comment}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end mt-4">
                <Link href={`/ratings/${rating._id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {ratings.length > 3 && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAllRatings(!showAllRatings)}
            >
              {showAllRatings ? 'Show Less' : `Show All ${ratings.length} Ratings`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
