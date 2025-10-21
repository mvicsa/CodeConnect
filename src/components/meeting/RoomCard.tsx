"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Edit, Trash2, Calendar, Users, Globe, Lock, ExternalLink, Clock, DollarSign, BadgeDollarSignIcon, Star, CircleX } from "lucide-react";
import { Room as ReduxRoom } from "@/store/slices/meetingSlice";
import { User } from "@/types/user";
import { useTranslations } from "next-intl";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface RoomCardProps {
  room: ReduxRoom;
  onJoinRoom: (room: ReduxRoom) => void;
  onPayAndJoin?: (room: ReduxRoom) => void;
  onEditRoom?: (room: ReduxRoom) => void;
  onDeleteRoom?: (room: ReduxRoom) => void;
  onCancelRoom?: (room: ReduxRoom) => void; // New prop for cancelling rooms
  currentUser?: User;
  isUserInRoom?: boolean;
  showActions?: boolean;
  showRating?: boolean;
  onRateSession?: (room: ReduxRoom) => void; 
  showParticipants?: boolean;
  showJoinButton?: boolean;
  showEditDelete?: boolean;
  isUserInvited?: boolean;
}

export const RoomCard = ({
  room,
  onJoinRoom,
  onPayAndJoin,
  onEditRoom,
  onDeleteRoom,
  onCancelRoom,
  currentUser,
  isUserInRoom = false,
  showActions = true,
  showRating = false,
  showEditDelete = true,
  showParticipants = true,
  showJoinButton = true,
  isUserInvited,
  onRateSession,
}: RoomCardProps) => {
  const t = useTranslations("meeting");
  const [liveParticipantCount, setLiveParticipantCount] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false); // <--- إضافة حالة isJoining المحلية
  const [isRoomPurchased, setIsRoomPurchased] = useState(false);
  const [isFetchingPurchaseStatus, setIsFetchingPurchaseStatus] = useState(false);
  const [liveRoomStatus, setLiveRoomStatus] = useState<{
    hasActiveSession: boolean;
    participantCount: number;
  } | null>(null);

  // Fetch purchase status for this specific room
  useEffect(() => {
    const fetchPurchaseStatus = async () => {
      if (!currentUser?._id || !room._id || !room.isPaid) {
        setIsRoomPurchased(false);
        return;
      }

      try {
        setIsFetchingPurchaseStatus(true);
        const response = await axiosInstance.post('/payment/check-purchase-bulk', {
          roomIds: [room._id]
        });

        if (response.data && response.data.purchasesStatus) {
          setIsRoomPurchased(response.data.purchasesStatus[room._id] || false);
        } else {
          setIsRoomPurchased(false);
        }
      } catch (error) {
        console.error("Failed to fetch room purchase status:", error);
        toast.error(t("Failed to check room purchase status"));
        setIsRoomPurchased(false);
      } finally {
        setIsFetchingPurchaseStatus(false);
      }
    };

    fetchPurchaseStatus();
  }, [currentUser?._id, room._id, room.isPaid, t]);

  // Reset loading state when room changes
  useEffect(() => {
    setLiveParticipantCount(null);
    setLiveRoomStatus(null);
    setIsRoomPurchased(false);
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
        // For private rooms, we need to handle them differently
        if (room.isPrivate) {
          const hasActiveSession = room.isActive || false;
          const participantCount = room.currentParticipants || 0;
          
          try {
            const response = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
            
            if (response.status === 200 && response.data) {
              const statusData = response.data;
              if (statusData.participantCount !== undefined && statusData.participantCount >= 0) {
                const liveActiveStatus = statusData.hasActiveSession !== undefined 
                  ? statusData.hasActiveSession 
                  : false;
                
                setLiveParticipantCount(statusData.participantCount);
                setLiveRoomStatus({
                  hasActiveSession: liveActiveStatus,
                  participantCount: statusData.participantCount
                });
              }
            }
          } catch {
            setLiveParticipantCount(participantCount);
            setLiveRoomStatus({
              hasActiveSession: hasActiveSession,
              participantCount
            });
          }
        } else {
          try {
            const response = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
            
            if (response.status === 200) {
              const statusData = response.data;
              
              setLiveParticipantCount(statusData.participantCount || 0);
              setLiveRoomStatus({
                hasActiveSession: statusData.hasActiveSession || false,
                participantCount: statusData.participantCount || 0
              });
            }
          } catch {
            const hasActiveSession = room.isActive || false;
            const participantCount = room.currentParticipants || 0;
            
            setLiveParticipantCount(participantCount);
            setLiveRoomStatus({
              hasActiveSession: hasActiveSession,
              participantCount
            });
          }
        }
      } catch {
        if (room.isPrivate) {
          const hasActiveSession = room.isActive || false;
          const participantCount = room.currentParticipants || 0;
          
          setLiveParticipantCount(participantCount);
          setLiveRoomStatus({
            hasActiveSession: hasActiveSession,
            participantCount
          });
        } else {
          setLiveParticipantCount(0);
          setLiveRoomStatus({
            hasActiveSession: false,
            participantCount: 0
          });
        }
      }
    };

    fetchLiveRoomStatus();
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
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      liveRoomStatus?.hasActiveSession === true
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : room.cancelledAt // Check for cancellation first
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" // New style for cancelled
                          : !room.isActive
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    }
                  >
                    {liveRoomStatus?.hasActiveSession === true ? "Live" : (
                      room.cancelledAt ? "Cancelled" : ( // Display Cancelled status
                        room.isActive ? (
                          'scheduledStartTime' in room && room.scheduledStartTime && new Date(room.scheduledStartTime) > new Date()
                            ? "Scheduled"
                            : "Open"
                        ) : "Ended"
                      )
                    )}
                  </Badge>
                  {room.isPaid && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-yellow-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                      <DollarSign className="h-3 w-3" />
                      {room.price} {room.currency}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {room.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {room.isPrivate ? t("private") : t("public")}
                  </Badge>
                  {room.maxParticipants && room.maxParticipants > 0 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      <Users className="h-3 w-3 mr-1" />
                      Max: {room.maxParticipants}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                {room.description}
              </p>
              {room.cancelledAt && room.cancellationReason && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed text-orange-600">
                  Cancellation Reason: {room.cancellationReason}
                </p>
              )}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Image src={room.createdBy.avatar || "/user.png"} alt={room.createdBy.firstName || ""} width={20} height={20} className="rounded-full" />
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
                {
                  showParticipants && (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>
                        {/* if maxParticipants is set and is greater than liveParticipantCount, show the maxParticipants */}
                        {room.maxParticipants && room.maxParticipants > 0 && room.maxParticipants > (liveParticipantCount ?? 0) ? (
                          <span className="text-muted-foreground">
                            {liveParticipantCount ?? 0} / {room.maxParticipants} Participants
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {liveParticipantCount ?? 0} Participants
                          </span>
                        )} 
                      </span>
                    </span>
                  )
                } 
                {
                  room.completedPurchasesCount! > 0 && (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <BadgeDollarSignIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>
                        {room.completedPurchasesCount} Participant
                      </span>
                      <div className="*:data-[slot=avatar]:ring-card flex -space-x-2 *:data-[slot=avatar]:ring-2">
                        {
                          room.recentPurchasers?.map((purchaser: User) => (
                            <Avatar className="h-5 w-5" key={purchaser.userId}>
                              <AvatarImage src={purchaser.avatar} alt={purchaser.firstName || ''} />
                              <AvatarFallback>{purchaser.firstName?.charAt(0)}{purchaser.lastName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ))
                        }
                      </div>
                    </span>
                  )
                }
                { !!showRating && !!room.ratingCount && room.ratingCount > 0 && (
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-yellow-400" />
                    <span>
                      <span>{room.averageRating ? room.averageRating.toFixed(1) : '0.0'} Avg.</span>
                      { room.isUserRated && <span> (Your Rating {room.userRating ? room.userRating.toFixed(1) : ''})</span> }
                    </span>
                  </span>
                )}
              </div>
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
                  
                  {showJoinButton && (
                    room.isPaid && onPayAndJoin && !isCreator && !isRoomPurchased ? (
                      <Button
                        size="sm"
                        onClick={async () => {
                          setIsJoining(true);
                          try {
                            await onPayAndJoin?.(room);
                          } catch (error) {
                            toast.error((error as Error).message || "Failed to initiate payment.");
                          } finally {
                            setIsJoining(false);
                          }
                        }}
                        disabled={
                          isJoining || 
                          isUserInRoom || 
                          (room.isPrivate && !isCreator && isUserInvited === false) ||
                          isFetchingPurchaseStatus
                        }
                        className="h-7 sm:h-8 text-xs flex-1 sm:flex-none sm:min-w-[80px] bg-green-600 hover:bg-green-700"
                      >
                        {(isJoining || isFetchingPurchaseStatus) ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                            <span className="hidden sm:inline ml-1">Processing...</span>
                          </>
                        ) : (
                          <>
                            <BadgeDollarSignIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>
                              Pay Now ({room.price} {room.currency})
                            </span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={async () => {
                          setIsJoining(true);
                          try {
                            await onJoinRoom(room);
                          } catch (error) {
                            toast.error((error as Error).message);
                          } finally {
                            setIsJoining(false);
                          }
                        }}
                        disabled={
                          isJoining || 
                          isUserInRoom || 
                          (room.isPrivate && !isCreator && isUserInvited === false) || 
                          !!(room.isActive && 'scheduledStartTime' in room && room.scheduledStartTime && new Date(room.scheduledStartTime) > new Date()) ||
                          isFetchingPurchaseStatus
                        }
                        className="h-7 sm:h-8 text-xs flex-1 sm:flex-none sm:min-w-[80px]"
                      >
                        {(isJoining || isFetchingPurchaseStatus) ? (
                          <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        <span className="hidden sm:inline ms-1">
                          {(isJoining || isFetchingPurchaseStatus) ? "Processing..." : isUserInRoom ? "Already in Room" : t("join")}
                        </span>
                      </Button>
                    )
                  )}

                  {!room.isActive && !room.cancelledAt && !room.isUserRated && onRateSession && currentUser?._id !== room.createdBy._id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRateSession(room)}
                      className="h-7 sm:h-8 text-xs"
                    >
                      <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline ms-1">Rate Session</span>
                    </Button>
                  )}
                </div>
                
                {isCreator && showEditDelete && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {onEditRoom && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEditRoom(room)}
                        className="h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                    
                    {/* Conditional Cancel/Delete Button */}
                    {onDeleteRoom && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          if (room.completedPurchasesCount && room.completedPurchasesCount > 0 && onCancelRoom) {
                            onCancelRoom(room);
                          } else if (onDeleteRoom) {
                            onDeleteRoom(room);
                          }
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8"
                      >
                        {
                          room.completedPurchasesCount! > 0 ? <CircleX className="h-3 w-3 sm:h-4 sm:w-4" /> : <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        }
                        <span className="sr-only">{room.isPaid ? "Cancel Room" : "Delete Room"}</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {room.isPrivate && !isCreator && isUserInvited === false && (
            <p className="text-sm text-red-500">You are not invited to this private session.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};