import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Link from "next/link";
import { SessionHistory } from '@/store/slices/meetingSlice';
import { User } from '@/types/user';
import { formatTime } from "@/lib/utils";

interface SessionHistoryCardProps {
  session: SessionHistory;
  sessionRatings: {[sessionId: string]: number};
  sessionRatingCounts: {[sessionId: string]: number};
  isSessionRated: (sessionId: string) => boolean;
  onRateSession: (session: SessionHistory) => void;
  currentUser: User | null;
  renderStarRating: (rating: number, size: 'sm' | 'md') => React.ReactNode;
}

export const SessionHistoryCard: React.FC<SessionHistoryCardProps> = ({
  session,
  sessionRatings,
  sessionRatingCounts,
  isSessionRated,
  onRateSession,
  currentUser,
  renderStarRating
}) => {
  const isActive = session.isActive;
  const canRate = session.createdBy?._id && 
                  session.createdBy._id !== currentUser?._id && 
                  !isSessionRated(session.roomId);

  return (
    <Card className="p-4 dark:border-transparent shadow-none">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Link href={`/meeting/${session.roomId}`} className="hover:text-primary hover:underline transition-colors">
              <h4 className="font-medium">{session.roomName}</h4>
            </Link>
            <Badge variant={session.isPrivate ? "secondary" : "default"}>
              {session.isPrivate ? "Private" : "Public"}
            </Badge>
            <Badge 
              variant="outline" 
              className={isActive ? "text-green-600" : "text-red-600"}
            >
              {isActive ? "Active" : "Ended"}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2 last:mb-0">
            Created by <Link href={`/profile/${session.createdBy?.username}`} className="text-foreground hover:underline">
              {session.createdBy?.firstName} {session.createdBy?.lastName}
            </Link>
          </p>

          {/* Session-specific information */}
          {!isActive && (
            <>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                {session.endedAt && (
                  <span>Ended: {formatTime(session.endedAt!)}</span>
                )}
              </div>
              
              {/* Average Rating Display */}
              <div className="mt-3 flex items-center gap-2">
                {sessionRatings[session.roomId] > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Average Rating:</span>
                    {renderStarRating(sessionRatings[session.roomId], 'sm')}
                    <span className="text-xs text-muted-foreground">
                      ({sessionRatingCounts[session.roomId]} rating{sessionRatingCounts[session.roomId] !== 1 ? 's' : ''})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">No ratings yet</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-gray-300" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Rating Button - Only show for ended sessions */}
        {!isActive && (
          <div className="ml-4 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRateSession(session)}
              disabled={!canRate}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              {isSessionRated(session.roomId) ? 'Already Rated' : 'Rate Session'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

interface SessionHistorySectionProps {
  title: string;
  sessions: SessionHistory[];
  emptyIcon: React.ReactNode;
  emptyMessage: string;
  sessionRatings: {[sessionId: string]: number};
  sessionRatingCounts: {[sessionId: string]: number};
  isSessionRated: (sessionId: string) => boolean;
  onRateSession: (session: SessionHistory) => void;
  currentUser: User | null;
  renderStarRating: (rating: number, size: 'sm' | 'md') => React.ReactNode;
}

export const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({
  title,
  sessions,
  emptyIcon,
  emptyMessage,
  sessionRatings,
  sessionRatingCounts,
  isSessionRated,
  onRateSession,
  currentUser,
  renderStarRating
}) => {
  if (sessions.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
        <div className="grid gap-3 sm:gap-4">
          <Card className="dark:border-transparent">
            <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6">
              {emptyIcon}
              <p className="text-sm text-muted-foreground text-center">
                {emptyMessage}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    // Handle null lastJoined values
    const aDate = a.lastJoined ? new Date(a.lastJoined).getTime() : 0;
    const bDate = b.lastJoined ? new Date(b.lastJoined).getTime() : 0;
    return bDate - aDate;
  });

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
      <div className="grid gap-3 sm:gap-4">
        {sortedSessions.map((session) => (
          <SessionHistoryCard
            key={session.roomId}
            session={session}
            sessionRatings={sessionRatings}
            sessionRatingCounts={sessionRatingCounts}
            isSessionRated={isSessionRated}
            onRateSession={onRateSession}
            currentUser={currentUser}
            renderStarRating={renderStarRating}
          />
        ))}
      </div>
    </div>
  );
};
