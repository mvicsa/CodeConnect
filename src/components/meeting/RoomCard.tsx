"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Edit, Trash2, Calendar, Users, Globe, Lock, ExternalLink, Clock } from "lucide-react";
import { Room as ReduxRoom } from "@/store/slices/meetingSlice";
import { User } from "@/types/user";
import { useTranslations } from "next-intl";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { AxiosError } from "axios";
import Image from "next/image";

interface RoomCardProps {
  room: ReduxRoom;
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
  showEditDelete?: boolean;
  showCopyButton?: boolean;
}

export const RoomCard = ({ 
  room, 
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
  ratingLoading = false,
  showEditDelete = true,
  showCopyButton = true
}: RoomCardProps) => {
  const t = useTranslations("meeting");
  const [liveParticipantCount, setLiveParticipantCount] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  // const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [liveRoomStatus, setLiveRoomStatus] = useState<{
    hasActiveSession: boolean;
    participantCount: number;
  } | null>(null);

  const [secretId, setSecretId] = useState<string | null>(null);
  const [isLoadingSecretId, setIsLoadingSecretId] = useState(false);

  // Reset loading state when room changes
  useEffect(() => {
    setLiveParticipantCount(null);
    setLiveRoomStatus(null);
    setSecretId(null); // Reset secret ID when room changes
    // setIsLoadingStatus(true); // Reset loading state
  }, [room._id]);

  // Fetch secret ID for private rooms when component mounts
  useEffect(() => {
    if (room.isPrivate && showCopyButton && !secretId && !isLoadingSecretId) {
      const fetchSecretId = async () => {
        setIsLoadingSecretId(true);
        try {
          const fetchedSecretId = await getRoomSecretId(room._id);
          if (fetchedSecretId) {
            setSecretId(fetchedSecretId);
          }
        } catch (error) {
          console.error('Failed to fetch secret ID:', error);
        } finally {
          setIsLoadingSecretId(false);
        }
      };
      fetchSecretId();
    }
  }, [room._id, room.isPrivate, showCopyButton, secretId, isLoadingSecretId, getRoomSecretId]);

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
      let finalParticipantCount = 0;
      let finalRoomStatus = { hasActiveSession: false, participantCount: 0 };
      
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
          
          // Don't set state immediately - wait for real data or API failure
          console.log('Room created at:', room.createdAt);
          console.log('Database state - isActive:', hasActiveSession);
          console.log('Database state - currentParticipants:', participantCount);
          
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
                
                // Use live data if available, default to false if not specified
                const liveActiveStatus = statusData.hasActiveSession !== undefined 
                  ? statusData.hasActiveSession 
                  : false;
                
                console.log('Live data - participantCount:', statusData.participantCount);
                console.log('Live data - hasActiveSession:', statusData.hasActiveSession);
                console.log('Live data - calculated activeStatus:', liveActiveStatus);
                
                finalParticipantCount = statusData.participantCount;
                finalRoomStatus = {
                  hasActiveSession: liveActiveStatus,
                  participantCount: statusData.participantCount
                };
                
                setLiveParticipantCount(statusData.participantCount);
                setLiveRoomStatus({
                  hasActiveSession: liveActiveStatus,
                  participantCount: statusData.participantCount
                });
              }
            }
          } catch (privateRoomError) {
            console.log('Private room live status not available, using database state');
            console.log('Error details:', (privateRoomError as AxiosError<{ status: number; message: string }>)?.response?.status || (privateRoomError as Error)?.message || privateRoomError);
            // This is expected for private rooms, not an error
            // Use database values as fallback
            finalParticipantCount = participantCount;
            finalRoomStatus = {
              hasActiveSession: hasActiveSession, // Use exact database value
              participantCount
            };
            
            setLiveParticipantCount(participantCount);
            setLiveRoomStatus({
              hasActiveSession: hasActiveSession, // Use exact database value
              participantCount
            });
          }
        } else {
          console.log('--- Public Room Handling ---');
          // Public room - try to use status endpoint, but fallback gracefully if it fails
          try {
            const response = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
            console.log('LiveKit status response:', response.data);
            
            if (response.status === 200) {
              const statusData = response.data;
              finalParticipantCount = statusData.participantCount || 0;
              finalRoomStatus = {
                hasActiveSession: statusData.hasActiveSession || false,
                participantCount: statusData.participantCount || 0
              };
              
              setLiveParticipantCount(statusData.participantCount || 0);
              setLiveRoomStatus({
                hasActiveSession: statusData.hasActiveSession || false,
                participantCount: statusData.participantCount || 0
              });
            }
          } catch (publicRoomError) {
            console.log('Public room status endpoint not available, using database state');
            console.log('Error details:', publicRoomError);
            
            // Use database values as fallback for public rooms too
            const hasActiveSession = room.isActive || false;
            const participantCount = room.currentParticipants || 0;
            
            finalParticipantCount = participantCount;
            finalRoomStatus = {
              hasActiveSession: hasActiveSession, // Use exact database value
              participantCount
            };
            
            // Use database values as fallback for public rooms
            setLiveParticipantCount(participantCount);
            setLiveRoomStatus({
              hasActiveSession: hasActiveSession, // Use exact database value
              participantCount
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
          
          // Use database values as fallback for private rooms
          console.log('Fallback - using database values');
          
          finalParticipantCount = participantCount;
          finalRoomStatus = {
            hasActiveSession: hasActiveSession, // Use exact database value
            participantCount
          };
          
          setLiveParticipantCount(participantCount);
          setLiveRoomStatus({
            hasActiveSession: hasActiveSession, // Use exact database value
            participantCount
          });
        } else {
          // Public room fallback
          finalParticipantCount = 0;
          finalRoomStatus = {
            hasActiveSession: false,
            participantCount: 0
          };
          
          setLiveParticipantCount(0);
          setLiveRoomStatus({
            hasActiveSession: false,
            participantCount: 0
          });
        }
      } finally {
        // setIsLoadingStatus(false); // Mark loading as complete
        console.log('=== RoomCard Status Fetch Complete ===');
        console.log('Final liveParticipantCount:', finalParticipantCount);
        console.log('Final liveRoomStatus:', finalRoomStatus);
      }
    };

    fetchLiveRoomStatus();
    console.log('RoomCard useEffect triggered for room:', room._id);
  }, [room._id, room.isActive, room.isPrivate, room.currentParticipants, room.name, room.maxParticipants, room.createdAt]);

  // Check if current user is the creator of this room
  const isCreator = currentUser?._id === room.createdBy._id;

  return (
    <Card className="dark:border-transparent p-6">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2">
                <div>
                  <Link 
                    href={`/meeting/${room._id}`}
                    className="group flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate">
                      {room.name}
                    </h3>
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <Badge 
                    variant="secondary" 
                    className={
                      liveRoomStatus?.hasActiveSession === true
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                        : !room.isActive 
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    }
                  >
                    {liveRoomStatus?.hasActiveSession === true ? "Live" : (
                      room.isActive ? (
                        'scheduledStartTime' in room && room.scheduledStartTime && new Date(room.scheduledStartTime) > new Date() 
                          ? "Scheduled" 
                          : "Open"
                      ) : "Ended"
                    )}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {room.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {room.isPrivate ? t("private") : t("public")}
                  </Badge>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                {room.description}
              </p>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Image src={room.createdBy.avatar || ""} alt={room.createdBy.firstName || ""} width={20} height={20} className="rounded-full" />
                  <Link href={`/profile/${room.createdBy.username}`} className="text-muted-foreground hover:underline">
                    {room.createdBy.firstName} {room.createdBy.lastName}
                  </Link>
                </div>
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{formatDate(room.createdAt)}</span>
                </span>
                {room.isActive && 'scheduledStartTime' in room && room.scheduledStartTime && new Date(room.scheduledStartTime) > new Date() && (
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{formatDate(room.scheduledStartTime || '')}</span>
                  </span>
                )}
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
            <>

            
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-border/50 pt-4">
            <div className="flex flex-1 sm:flex-none items-center gap-1.5 sm:gap-2">
              <Link href={`/meeting/${room._id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 sm:h-8 text-xs flex-1 sm:flex-none sm:min-w-[80px]"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">View Details</span>
                </Button>
              </Link>
              {/* {showCopyButton && room.isPrivate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (secretId) {
                      try {
                        await navigator.clipboard.writeText(secretId);
                        toast.success("Secret ID copied to clipboard!");
                      } catch (error) {
                        console.error('Failed to copy secret ID:', error);
                        toast.error("Failed to copy secret ID");
                      }
                    }
                  }}
                  disabled={!secretId || isLoadingSecretId}
                  className="h-7 sm:h-8 text-xs flex-1 sm:flex-none sm:min-w-[80px]"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">
                    {isLoadingSecretId ? "Loading..." : secretId ? "Copy Secret ID" : "Loading..."}
                  </span>
                </Button>
              )} */}
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
                disabled={isJoining || isUserInRoom || !!(room.isActive && 'scheduledStartTime' in room && room.scheduledStartTime && new Date(room.scheduledStartTime) > new Date())}
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
            
            {isCreator && showEditDelete && (
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
                  onClick={() => {
                    onDeleteRoom(room);
                  }}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 