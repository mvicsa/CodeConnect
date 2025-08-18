"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Video, Edit, Trash2, Calendar, Users, Globe, Lock } from "lucide-react";
import { Room as ReduxRoom } from "@/store/slices/meetingSlice";
import { User } from "@/types/user";
import { useTranslations } from "next-intl";
import axiosInstance from "@/lib/axios";

interface RoomCardProps {
  room: ReduxRoom;
  onCopySecretId: (roomId: string) => void;
  onJoinRoom: (room: ReduxRoom) => void;
  onEditRoom: (room: ReduxRoom) => void;
  onDeleteRoom: (room: ReduxRoom) => void;
  getRoomSecretId: (roomId: string) => Promise<string | null>;
  currentUser?: User;
  isUserInRoom?: boolean;
  showActions?: boolean;
  showRating?: boolean;
  rating?: number;
  ratingCount?: number;
  ratingLoading?: boolean;
}

export const RoomCard = ({ 
  room, 
  onCopySecretId, 
  onJoinRoom, 
  onEditRoom, 
  onDeleteRoom, 
  getRoomSecretId,
  currentUser,
  isUserInRoom = false,
  showActions = true,
  showRating = false,
  rating = 0,
  ratingCount = 0,
  ratingLoading = false
}: RoomCardProps) => {
  const t = useTranslations("meeting");
  const [liveParticipantCount, setLiveParticipantCount] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [liveRoomStatus, setLiveRoomStatus] = useState<{
    hasActiveSession: boolean;
    participantCount: number;
  } | null>(null);
  const [isStatusLoaded, setIsStatusLoaded] = useState(false);

  // Reset loading state when room changes
  useEffect(() => {
    setIsStatusLoaded(false);
    setLiveParticipantCount(null);
    setLiveRoomStatus(null);
  }, [room._id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch live room status from LiveKit once when component mounts
  useEffect(() => {
    const fetchLiveRoomStatus = async () => {
      try {
        console.log('=== RoomCard Status Fetch ===');
        console.log('Room ID:', room._id);
        console.log('Room name:', room.name);
        console.log('Room is private:', room.isPrivate);
        console.log('Room isActive (DB):', room.isActive);
        console.log('Room currentParticipants (DB):', room.currentParticipants);
        console.log('Room maxParticipants:', room.maxParticipants);
        
        // For private rooms, we need to handle them differently
        if (room.isPrivate) {
          console.log('--- Private Room Handling ---');
          
          // For private rooms, use the room's database state as the primary source
          // since LiveKit may not have real-time info for private rooms
          const hasActiveSession = room.isActive || false;
          const participantCount = room.currentParticipants || 0;
          
          console.log('Private room - Database state - isActive:', room.isActive);
          console.log('Private room - Database state - currentParticipants:', participantCount);
          console.log('Calculated hasActiveSession:', hasActiveSession || participantCount > 0);
          
          // Set initial state from database
          // A room is considered active if:
          // 1. It's marked as active in the database, OR
          // 2. It has current participants, OR
          // 3. It's a newly created room (within last 24 hours)
          const isNewlyCreated = new Date(room.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
          const calculatedActiveStatus = hasActiveSession || participantCount > 0 || isNewlyCreated;
          
          console.log('Room created at:', room.createdAt);
          console.log('Is newly created (within 24h):', isNewlyCreated);
          console.log('Final calculated active status:', calculatedActiveStatus);
          
          setLiveParticipantCount(participantCount);
          setLiveRoomStatus({
            hasActiveSession: calculatedActiveStatus,
            participantCount
          });
          
          // Try to get live status if available, but don't fail if unavailable
          try {
            console.log('Attempting to fetch live status for private room...');
            const response = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
            console.log('Private room live status response:', response.data);
            
            if (response.status === 200 && response.data) {
              const statusData = response.data;
              // Only update if we get valid data
              if (statusData.participantCount !== undefined && statusData.participantCount >= 0) {
                console.log('Updating private room with live data:', statusData);
                
                // Use live data if available, but fall back to calculated status if not
                const liveActiveStatus = statusData.hasActiveSession !== undefined 
                  ? statusData.hasActiveSession 
                  : (statusData.participantCount > 0 || isNewlyCreated);
                
                console.log('Live data - participantCount:', statusData.participantCount);
                console.log('Live data - hasActiveSession:', statusData.hasActiveSession);
                console.log('Live data - calculated activeStatus:', liveActiveStatus);
                
                setLiveParticipantCount(statusData.participantCount);
                setLiveRoomStatus({
                  hasActiveSession: liveActiveStatus,
                  participantCount: statusData.participantCount
                });
              }
            }
          } catch (privateRoomError) {
            console.log('Private room live status not available, using database state');
            console.log('Error details:', privateRoomError);
            // This is expected for private rooms, not an error
            // Keep the database-based status we already set
          }
        } else {
          console.log('--- Public Room Handling ---');
          // Public room - use regular status endpoint
          const response = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
          console.log('LiveKit status response:', response.data);
          
          if (response.status === 200) {
            const statusData = response.data;
            setLiveParticipantCount(statusData.participantCount || 0);
            setLiveRoomStatus({
              hasActiveSession: statusData.hasActiveSession || false,
              participantCount: statusData.participantCount || 0
            });
          }
        }
      } catch (error) {
        console.error('Failed to get live room status:', error);
        
        // For private rooms, use database values as fallback
        if (room.isPrivate) {
          console.log('Using database fallback for private room');
          const hasActiveSession = room.isActive || false;
          const participantCount = room.currentParticipants || 0;
          
          console.log('Fallback - isActive:', hasActiveSession);
          console.log('Fallback - currentParticipants:', participantCount);
          
          // Use the same logic as the main flow for consistency
          const isNewlyCreated = new Date(room.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
          const calculatedActiveStatus = hasActiveSession || participantCount > 0 || isNewlyCreated;
          
          console.log('Fallback - isNewlyCreated:', isNewlyCreated);
          console.log('Fallback - calculated hasActiveSession:', calculatedActiveStatus);
          
          setLiveParticipantCount(participantCount);
          setLiveRoomStatus({
            hasActiveSession: calculatedActiveStatus,
            participantCount
          });
        } else {
          // Public room fallback
          setLiveParticipantCount(0);
          setLiveRoomStatus({
            hasActiveSession: false,
            participantCount: 0
          });
        }
      } finally {
        setIsStatusLoaded(true);
        console.log('=== RoomCard Status Fetch Complete ===');
        console.log('Final liveParticipantCount:', liveParticipantCount);
        console.log('Final liveRoomStatus:', liveRoomStatus);
      }
    };

    fetchLiveRoomStatus();
    console.log('RoomCard useEffect triggered for room:', room._id);
  }, [room._id, room.isActive, room.isPrivate, room.currentParticipants, room.name, room.maxParticipants, room.createdAt]);

  // Check if current user is the creator of this room
  const isCreator = currentUser?._id === room.createdBy._id;

  return (
    <Card className="dark:border-transparent hover:shadow-md transition-shadow p-6">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate flex-1 min-w-0">
                  {room.name}
                </h3>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <Badge 
                    variant="secondary" 
                    className={
                      liveRoomStatus?.hasActiveSession 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                        : !room.isActive 
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    }
                  >
                    {!isStatusLoaded ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      (liveRoomStatus?.hasActiveSession ?? false) ? t("active") : (room.isActive ? t("inactive") : "Ended")
                    )}
                  </Badge>
                  <Badge variant={room.isPrivate ? "destructive" : "outline"} className="text-xs px-1.5 py-0.5">
                    {room.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {room.isPrivate ? t("private") : t("public")}
                  </Badge>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                {room.description}
              </p>
              <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{formatDate(room.createdAt)}</span>
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>
                    {liveParticipantCount ?? 0} participants
                  </span>
                </span>
              </div>
              
              {/* Rating Display */}
              {showRating && (
                <div className="mt-2 flex items-center gap-2">
                  {ratingLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span className="text-xs text-muted-foreground">Loading rating...</span>
                    </div>
                  ) : rating > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Average Rating:</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-md ${i < Math.floor(rating) ? 'text-yellow-400' : i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({ratingCount} rating{ratingCount !== 1 ? 's' : ''}) - {rating.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No ratings yet</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Section */}
          {showActions && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-border/50 pt-4">
            <div className="flex flex-1 sm:flex-none items-center gap-1.5 sm:gap-2">
                             <Button
                 variant="outline"
                 size="sm"
                 onClick={() => onCopySecretId(room._id)}
                 className="h-7 sm:h-8 text-xs flex-1 sm:flex-none sm:min-w-[80px]"
               >
                 <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                 <span className="hidden sm:inline ml-1">
                   {room.isPrivate ? "Copy Secret ID" : "Copy Room ID"}
                 </span>
               </Button>
                                           <Button
                size="sm"
                onClick={async () => {
                  setIsJoining(true);
                  try {
                    if (room.isPrivate) {
                      // For private rooms, get the secret ID first
                      const secretId = await getRoomSecretId(room._id);
                      if (secretId) {
                        onJoinRoom(room);
                      } else {
                        setIsJoining(false);
                      }
                    } else {
                      // For public rooms, join directly
                      onJoinRoom(room);
                    }
                  } catch (error) {
                    console.error('Error joining room:', error);
                    setIsJoining(false);
                  }
                }}
                disabled={isJoining || isUserInRoom}
                className="h-7 sm:h-8 text-xs flex-1 sm:flex-none sm:min-w-[80px]"
              >
                {isJoining ? (
                  <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span className="hidden sm:inline ml-1">
                  {isJoining ? "Joining..." : isUserInRoom ? "Already in Room" : t("join")}
                </span>
              </Button>
            </div>
            
            {isCreator && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEditRoom(room)}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDeleteRoom(room)}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 