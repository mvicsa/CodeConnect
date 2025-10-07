"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Video, 
  Users, 
  Calendar, 
  Clock, 
  Lock, 
  Globe,
  Edit,
  Trash2,
  UserPlus,
  Share2,
  Home,
  X,
  Play,
  StopCircle,
  Star
} from "lucide-react";
import { toast } from "sonner";
import Container from "@/components/Container";
import { Room, PublicSession, updateRoom, deleteRoom, fetchPublicSessions } from "@/store/slices/meetingSlice";
import { User } from "@/types/user";
import axiosInstance from "@/lib/axios";
import { RoomDialog } from "./RoomDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import Link from "next/link";
import { fetchFollowing } from '@/store/slices/followSlice';
import { formatDate } from "date-fns";
import { VideoConferenceComponent } from "./VideoConference";
import { MeetingLifecycleManager, useMeetingLifecycle } from "./MeetingLifecycleManager";
import { MeetingRatings } from "./MeetingRatings";
import { MeetingCountdown } from "./MeetingCountdown";
import { SessionRatingDialog } from '@/components/rating';
import { ratingService } from '@/services/ratingService';


interface MeetingDetailsClientProps {
  meetingId: string;
}

// Separate component for video conference that can use the hook
const VideoConferenceWrapper = ({ 
  isInVideoCall, 
  videoToken, 
  currentRoom, 
  onDisconnect, 
  onEndSession, 
  currentUser 
}: {
  isInVideoCall: boolean;
  videoToken: string | null;
  currentRoom: Room | null;
  onDisconnect: () => void;
  onEndSession: () => Promise<void>;
  currentUser: User | null;
}) => {
  // const { handleEndSessionWithRating: endSessionWithRating, handleDisconnectWithRating: disconnectWithRating } = useMeetingLifecycle();

  // No need for handleDisconnect here - VideoConferenceComponent will call onDisconnect directly

  // No need for handleEndSession here - VideoConferenceComponent will call onEndSession directly

  if (!isInVideoCall || !videoToken || !currentRoom) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <VideoConferenceComponent
        token={videoToken}
        currentRoom={currentRoom}
        onDisconnect={onDisconnect}
        onEndSession={onEndSession}
        currentUser={currentUser}
      />
      {/* Close button for non-creators */}
      {currentRoom.createdBy?._id !== currentUser?._id && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
          onClick={onDisconnect}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// Component to connect the ref with the context
const ContextConnector = ({ 
  children, 
  checkRatingDialogRef,
  lifecycleManagerRef
}: { 
  children: React.ReactNode;
  checkRatingDialogRef: React.RefObject<((roomId: string) => Promise<void>) | null>;
  lifecycleManagerRef: React.RefObject<{
    forceRefreshRoomData: (roomId: string) => Promise<void>;
    handleParticipantLeave: (room: Room) => Promise<void>;
  } | null>;
}) => {
  const { 
    checkAndShowRatingDialog, 
    forceRefreshRoomData,
    handleParticipantLeave 
  } = useMeetingLifecycle();
  
  useEffect(() => {
    checkRatingDialogRef.current = checkAndShowRatingDialog;
    lifecycleManagerRef.current = {
      forceRefreshRoomData,
      handleParticipantLeave
    };
  }, [checkAndShowRatingDialog, forceRefreshRoomData, handleParticipantLeave, checkRatingDialogRef, lifecycleManagerRef]);
  
  return <>{children}</>;
};

export const MeetingDetailsClient = ({ meetingId }: MeetingDetailsClientProps) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: followedUsers } = useSelector((state: RootState) => state.follow.following);
  
  // Get meeting data from Redux store for automatic updates
  const rooms = useSelector((state: RootState) => state.meeting.rooms);
  
  const [meeting, setMeeting] = useState<Room | PublicSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomStatus, setRoomStatus] = useState<{
    hasActiveSession: boolean;
    participantCount: number;
    joinCount?: number;
    totalTimeSpent?: number;
    duration?: number;
    lastJoined?: string;
  } | null>(null);
  const [meetingSessionHistory, setMeetingSessionHistory] = useState<{
    joinCount: number;
    totalTimeSpent: number;
    duration: number;
  } | null>(null);
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  // Rating Dialog state
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratedSessions, setRatedSessions] = useState<Set<string>>(new Set());
  
  // New state for video conference
  const [isInVideoCall, setIsInVideoCall] = useState(false);
  const [videoToken, setVideoToken] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  // Add flag to prevent infinite loading after session ends
  const [sessionEnded, setSessionEnded] = useState(false);

  // Add state to force re-renders when meeting data changes
  const [dataVersion, setDataVersion] = useState(0);

  // Ref to access the checkAndShowRatingDialog function from context
  const checkRatingDialogRef = useRef<((roomId: string) => Promise<void>) | null>(null);

  // Add ref to access MeetingLifecycleManager functions
  const lifecycleManagerRef = useRef<{
    forceRefreshRoomData: (roomId: string) => Promise<void>;
    handleParticipantLeave: (room: Room) => Promise<void>;
  } | null>(null);

  // Remove the hook call from here - it will be used in a child component

  // Function to safely update meeting data without affecting UI state
  const safeUpdateMeetingData = useCallback((newData: Partial<Room | PublicSession>) => {
    setMeeting(prevMeeting => {
      if (!prevMeeting) return newData as Room | PublicSession;
      
      // Preserve all existing properties and only update what's changed
      const updatedMeeting = { ...prevMeeting };
      
      // Only update properties that are actually different
      Object.keys(newData).forEach(key => {
        const typedKey = key as keyof (Room | PublicSession);
        if (newData[typedKey] !== prevMeeting[typedKey]) {
          (updatedMeeting as Record<string, unknown>)[typedKey] = newData[typedKey];
        }
      });
      
      return updatedMeeting;
    });
  }, []);

  // Function to refresh essential data after session ends (without causing infinite loops)
  const refreshEssentialDataAfterSessionEnd = useCallback(async () => {
    if (!meeting || sessionEnded) return;
    
    try {
      // Fetch updated meeting data to get all the latest fields
      const roomResponse = await axiosInstance.get(`/livekit/rooms/${meeting._id}`);
      if (roomResponse.data) {
        // Update meeting object with fresh data (preserving UI state)
        setMeeting(prevMeeting => {
          if (!prevMeeting) return roomResponse.data;
          
          const updatedMeeting = {
            ...prevMeeting,
            ...roomResponse.data,
            // Ensure these critical fields are updated
            isActive: false,
            endedDate: roomResponse.data.endedDate || new Date().toISOString(),
            currentParticipants: roomResponse.data.currentParticipants || 0,
            totalParticipantsJoined: roomResponse.data.totalParticipantsJoined || prevMeeting.totalParticipantsJoined || 0,
            createdAt: roomResponse.data.createdAt || prevMeeting.createdAt
          };
          
          // Only add actualStartTime if it exists in the response (Room type)
          if ('actualStartTime' in roomResponse.data && roomResponse.data.actualStartTime) {
            (updatedMeeting as Room).actualStartTime = roomResponse.data.actualStartTime;
          }
          
          return updatedMeeting;
        });
        
        // Force re-render to update UI immediately
        setDataVersion(prev => prev + 1);
      }
      
      // Only fetch essential data that might have changed
      const statusResponse = await axiosInstance.get(`/livekit/rooms/${meeting._id}/status`);
      if (statusResponse.data) {
        setRoomStatus(prevStatus => {
          if (!prevStatus) return statusResponse.data;
          return {
            ...prevStatus,
            ...statusResponse.data,
            hasActiveSession: false, // Ensure this stays false
            participantCount: 0 // Ensure this stays 0
          };
        });
      }
      
      // Update session history if available
      try {
        const historyResponse = await axiosInstance.get(`/livekit/rooms/my-session-history`);
        if (historyResponse.data?.mySessionHistory) {
          const sessionData = historyResponse.data.mySessionHistory.find(
            (session: { roomId: string }) => session.roomId === meeting._id
          );
          if (sessionData) {
            setMeetingSessionHistory({
              joinCount: sessionData.joinCount || 0,
              totalTimeSpent: sessionData.totalTimeSpent || 0,
              duration: sessionData.duration || 0
            });
          }
        }
      } catch {
        toast.error('No session history available for this meeting');
      }
      
    } catch {
      toast.error('Failed to refresh essential data after session end');
    }
  }, [meeting, sessionEnded]);

  const fetchMeetingDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch as a room first
      const roomResponse = await axiosInstance.get(`/livekit/rooms/${meetingId}`);
      if (roomResponse.data) {
        setMeeting(prevMeeting => {
          // Only set loading to false if this is the initial fetch
          if (!prevMeeting) {
            return roomResponse.data;
          } else {
            // For subsequent fetches, merge data to preserve UI state
            return { ...prevMeeting, ...roomResponse.data };
          }
        });
        
        // Fetch room status
        const statusResponse = await axiosInstance.get(`/livekit/rooms/${meetingId}/status`);
        setRoomStatus(statusResponse.data);
        
        // Fetch session history to get total participant count
        try {
          const historyResponse = await axiosInstance.get(`/livekit/rooms/my-session-history`);
          if (historyResponse.data?.mySessionHistory) {
            const sessionData = historyResponse.data.mySessionHistory.find(
              (session: { roomId: string }) => session.roomId === meetingId
            );
            if (sessionData) {
              setMeetingSessionHistory({
                joinCount: sessionData.joinCount || 0,
                totalTimeSpent: sessionData.totalTimeSpent || 0,
                duration: sessionData.duration || 0
              });
            }
          }
        } catch {
          toast.error('No session history available for this meeting');
        }
        
        return;
      }
    } catch {
      // If not a room, try to fetch as public session
      try {
        const sessionResponse = await axiosInstance.get(`/livekit/rooms/${meetingId}/status`);
        if (sessionResponse.data) {
          setMeeting(prevMeeting => {
            if (!prevMeeting) {
              return sessionResponse.data;
            } else {
              // For subsequent fetches, merge data to preserve UI state
              return { ...prevMeeting, ...sessionResponse.data };
            }
          });
          setRoomStatus(sessionResponse.data);
          return;
        }
      } catch {
        setError("Meeting not found");
      }
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    if (meetingId) {
      fetchMeetingDetails();
    }
  }, [meetingId, fetchMeetingDetails]);

  // Check if user should see rating dialog when entering the page
  useEffect(() => {
    if (meeting && user) {
      // Check if this is a room (not public session) and if user is a participant
      if ('createdBy' in meeting && meeting.createdBy?._id !== user._id) {
        // Check for rating dialog immediately when context is ready
        if (checkRatingDialogRef.current) {
          checkRatingDialogRef.current(meeting._id);
        }
      }
    }
  }, [meeting, user]);

  // Load rated sessions from backend when component mounts
  useEffect(() => {
    if (user?._id) {
      const loadRatedSessions = async () => {
        try {
          const response = await ratingService.getMySubmittedRatings(1, 1000); // Get all submitted ratings
          const ratedSessionIds = response.ratings.map(rating => rating.sessionId);
          setRatedSessions(new Set(ratedSessionIds));
        } catch {
          toast.error('Failed to fetch rated sessions:');
        }
      };
      loadRatedSessions();
    }
  }, [user?._id]);

  // Add effect to refresh data when session state changes
  useEffect(() => {
    if (meeting && roomStatus) {
      // Only refresh if there's a significant state change and session is still active
      if (!roomStatus.hasActiveSession && meeting.isActive && roomStatus.participantCount > 0) {
        // Update local state without making API calls
        setMeeting(prevMeeting => {
          if (!prevMeeting) return meeting;
          
          const updatedMeeting = {
            ...prevMeeting,
            isActive: false,
            endedDate: new Date().toISOString(),
            currentParticipants: 0
          };
          
          // Add actualStartTime if it doesn't exist yet
          if (!('actualStartTime' in prevMeeting) || !prevMeeting.actualStartTime) {
            (updatedMeeting as Room).actualStartTime = new Date().toISOString();
          }
          
          return updatedMeeting;
        });
        
        setRoomStatus(prevStatus => {
          if (!prevStatus) return prevStatus;
          return {
            ...prevStatus,
            hasActiveSession: false,
            participantCount: 0
          };
        });
        
        // Set session ended flag to prevent further updates
        setSessionEnded(true);
        
        // Refresh essential data immediately to ensure consistency
        refreshEssentialDataAfterSessionEnd();
      }
    }
  }, [roomStatus?.hasActiveSession, meeting?.isActive, roomStatus?.participantCount, refreshEssentialDataAfterSessionEnd, meeting, roomStatus]);

  // Add effect to automatically update meeting data when Redux store changes
  useEffect(() => {
    if (rooms && meeting && !sessionEnded) {
      // Find the updated meeting in the rooms array
      const updatedRoom = rooms.find(room => room._id === meeting._id);
      if (updatedRoom && updatedRoom !== meeting) {
        // Only update if there are meaningful changes that don't affect UI state
        const hasSignificantChanges = 
          meeting.isActive !== updatedRoom.isActive ||
          meeting.name !== updatedRoom.name ||
          meeting.description !== updatedRoom.description ||
          meeting.isPrivate !== updatedRoom.isPrivate;
        
        if (hasSignificantChanges) {
          // Merge the updated data to preserve UI state
          safeUpdateMeetingData(updatedRoom);
          
          // Only refresh room status if the meeting state changed significantly and session is still active
          if (meeting.isActive !== updatedRoom.isActive && updatedRoom.isActive) {
            // Use targeted refresh to avoid affecting UI
            const refreshStatus = async () => {
              try {
                const statusResponse = await axiosInstance.get(`/livekit/rooms/${meeting._id}/status`);
                if (statusResponse.data) {
                  setRoomStatus(statusResponse.data);
                }
              } catch {
                toast.error('Error refreshing room status');
              }
            };
            refreshStatus();
          }
        }
      }
    }
  }, [rooms, meeting, safeUpdateMeetingData, sessionEnded]);

  // Function to handle external session end events
  // const handleExternalSessionEnd = async () => {
  //   console.log('MeetingDetailsClient: External session end detected, refreshing data');
  //   try {
  //     // Force refresh using lifecycle manager if available
  //     if (lifecycleManagerRef.current?.forceRefreshRoomData && meeting) {
  //       await lifecycleManagerRef.current.forceRefreshRoomData(meeting._id);
  //     }
      
  //     // Refresh local data without affecting UI state
  //     const roomResponse = await axiosInstance.get(`/livekit/rooms/${meetingId}`);
  //     if (roomResponse.data) {
  //       // Use safe update to preserve UI state
  //       safeUpdateMeetingData(roomResponse.data);
  //     }
      
  //     // Update room status
  //     const statusResponse = await axiosInstance.get(`/livekit/rooms/${meetingId}/status`);
  //     if (statusResponse.data) {
  //       setRoomStatus(statusResponse.data);
  //     }
      
  //     // Show notification to user
  //     toast.info("Session has ended");
  //   } catch (error) {
  //     console.error('MeetingDetailsClient: Error handling external session end', error);
  //   }
  // };

  
  const meetingTotalParticipants = meeting?.totalParticipantsJoined;
  const meetingCurrentParticipants = meeting?.currentParticipants;
  const roomStatusParticipantCount = roomStatus?.participantCount;
  const roomStatusHasActiveSession = roomStatus?.hasActiveSession;

  const computedValues = useMemo(() => {
    if (!meeting) return {};
    
    const isOwner = 'createdBy' in meeting && meeting.createdBy?._id === user?._id;
    const isPrivate = meeting.isPrivate;
    const isInvited = 'invitedUsers' in meeting && 
      meeting.invitedUsers?.some((invitedUser: User) => invitedUser._id === user?._id);
    const isActive = roomStatusHasActiveSession || meeting?.isActive;
    const hasEnded = !meeting?.isActive && !roomStatusHasActiveSession;
    const canEdit = isOwner && !hasEnded;
    
    // Use actual participant count from roomStatus, fallback to meeting data
    const actualParticipantCount = roomStatusParticipantCount ?? meetingCurrentParticipants ?? 0;
    const totalParticipantsJoined = meetingTotalParticipants ?? actualParticipantCount;
    
    return {
      isOwner,
      isPrivate,
      isInvited,
      isActive,
      hasEnded,
      canEdit,
      actualParticipantCount: actualParticipantCount || 0,
      totalParticipantsJoined: totalParticipantsJoined || 0
    };
  }, [
    meeting, 
    user?._id, 
    roomStatusHasActiveSession, 
    roomStatusParticipantCount,
    meetingTotalParticipants,
    meetingCurrentParticipants
  ]);

  // const endedDate = meeting && 'endedDate' in meeting ? meeting.endedDate : undefined

  // Force re-computation when meeting data changes significantly
  // useEffect(() => {
  //   if (meeting) {
  //     toast.error('Meeting data changed, forcing re-computation');
  //   }
  // }, [
  //   meeting,
  //   meeting?.isActive,
  //   meeting?.currentParticipants,
  //   meeting?.totalParticipantsJoined,
  //   endedDate
  // ]);

  // Fetch followed users for suggestions
  useEffect(() => {
    const fetchFollowedUsers = async () => {
      try {
        if (user?._id) {
          const response = await axiosInstance.get(`/users/${user._id}/following`);

          if (response.status === 200) {
            const followedUsersData = response.data;
            
            dispatch(fetchFollowing.fulfilled({ 
              items: followedUsersData, 
              limit: followedUsersData.length, 
              skip: 0 
            }, 'fetchFollowing/fulfilled', { userId: user._id }));
          } else {
            toast.error('Failed to fetch followed users');
          }
        }
      } catch {
        toast.error("Error fetching followed users");
      }
    };
    
    fetchFollowedUsers();
  }, [user?._id, dispatch]);

  const handleCopyLink = async () => {
    if (!meeting) return;
    
    const baseUrl = window.location.origin;
    const meetingUrl = `${baseUrl}/meeting/${meetingId}`;
    
    try {
      await navigator.clipboard.writeText(meetingUrl);
      toast.success("Meeting link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // const handleCopySecretId = async () => {
  //   if (!meeting || !isPrivate) return;
    
  //   try {
  //     // Get the secret ID from the API
  //     const response = await axiosInstance.get(`/livekit/rooms/${meeting._id}/secret-id`);
  //     if (response.data?.secretId) {
  //       await navigator.clipboard.writeText(response.data.secretId);
  //       toast.success("Secret ID copied to clipboard!");
  //     } else {
  //       toast.error("Failed to get secret ID");
  //     }
  //   } catch (error) {
  //     console.error("Error getting secret ID:", error);
  //     toast.error("Failed to get secret ID");
  //   }
  // };

  const handleEditRoom = () => {
    if (!meeting) return;
    
    if ('createdBy' in meeting && meeting.createdBy?._id === user?._id) {
      setEditingRoom(meeting as Room);
      setShowEditDialog(true);
    } else {
      toast.error('Cannot edit room');
    }
  };

  const handleDeleteRoom = () => {
    setShowDeleteDialog(true);
  };

  const handleJoinMeeting = async () => {
    if (!meeting) return;

    try {
      setIsJoining(true);
      // Check if user is creator or invited user
      const isCreator = meeting && 'createdBy' in meeting && meeting.createdBy?._id === user?._id;
      const isInvited = meeting && 'invitedUsers' in meeting && 
        meeting.invitedUsers?.some((invitedUser: User) => invitedUser._id === user?._id);
      
      if (meeting.isPrivate === true) {
        // For private rooms, check if user is creator or invited
        if (isCreator || isInvited) {
          // User is authorized - join directly
          const roomResponse = await axiosInstance.get(`/livekit/rooms/${meeting._id}`);
          if (roomResponse.data) {
            // Get token directly for authorized users
            const tokenResponse = await axiosInstance.get(`/livekit/token/room?roomId=${meeting._id}`);
            if (tokenResponse.data?.token) {
              // Set video call state instead of redirecting
              setVideoToken(tokenResponse.data.token);
              setCurrentRoom(roomResponse.data);
              setIsInVideoCall(true);
              setIsJoining(false);
              toast.success("Successfully joined the meeting!");
              return;
            } else {
              toast.error("Failed to get access token");
            }
          }
        } else {
          // User is not authorized
          toast.error("You need an invitation to join this private meeting");
        }
      } else {
        // Public session - join directly
        const roomResponse = await axiosInstance.get(`/livekit/rooms/join-public/${meeting._id}`);
        if (roomResponse.data) {
          const tokenResponse = await axiosInstance.get(`/livekit/token/room?roomId=${meeting._id}`);
          if (tokenResponse.data?.token) {
            // Set video call state instead of redirecting
            setVideoToken(tokenResponse.data.token);
            setCurrentRoom(roomResponse.data);
            setIsInVideoCall(true);
            setIsJoining(false);
            toast.success("Successfully joined the public session!");
            return;
          } else {
            toast.error("Failed to get access token for public session");
          }
        }
      }
      
      // Only stop loading if we didn't successfully join
      setIsJoining(false);
    } catch (error) {
      toast.error((error as Error).message || "Failed to join meeting");
      setIsJoining(false);
    }
  };

  // Video conference functions - Update UI immediately
  const handleDisconnect = async () => {
    // Store currentRoom before clearing it
    const roomToLeave = currentRoom;
    
    // Immediately update UI state for fast response
    setIsInVideoCall(false);
    setVideoToken(null);
    setCurrentRoom(null);
    
    // Show disconnect message immediately
    toast.info("Disconnected from meeting");
    
    // Fetch fresh data from database after disconnect
    fetchMeetingDetails();
    
    // Handle lifecycle management in background (non-blocking)
    if (roomToLeave && lifecycleManagerRef.current?.handleParticipantLeave) {
      // Don't await this - let it run in background
      lifecycleManagerRef.current.handleParticipantLeave(roomToLeave).catch(() => {
        toast.error('Error in background participant leave handling:');
      });
    }
  };

  // Session ending - Update UI immediately and database
  const handleEndSession = async () => {
    if (!currentRoom) return;
    
    try {
      // Set session ended flag to prevent infinite loading
      setSessionEnded(true);
      
      // Immediately update local state for fast response
      setIsInVideoCall(false);
      setVideoToken(null);
      setCurrentRoom(null);
      
      // Immediately update meeting state to show as ended
      if (meeting) {
        setMeeting(prevMeeting => {
          if (!prevMeeting) return meeting;
          
          const updatedMeeting = {
            ...prevMeeting,
            isActive: false,
            endedDate: new Date().toISOString(),
            currentParticipants: 0, // Reset current participants
            totalParticipantsJoined: prevMeeting.totalParticipantsJoined || 0 // Keep total joined
          };
          
          // Add actualStartTime if it doesn't exist yet (for first-time sessions)
          if (!('actualStartTime' in prevMeeting) || !prevMeeting.actualStartTime) {
            (updatedMeeting as Room).actualStartTime = new Date().toISOString();
          }
          
          return updatedMeeting;
        });
        
        // Also update room status immediately with comprehensive data
        setRoomStatus(prevStatus => {
          if (!prevStatus) return prevStatus;
          return {
            ...prevStatus,
            hasActiveSession: false,
            participantCount: 0,
            joinCount: prevStatus.joinCount || 0,
            totalTimeSpent: prevStatus.totalTimeSpent || 0,
            duration: prevStatus.duration || 0,
            lastJoined: prevStatus.lastJoined || undefined
          };
        });
        
        // Force re-render to update UI immediately
        setDataVersion(prev => prev + 1);
      }
      
      // Update session history if available
      if (meetingSessionHistory) {
        setMeetingSessionHistory(prevHistory => {
          if (!prevHistory) return prevHistory;
          return {
            ...prevHistory,
            joinCount: prevHistory.joinCount || 0,
            totalTimeSpent: prevHistory.totalTimeSpent || 0,
            duration: prevHistory.duration || 0
          };
        });
      }
      
      // Send API request to end session in database
      try {
        const response = await axiosInstance.post(`/livekit/rooms/${currentRoom._id}/end-session`);
        
        // Update additional data from API response if available
        if (response.data) {
          // Update any additional fields returned from the API
          if (response.data.totalParticipantsJoined !== undefined) {
            setMeeting(prevMeeting => ({
              ...prevMeeting!,
              totalParticipantsJoined: response.data.totalParticipantsJoined
            }));
          }
          
          if (response.data.totalTimeSpent !== undefined) {
            setRoomStatus(prevStatus => ({
              ...prevStatus!,
              totalTimeSpent: response.data.totalTimeSpent
            }));
          }
        }
        
        // Refresh essential data immediately after API success (no need for setTimeout)
        refreshEssentialDataAfterSessionEnd();
        
        // Don't call fetchMeetingDetails here to avoid infinite loop
        // The local state is already updated above
      } catch {
        toast.error("Failed to end session in database");
      }
      
    } catch {
      toast.error("Failed to update local state");
    }
  };

  // Function to manually refresh meeting data
  // const refreshMeetingData = async () => {
  //   console.log('MeetingDetailsClient: Manual refresh triggered');
  //   try {
  //     // Only refresh the data, don't trigger full component re-render
  //     const roomResponse = await axiosInstance.get(`/livekit/rooms/${meetingId}`);
  //     if (roomResponse.data) {
  //       // Use safe update to preserve UI state
  //       safeUpdateMeetingData(roomResponse.data);
  //     }
      
  //     // Update room status separately
  //     const statusResponse = await axiosInstance.get(`/livekit/rooms/${meetingId}/status`);
  //     if (statusResponse.data) {
  //       setRoomStatus(statusResponse.data);
  //     }
      
  //     // Also use lifecycle manager if available, but only for data refresh
  //     if (lifecycleManagerRef.current?.forceRefreshRoomData && meeting) {
  //       console.log('MeetingDetailsClient: Using lifecycle manager for additional refresh');
  //       // Don't await this to avoid blocking
  //       lifecycleManagerRef.current.forceRefreshRoomData(meeting._id).catch(error => {
  //         console.error('Error in lifecycle manager refresh:', error);
  //       });
  //     }
  //   } catch (error) {
  //     console.error('MeetingDetailsClient: Error during manual refresh', error);
  //   }
  // };

  // Lightweight refresh function for disconnection scenarios
  // Only fetches essential data (room status) to avoid blocking UI updates
  // const quickRefreshMeetingData = async () => {
  //   console.log('MeetingDetailsClient: Quick refresh triggered for disconnection');
  //   try {
  //     // Only refresh essential data for fast response
  //     const statusResponse = await axiosInstance.get(`/livekit/rooms/${meetingId}/status`);
  //     if (statusResponse.data) {
  //       setRoomStatus(statusResponse.data);
  //     }
  //   } catch (error) {
  //     console.error('MeetingDetailsClient: Error during quick refresh', error);
  //   }
  // };

  const { isOwner, isPrivate, isInvited, isActive, canEdit } = computedValues;

  // Function to format time duration in milliseconds
  // const formatDuration = (milliseconds: number) => {
  //   const seconds = Math.floor(milliseconds / 1000);
  //   const minutes = Math.floor(seconds / 60);
  //   const hours = Math.floor(minutes / 60);
    
  //   if (hours > 0) {
  //     return `${hours}h ${minutes % 60}m`;
  //   } else if (minutes > 0) {
  //     return `${minutes}m ${seconds % 60}s`;
  //   } else {
  //     return `${seconds}s`;
  //   }
  // };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading meeting details...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !meeting) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Meeting Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || "The meeting you're looking for doesn't exist."}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push("/meeting")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button variant="outline" asChild>
                <Link href="/meeting">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Meetings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <MeetingLifecycleManager currentUser={user} onRatingSubmitted={(sessionId) => {
      // Update local state when rating is submitted from lifecycle manager
      if (user?._id) {
        const newRatedSessions = new Set([...ratedSessions, sessionId]);
        setRatedSessions(newRatedSessions);
        
        // Refresh meeting details to show the updated rating
        fetchMeetingDetails();
      }
    }}>
      <ContextConnector checkRatingDialogRef={checkRatingDialogRef} lifecycleManagerRef={lifecycleManagerRef}>
        <>
          {/* Video Conference Overlay */}
          {isInVideoCall && videoToken && currentRoom && (
            <VideoConferenceWrapper
              isInVideoCall={isInVideoCall}
              videoToken={videoToken}
              currentRoom={currentRoom}
              onDisconnect={handleDisconnect}
              onEndSession={handleEndSession}
              currentUser={user}
            />
          )}

        <Container>
          <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center flex-wrap gap-3 justify-between mb-6">
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/meeting")}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Session Details</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  View session details
                </p>
              </div>
            </div>
            
            
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                    <Button
                     variant="outline"
                     onClick={handleEditRoom}
                     disabled={isUpdating}
                     className="flex items-center gap-2"
                   >
                     <Edit className="w-4 h-4" />
                     <span className="hidden sm:inline">{isUpdating ? "Updating..." : "Edit"}</span>
                   </Button>
                  <Button
                     variant="destructive"
                     onClick={handleDeleteRoom}
                     disabled={isDeleting}
                     className="flex items-center gap-2"
                   >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{isDeleting ? "Deleting..." : "Delete"}</span>
                   </Button>
                </>
              )}
              {/* {isOwner && !isActive && (
                <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
                  Session ended - editing not available
                </div>
              )} */}
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              {/* Copy Secret ID button - only for private rooms owned by the user */}
              {/* {isOwner && isPrivate && (
                <Button
                  variant="outline"
                  onClick={handleCopySecretId}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy Secret ID</span>
                </Button>
              )} */}
            </div>
          </div>

          {/* Meeting Details Card */}
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start flex-wrap justify-between gap-2 mb-2">
                    <CardTitle className="text-2xl">{meeting.name}</CardTitle>
                    {/* State like RoomCard: Live, Open, or Ended with same colors */}
                    <div className="flex items-center flex-wrap gap-2">
                      <Badge 
                        variant="secondary" 
                        className={
                          roomStatus?.hasActiveSession 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                            : !meeting?.isActive 
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
                              : 'scheduledStartTime' in meeting && meeting.scheduledStartTime && new Date(meeting.scheduledStartTime) > new Date()
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        }
                      >
                        {roomStatus?.hasActiveSession 
                          ? "Live" 
                          : !meeting?.isActive 
                            ? "Ended" 
                            : 'scheduledStartTime' in meeting && meeting.scheduledStartTime && new Date(meeting.scheduledStartTime) > new Date()
                              ? "Scheduled"
                              : (meeting?.isActive ? "Open" : "Ended")}
                      </Badge>
                      <Badge variant="outline">
                        {isPrivate ? (
                          <>
                            <Lock className="w-3 h-3 me-1" />
                            Private
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3 me-1" />
                            Public
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-lg">{meeting.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Created At</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(meeting.createdAt, 'MMM d, yyyy, h:mm a')}
                    </p>
                  </div>
                </div>
                
                {/* Meeting Time Information */}
                {'scheduledStartTime' in meeting && meeting.scheduledStartTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Scheduled Start</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(meeting.scheduledStartTime), 'MMM d, yyyy, h:mm a')}
                        {/* Countdown for scheduled meetings */}
                        
                      </p>
                    </div>
                  </div>
                )}
                
                {'actualStartTime' in meeting && meeting.actualStartTime && (
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Actual Start</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(meeting.actualStartTime), 'MMM d, yyyy, h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
                
                {'endedDate' in meeting && meeting.endedDate && (
                  <div className="flex items-center gap-3">
                    <StopCircle className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Ended At</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(meeting.endedDate), 'MMM d, yyyy, h:mm a')}
                      </p>
                    </div>
                  </div>
                )}


                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Participants</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          Current: {computedValues.actualParticipantCount}
                        </span>
                        {('totalParticipantsJoined' in meeting && meeting.totalParticipantsJoined) ? (
                          <span className="flex items-center gap-1">
                            Total Joined: {computedValues.totalParticipantsJoined}
                          </span>
                        ) : meetingSessionHistory?.joinCount ? (
                          <span className="flex items-center gap-1">
                            Total Joined: {meetingSessionHistory.joinCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* <div className="flex items-center gap-3">
                   <UserCheck className="w-5 h-5 text-muted-foreground" />
                   <div>
                     <p className="font-medium">Max Participants</p>
                     <p className="text-sm text-muted-foreground">
                       {meeting.maxParticipants}
                     </p>
                   </div>
                 </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Sesstion Start In */}
          {meeting.isActive && 'scheduledStartTime' in meeting && meeting.scheduledStartTime && new Date(meeting.scheduledStartTime) > new Date() && (
            <Card className="mb-4">
              <CardContent>
                <MeetingCountdown 
                  scheduledStartTime={meeting.scheduledStartTime} 
                  onCountdownComplete={() => {
                    // Force re-render to update button state
                    setDataVersion(prev => prev + 1);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Creator Info & Join Button Card */}
          <Card className="mb-4">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
                {/* Creator Info */}
                <div className="space-y-4">
                  {meeting.createdBy && (
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={meeting.createdBy.avatar} />
                        <AvatarFallback>
                          {meeting.createdBy.firstName?.[0]}{meeting.createdBy.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Created by</p>
                        <p className="text-sm text-muted-foreground">
                          <Link href={`/profile/${meeting.createdBy.username}`} className="hover:underline">
                            {meeting.createdBy.firstName} {meeting.createdBy.lastName}
                          </Link>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Join Button - Only show for creator, invited users, or public meetings */}
                <div className="space-y-4">
                  {/* Rating Button for ended meetings - only show for participants (not the creator) */}
                  {!isActive && !isOwner && (isInvited || !isPrivate) ? (
                    <>
                      <Button
                        onClick={() => setShowRatingDialog(true)}
                        variant="outline"
                        className="w-full flex items-center gap-2 mb-0"
                        disabled={ratedSessions.has(meeting._id)}
                      >
                        <Star className={`w-4 h-4 ${ratedSessions.has(meeting._id) ? 'text-muted-foreground' : ''}`} />
                        {ratedSessions.has(meeting._id) ? 'Already Rated' : 'Rate Session'}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {ratedSessions.has(meeting._id)
                          ? 'You have already rated this session'
                          : 'This meeting has ended and you can rate the session'
                        }
                      </p>
                    </>
                  ) : (
                    (isOwner || isInvited || !isPrivate) && (
                    <div>
                      <Button
                        onClick={handleJoinMeeting}
                        className="w-full flex items-center gap-2"
                        disabled={
                          !computedValues.isActive || 
                          isJoining || 
                          (Boolean('scheduledStartTime' in meeting && 
                           meeting.scheduledStartTime && 
                           new Date(meeting.scheduledStartTime) > new Date()))
                        }
                      >
                        {isJoining ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Joining...
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4" />
                            {computedValues.isActive 
                              ? "Join Meeting" 
                              : 'scheduledStartTime' in meeting && meeting.scheduledStartTime && new Date(meeting.scheduledStartTime) > new Date()
                                ? "Join Scheduled Meeting"
                                : "Meeting Ended"}
                          </>
                        )}
                      </Button>
                      {!computedValues.isActive && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          This meeting has ended and cannot be joined
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {/* Message for unauthorized users */}
                  {isPrivate && !isOwner && !isInvited && (
                    <div>
                      <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-center">
                        <p className="text-sm text-danger font-medium">
                          You need an invitation to join this private meeting
                        </p>
                        <p className="text-xs text-danger/90 mt-1">
                          Contact the meeting creator for access
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invited Users Section (for private rooms) */}
          {'invitedUsers' in meeting && meeting.invitedUsers && meeting.invitedUsers.length > 0 && (
            <Card className="gap-3 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Invited Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {meeting.invitedUsers.map((user: User) => (
                    <div key={user._id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meeting Ratings */}
          {meeting && 'createdBy' in meeting && (
            <MeetingRatings
              meetingId={meeting._id}
              meetingName={meeting.name}
              creatorId={meeting.createdBy?._id || ''}
              dataVersion={dataVersion}
            />
          )}
        </div>

        {/* Dialogs */}
        {showEditDialog && editingRoom && 'invitedUsers' in editingRoom && (
          <RoomDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            mode="edit"
            roomData={editingRoom}
            onRoomDataChange={setEditingRoom}
            onSubmit={async () => {
              try {
                if (!editingRoom) return;
                
                setIsUpdating(true);
                
                // Convert invitedUsers from User[] to string[] (emails)
                const invitedEmails = editingRoom.invitedUsers
                  .map(user => user.email)
                  .filter((email): email is string => 
                    email !== undefined && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                  );

                // Ensure scheduledStartTime is properly formatted for the backend
                // If it's undefined, send null to explicitly clear it
                const scheduledStartTime = editingRoom.scheduledStartTime === undefined ? null : editingRoom.scheduledStartTime;
                
                const roomDataToSend = {
                  name: editingRoom.name,
                  description: editingRoom.description,
                  isPrivate: editingRoom.isPrivate,
                  maxParticipants: editingRoom.maxParticipants,
                  invitedUsers: invitedEmails,
                  scheduledStartTime: scheduledStartTime
                };

                // Call the update API using Redux
                await dispatch(updateRoom({ 
                  roomId: editingRoom._id, 
                  roomData: roomDataToSend 
                })).unwrap();
                
                // Always refetch public sessions because room status might have changed
                // (e.g., from Open to Scheduled, or vice versa)
                await dispatch(fetchPublicSessions());
                
                setShowEditDialog(false);
                setEditingRoom(null);
                // Refresh meeting details
                await fetchMeetingDetails();
                toast.success("Meeting updated successfully!");
              } catch {
                toast.error("Failed to update meeting");
              } finally {
                setIsUpdating(false);
              }
            }}
            isLoading={isUpdating}
            followedUsers={followedUsers || []}
            showSuggestionMenu={showSuggestionMenu}
            setShowSuggestionMenu={setShowSuggestionMenu}
            currentUser={user || undefined}
          />
        )}

        {showDeleteDialog && meeting && 'invitedUsers' in meeting && (
          <DeleteConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onConfirm={async () => {
              try {
                if (!meeting || !('invitedUsers' in meeting)) return;
                
                setIsDeleting(true);
                
                // Call the delete API using Redux
                await dispatch(deleteRoom(meeting._id)).unwrap();
                
                setShowDeleteDialog(false);
                toast.success("Meeting deleted successfully!");
                router.push('/meeting');
              } catch {
                toast.error("Failed to delete meeting");
              } finally {
                setIsDeleting(false);
              }
            }}
          />
        )}
        
        {/* Rating Dialog */}
        {showRatingDialog && meeting && 'createdBy' in meeting && (
          <SessionRatingDialog 
            open={showRatingDialog} 
            onOpenChange={setShowRatingDialog} 
            sessionId={meeting._id} 
            roomName={meeting.name} 
            creatorName={`${meeting.createdBy?.firstName || ''} ${meeting.createdBy?.lastName || ''}`.trim() || 'User'} 
            creatorId={meeting.createdBy?._id || ''} 
            onRatingSubmitted={() => {
              setShowRatingDialog(false);
              if (meeting && user?._id) {
                const newRatedSessions = new Set([...ratedSessions, meeting._id]);
                setRatedSessions(newRatedSessions);
                
                // Save to localStorage
                localStorage.setItem(`ratedSessions_${user._id}`, JSON.stringify([...newRatedSessions]));
                
                // Refresh the meeting data to show the updated rating immediately
                fetchMeetingDetails();
              }
              // toast.success("Rating submitted successfully!");
            }} 
          />
        )}
               
        </Container>
      </>
      </ContextConnector>
    </MeetingLifecycleManager>
  );
};


