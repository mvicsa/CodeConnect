"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Users, 
  Copy, 
  Calendar,
  User,
  Globe
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PublicSession } from "@/store/slices/meetingSlice";
import axiosInstance from "@/lib/axios";

interface PublicSessionCardProps {
  session: PublicSession;
  onJoinSession: (session: PublicSession) => void;
  onCopyRoomId: (roomId: string) => void;
  isUserInRoom?: boolean;
}

export const PublicSessionCard = ({
  session,
  onJoinSession,
  onCopyRoomId,
  isUserInRoom = false,
}: PublicSessionCardProps) => {
  const t = useTranslations("meeting");
  const [isJoining, setIsJoining] = useState(false);
  const [liveParticipantCount, setLiveParticipantCount] = useState<number | null>(null);
  const [liveRoomStatus, setLiveRoomStatus] = useState<{
    hasActiveSession: boolean;
    participantCount: number;
  } | null>(null);
  const [isStatusLoaded, setIsStatusLoaded] = useState(false);

  // Fetch live room status from LiveKit once when component mounts
  useEffect(() => {
    // Only fetch if session data is valid
    if (!session || !session._id) return;
    
    const fetchLiveRoomStatus = async () => {
      try {
        console.log('Fetching LiveKit status for session:', session._id);
        const response = await axiosInstance.get(`/livekit/rooms/${session._id}/status`);
        console.log('LiveKit status response:', response.data);
        
        if (response.status === 200) {
          const statusData = response.data;
          console.log('Status data:', statusData);
          console.log('Participant count:', statusData.participantCount);
          console.log('Has active session:', statusData.hasActiveSession);
          
          setLiveParticipantCount(statusData.participantCount || 0);
          setLiveRoomStatus({
            hasActiveSession: statusData.hasActiveSession || false,
            participantCount: statusData.participantCount || 0
          });
        }
      } catch (error) {
        console.error('Failed to get live room status:', error);
        // For public sessions, use database values as fallback
        setLiveParticipantCount(session.currentParticipants || 0);
        setLiveRoomStatus({
          hasActiveSession: session.isActive || false,
          participantCount: session.currentParticipants || 0
        });
      } finally {
        setIsStatusLoaded(true);
      }
    };

    fetchLiveRoomStatus();
  }, [session._id, session.currentParticipants, session.isActive]);

  // Safety check for session data
  if (!session || !session._id) {
    return null; // Don't render if session is invalid
  }

  const handleJoinSession = async () => {
    setIsJoining(true);
    await onJoinSession(session);
  };

  const handleCopyRoomId = async () => {
    try {
      await onCopyRoomId(session._id);
    } catch (error) {
      console.error("Failed to copy room ID:", error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };



  // Safe access to user data with fallbacks
  const creatorName = session.createdBy ? 
    `${session.createdBy.firstName || 'Unknown'} ${session.createdBy.lastName || 'User'}`.trim() || 'Unknown User' : 
    'Unknown User';

  return (
    <Card className="dark:border-transparent hover:shadow-md transition-shadow gap-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg mb-2">
              <Video className="h-5 w-5 text-primary" />
              {session.name || 'Unnamed Session'}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <User className="h-4 w-4" />
              <span>{creatorName}</span>
              <span>•</span>
              <Calendar className="h-4 w-4" />
              <span>{formatDate(session.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
                                      <Badge 
                variant="secondary" 
                className={
                  liveRoomStatus?.hasActiveSession 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                    : !session.isActive 
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                }
              >
               {!isStatusLoaded ? (
                 <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
               ) : (
                 (liveRoomStatus?.hasActiveSession ?? false) ? t("active") : (session.isActive ? t("inactive") : "Ended")
               )}
             </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {t("public")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {session.description && (
          <p className="text-sm text-muted-foreground">
            {session.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
               <Users className="h-4 w-4 text-muted-foreground" />
               <span>
                 {liveParticipantCount ?? 0} {t("participants")}
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRoomId}
              className="flex items-center gap-2"
            >
              <Copy className="h-3 w-3" />
              Copy Room ID
            </Button>
            <Button
               onClick={handleJoinSession}
               disabled={isJoining || isUserInRoom}
               size="sm"
               className="flex items-center gap-2"
             >
               {isJoining ? (
                 <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
               ) : (
                 <Video className="h-3 w-3" />
               )}
               {isJoining ? "Joining..." : isUserInRoom ? "In Room" : t("join")}
             </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
