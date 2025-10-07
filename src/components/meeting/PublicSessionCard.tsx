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
  Globe,
  ExternalLink
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PublicSession } from "@/store/slices/meetingSlice";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { toast } from "sonner";

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
        const response = await axiosInstance.get(`/livekit/rooms/${session._id}/status`);
        
        if (response.status === 200) {
          const statusData = response.data;
          
          setLiveParticipantCount(statusData.participantCount || 0);
          setLiveRoomStatus({
            hasActiveSession: statusData.hasActiveSession || false,
            participantCount: statusData.participantCount || 0
          });
        }
      } catch {
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
  }, [session._id, session.currentParticipants, session.isActive, session]);

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
    } catch {
      toast.error("Failed to copy room ID"); 
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
              <Link 
                href={`/meeting/${session._id}`}
                className="group flex items-center gap-2 hover:text-primary transition-colors"
              >
                {session.name || 'Unnamed Session'}
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
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
                 {liveParticipantCount ?? 0} current
                 {session.totalParticipantsJoined && session.totalParticipantsJoined > (liveParticipantCount ?? 0) && (
                   <span className="text-muted-foreground">
                     {' '}({session.totalParticipantsJoined} total joined)
                   </span>
                 )}
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={`/meeting/${session._id}`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                View Details
              </Button>
            </Link>
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
