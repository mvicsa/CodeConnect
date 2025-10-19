import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { SessionHistory } from '@/store/slices/meetingSlice';
import type { Room as ReduxRoom } from '@/store/slices/meetingSlice';
import { User } from '@/types/user';
import { RoomCard } from './RoomCard';

// The SessionHistoryCard component is no longer needed directly.
// We will use RoomCard instead. So, this code will be removed.

interface SessionHistorySectionProps {
  title: string;
  sessions: SessionHistory[];
  emptyIcon: React.ReactNode;
  emptyMessage: string;
  onRateSession: (room: ReduxRoom) => void; // Changed to ReduxRoom
  currentUser: User | null;
  renderStarRating: (rating: number, size: 'sm' | 'md') => React.ReactNode;
}

export const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({
  title,
  sessions,
  emptyIcon,
  emptyMessage,
  onRateSession,
  currentUser,
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
    // Sort by endedAt or cancelledAt if available, otherwise by lastJoined
    const getDate = (s: SessionHistory) => {
      if (s.cancelledAt) return new Date(s.cancelledAt).getTime();
      if (s.endedAt) return new Date(s.endedAt).getTime();
      return s.lastJoined ? new Date(s.lastJoined).getTime() : 0;
    };
    return getDate(b) - getDate(a);
  });

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
      <div className="grid gap-3 sm:gap-4">
        {sortedSessions.map((session) => {
          // Convert SessionHistory to Room type for RoomCard
          const room: ReduxRoom = {
            _id: session.roomId,
            name: session.roomName,
            description: session.roomDescription || '',
            isPrivate: session.isPrivate || false,
            maxParticipants: session.maxParticipants || 10,
            createdAt: session.createdAt,
            createdBy: session.createdBy || { _id: '', username: '', firstName: '', lastName: '', email: '' } as User,
            invitedUsers: session.invitedUsers || [],
            isActive: session.isActive || false,
            currentParticipants: session.currentParticipants || 0,
            totalParticipantsJoined: session.totalParticipantsJoined || 0,
            endedDate: session.endedAt,
            scheduledStartTime: session.scheduledStartTime,
            isPaid: session.isPaid || false,
            price: session.price,
            currency: session.currency,
            cancelledAt: session.cancelledAt, // Pass cancelledAt
            cancellationReason: session.cancellationReason, // Pass cancellationReason
            secretId: session.secretId || '', // Add this line
            updatedAt: session.updatedAt || session.createdAt // Add this line
          };

          return (
            <RoomCard
              key={room._id}
              room={room}
              onJoinRoom={() => { /* No join action needed in history */ }}
              onPayAndJoin={() => { /* No pay & join action needed in history */ }}
              onEditRoom={undefined}
              onDeleteRoom={undefined}
              onCancelRoom={undefined}
              currentUser={currentUser || undefined}
              isUserInRoom={false}
              showActions={true}
              showRating={true} // Show rating for history items
              onRateSession={() => onRateSession(room)} // Pass original session for rating
              showEditDelete={false}
              isUserInvited={true} // Assume user was invited/participated for history
            />
          );
        })}
      </div>
    </div>
  );
};
