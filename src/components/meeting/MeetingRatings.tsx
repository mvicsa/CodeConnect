"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle } from "lucide-react";
import { ratingService } from "@/services/ratingService";
import { RatingResponseDto } from "@/types/rating";
import { StarRating, RatingCard } from "@/components/rating";
import { calculateAverageRating } from "@/lib/ratingUtils";

interface MeetingRatingsProps {
  meetingId: string;
  meetingName: string;
  creatorId: string;
  dataVersion?: number; // Add dataVersion prop to trigger re-fetching
}

export const MeetingRatings = ({ meetingId, dataVersion }: MeetingRatingsProps) => {
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
    } catch {
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
  }, [meetingId, fetchMeetingRatings, dataVersion]);

  // Removed duplicate functions - now using shared components and utilities

  const averageRating = calculateAverageRating(ratings);

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
              <StarRating rating={averageRating} size="md" />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedRatings.map((rating) => (
            <RatingCard
              key={rating._id}
              rating={rating}
              showRoomName={false}
              showViewDetails={true}
              showRaterInfo={true}
              className="bg-background/50"
            />
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
