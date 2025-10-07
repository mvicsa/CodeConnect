"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useDispatch } from 'react-redux';
import { toast } from "sonner";
import { AppDispatch } from '@/store/store';
import { 
  fetchRooms, 
  fetchPublicSessions,
  fetchSessionHistory,
  type Room
} from '@/store/slices/meetingSlice';
import { SessionRatingDialog } from '@/components/rating';
import { ratingService } from '@/services/ratingService';
import { User } from '@/types/user';
import axiosInstance from '@/lib/axios';

interface MeetingLifecycleContextType {
  handleEndSessionWithRating: (room: Room) => Promise<boolean>;
  handleDisconnectWithRating: (room: Room) => Promise<boolean>;
  checkAndShowRatingDialog: (roomId: string) => Promise<void>;
  showRatingForSession: (sessionId: string, roomName: string, creatorName: string, creatorId: string) => void;
  isSessionRated: (sessionId: string) => boolean;
  getSessionRatingData: (sessionId: string) => { rating: number; ratingCount: number; isLoading: boolean };
  fetchRatingForSession: (sessionId: string) => void;
  forceRefreshRoomData: (roomId: string) => Promise<void>;
  handleParticipantLeave: (room: Room) => Promise<void>;
}

const MeetingLifecycleContext = createContext<MeetingLifecycleContextType | null>(null);

interface MeetingLifecycleManagerProps {
  children: React.ReactNode;
  currentUser: User | null;
  onRatingSubmitted?: (sessionId: string) => void; // Add callback for rating submission
}

export const MeetingLifecycleManager = ({ children, currentUser, onRatingSubmitted }: MeetingLifecycleManagerProps) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Rating dialog state
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingSessionData, setRatingSessionData] = useState<{
    sessionId: string;
    roomName: string;
    creatorName: string;
    creatorId: string;
  } | null>(null);
  const [ratedSessions, setRatedSessions] = useState<Set<string>>(new Set());

  // Session ratings state
  const [sessionRatings, setSessionRatings] = useState<{[sessionId: string]: number}>({});
  const [sessionRatingCounts, setSessionRatingCounts] = useState<{[sessionId: string]: number}>({});
  const [ratingsLoading, setRatingsLoading] = useState<{[sessionId: string]: boolean}>({});

  // Function to fetch and calculate average rating for a session
  const fetchSessionRating = useCallback(async (sessionId: string) => {
    if (sessionRatings[sessionId] !== undefined) return; // Already fetched
    
    setRatingsLoading(prev => ({ ...prev, [sessionId]: true }));
    
    try {
      const ratings = await ratingService.getSessionRatings(sessionId);
      if (ratings && ratings.length > 0) {
        const totalRating = ratings.reduce((sum, rating) => sum + rating.overallRating, 0);
        const averageRating = totalRating / ratings.length;
        setSessionRatings(prev => ({ ...prev, [sessionId]: averageRating }));
        setSessionRatingCounts(prev => ({ ...prev, [sessionId]: ratings.length }));
      } else {
        setSessionRatings(prev => ({ ...prev, [sessionId]: 0 })); // No ratings
        setSessionRatingCounts(prev => ({ ...prev, [sessionId]: 0 }));
      }
    } catch {
      toast.error(`Failed to fetch ratings for session ${sessionId}`);
      setSessionRatings(prev => ({ ...prev, [sessionId]: 0 }));
      setSessionRatingCounts(prev => ({ ...prev, [sessionId]: 0 }));
    } finally {
      setRatingsLoading(prev => ({ ...prev, [sessionId]: false }));
    }
  }, [sessionRatings]);

  // Load rated sessions from backend when component mounts
  useEffect(() => {
    if (currentUser?._id) {
      const loadRatedSessions = async () => {
        try {
          const response = await ratingService.getMySubmittedRatings(1, 1000); // Get all submitted ratings
          const ratedSessionIds = response.ratings.map(rating => rating.sessionId);
          setRatedSessions(new Set(ratedSessionIds));
        } catch {
          toast.error('Failed to fetch rated sessions');
        }
      };
      loadRatedSessions();
    }
  }, [currentUser?._id]);

  // Function to check room status with retry until session is ended
  const checkRoomStatusUntilEnded = async (roomId: string, maxRetries: number = 10): Promise<Room | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data: roomData } = await axiosInstance.get(`/livekit/rooms/${roomId}/status`);
        
        if (roomData.isActive === false) {
          return roomData;
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
        }
      } catch {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    return null;
  };

  // Function to handle session ending with ratings
  const handleEndSessionWithRating = async (room: Room) => {
    if (!room || !currentUser) {
      return false;
    }
    
    try {
      // End the session via API
      await axiosInstance.post(`/livekit/rooms/${room._id}/end-session`);
      
      // Initial data refresh - no unnecessary delays
      await dispatch(fetchRooms());
      await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
      if (!room.isPrivate) {
        await dispatch(fetchPublicSessions());
      }
      
      toast.success("Session ended successfully");
      
      // Check if user was a participant (not creator) and show rating dialog
      if (room.createdBy?._id && room.createdBy._id !== currentUser._id) {
        // Poll room status until session is ended
        const updatedRoomData = await checkRoomStatusUntilEnded(room._id);
        
        if (updatedRoomData && updatedRoomData.isActive === false) {
          // Perform additional data refresh for participants to ensure UI updates - no delays
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
          
          const creatorName = `${room.createdBy.firstName} ${room.createdBy.lastName}`;
          
          setRatingSessionData({
            sessionId: room._id,
            roomName: room.name || 'Unknown Session',
            creatorName,
            creatorId: room.createdBy._id,
          });

          // Show rating dialog immediately
          setShowRatingDialog(true);
        } else {
          // Even if session is still active, refresh data again to show current state
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
        }
      } else {
        // For creators, also perform an additional refresh to ensure UI updates - no delays
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      }
      
      return true; // Success
    } catch {
      toast.error("Failed to end session");
      return false; // Failed
    }
  };

  // Function to check if meeting should be ended (no participants left)
  const checkAndEndMeetingIfEmpty = async (room: Room) => {
    try {
      const { data: roomStatus } = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
      
      // If no participants left and meeting is still active, end it
      if (roomStatus.participantCount === 0 && roomStatus.isActive === true) {
        
        try {
          // Check if current user is creator (has permission to end meeting)
          if (room.createdBy?._id === currentUser?._id) {
            await axiosInstance.post(`/livekit/rooms/${room._id}/end-session`);
          } else {
            // For non-creators, we can't end the meeting, but we can mark it as inactive
            // This might require a different endpoint or the backend should handle it automatically
          }
          
          // Always refresh the data regardless of whether meeting was ended or not
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
          
          // Return true if meeting was ended, false if it couldn't be ended
          return room.createdBy?._id === currentUser?._id;
        } catch {
          // Even if ending failed, refresh data to show current state
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
          return false;
        }
      } else if (roomStatus.isActive === false) {
        // Meeting is already ended, just refresh data
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
        return false;
      } else {
        // Even if meeting is not empty, refresh data to show current state
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
        
        return false;
      }
    } catch {
      // Even if status check failed, refresh data to show current state
      try {
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      } catch {
        toast.error("Failed to check room status");
      }
      return false;
    }
  };

  // Function to check if current user should see rating dialog for a session
  const checkAndShowRatingDialog = useCallback(async (roomId: string) => {
    if (!currentUser) {
      return;
    }
    
    try {
      // Poll room status until session is ended
      const updatedRoomData = await checkRoomStatusUntilEnded(roomId);
      
      if (updatedRoomData) {
        // Only show rating dialog if session is ended and user is a participant
        if (updatedRoomData.isActive === false && 
            updatedRoomData.createdBy?._id && 
            updatedRoomData.createdBy._id !== currentUser._id) {
          
          const creatorName = `${updatedRoomData.createdBy.firstName} ${updatedRoomData.createdBy.lastName}`;
          
          setRatingSessionData({
            sessionId: roomId,
            roomName: updatedRoomData.name || 'Unknown Session',
            creatorName,
            creatorId: updatedRoomData.createdBy._id,
          });

          setShowRatingDialog(true);
        }
      }
    } catch {
      toast.error('Failed to check and show rating dialog');
    }
  }, [currentUser]);

  // Function to force refresh all meeting data
  // const forceRefreshMeetingData = async (room: Room) => {
  //   try {
  //     console.log('forceRefreshMeetingData: Forcing refresh of all meeting data');
      
  //     // Refresh all meeting-related data
  //     await Promise.all([
  //       dispatch(fetchRooms()),
  //       dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false })),
  //       room.isPrivate ? Promise.resolve() : dispatch(fetchPublicSessions())
  //     ]);
      
  //     console.log('forceRefreshMeetingData: All data refreshed successfully');
  //   } catch (error) {
  //     console.error('forceRefreshMeetingData: Error refreshing data', error);
  //   }
  // };

  // Function to aggressively refresh data multiple times
  // const aggressiveRefreshData = async (room: Room) => {
  //   try {
  //     console.log('aggressiveRefreshData: Starting aggressive data refresh');
      
  //     // First refresh
  //     await forceRefreshMeetingData(room);
      
  //     // Second refresh immediately
  //     await forceRefreshMeetingData(room);
      
  //     // Third refresh immediately
  //     await forceRefreshMeetingData(room);
      
  //     console.log('aggressiveRefreshData: Aggressive refresh completed');
  //   } catch (error) {
  //     console.error('aggressiveRefreshData: Error during aggressive refresh', error);
  //   }
  // };

  // Function to handle disconnect with potential rating
  const handleDisconnectWithRating = async (room: Room) => {
    if (!room || !currentUser) return false;
    
    try {
      // Check if meeting should be ended (no participants left)
      // BUT don't auto-end if creator is leaving alone - let them leave without ending session
      let meetingEnded = false;
      
      if (room.createdBy?._id === currentUser?._id) {
        // Creator is leaving - check if they're alone
        try {
          const { data: roomStatus } = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
          if (roomStatus.participantCount <= 1) {
            // Creator is alone, don't auto-end the session - let them leave freely
            meetingEnded = false;
          } else {
            // Creator is leaving but others are still there, check if session should end
            meetingEnded = await checkAndEndMeetingIfEmpty(room);
          }
        } catch {
          toast.error('Error checking room status for creator');
          meetingEnded = false;
        }
      } else {
        // Non-creator is leaving, check if session should end
        meetingEnded = await checkAndEndMeetingIfEmpty(room);
      }
      
      
      // Initial data refresh
      await dispatch(fetchRooms());
      await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
      if (!room.isPrivate) {
        await dispatch(fetchPublicSessions());
      }
      
      // If meeting couldn't be ended automatically (user not creator), 
      // we still need to check if it's ended for rating dialog
      let updatedRoomData;
      
      if (meetingEnded) {
        // Meeting was ended, poll for final status
        updatedRoomData = await checkRoomStatusUntilEnded(room._id);
      } else {
        // Meeting couldn't be ended, just get current status
        try {
          const { data: currentStatus } = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
          updatedRoomData = currentStatus;
        } catch {
          toast.error('Error getting current room status');
          return false;
        }
      }
      
      if (updatedRoomData) {
        
        // Check if user was a participant (not creator) and show rating dialog
        if (room.createdBy?._id && room.createdBy._id !== currentUser._id && updatedRoomData.isActive === false) {
          
          // Perform additional data refresh for participants to ensure UI updates
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
          
          const creatorName = `${room.createdBy.firstName} ${room.createdBy.lastName}`;
          
          setRatingSessionData({
            sessionId: room._id,
            roomName: room.name || 'Unknown Session',
            creatorName,
            creatorId: room.createdBy._id,
          });

          setShowRatingDialog(true);
        } else {
          
          // Even if no rating dialog is needed, perform additional refresh to ensure UI updates
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
        }
      } else {
        // Even if we couldn't get updated data, perform additional refresh
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      }
      
      return true; // Success
    } catch {
      // Even if there's an error, try to refresh data
      try {
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
        
        // Additional refresh after error - no delays
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      } catch {
        toast.error('Error refreshing data after error');
      }
      return false; // Failed
    }
  };

  // Function to show rating dialog for a specific session
  const showRatingForSession = (sessionId: string, roomName: string, creatorName: string, creatorId: string) => {
    setRatingSessionData({
      sessionId,
      roomName,
      creatorName,
      creatorId,
    });
    setShowRatingDialog(true);
  };

  // Function to check if a session has been rated
  const isSessionRated = (sessionId: string) => {
    return ratedSessions.has(sessionId);
  };

  // Function to get session rating data
  const getSessionRatingData = (sessionId: string) => {
    return {
      rating: sessionRatings[sessionId] || 0,
      ratingCount: sessionRatingCounts[sessionId] || 0,
      isLoading: ratingsLoading[sessionId] || false,
    };
  };

  // Function to fetch rating for a specific session
  const fetchRatingForSession = (sessionId: string) => {
    fetchSessionRating(sessionId);
  };

  // Function to force refresh data for a specific room
  const forceRefreshRoomData = async () => {
    try {
      
      // Refresh all meeting-related data to ensure the specific room data is updated
      await Promise.all([
        dispatch(fetchRooms()),
        dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false })),
        dispatch(fetchPublicSessions())
      ]);
      
    } catch {
      toast.error('Failed to refresh specific room data');
    }
  };

  // Function to handle participant leaving a session
  const handleParticipantLeave = async (room: Room) => {
    if (!room || !currentUser) return;
    
    try {
      
      // For participants (not creators), we need to ensure data is refreshed
      // to show the updated session state
      if (room.createdBy?._id && room.createdBy._id !== currentUser._id) {
        
        // Initial refresh
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
        
        // Second refresh immediately to ensure backend has processed the leave
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
        
      } else {
        // For creators, just do a basic refresh
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      }
    } catch {
      toast.error('Error refreshing data');
      // Even if there's an error, try to refresh data
      try {
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      } catch {
        toast.error('Error during fallback refresh');
      }
    }
  };

  const contextValue: MeetingLifecycleContextType = {
    handleEndSessionWithRating,
    handleDisconnectWithRating,
    checkAndShowRatingDialog,
    showRatingForSession,
    isSessionRated,
    getSessionRatingData,
    fetchRatingForSession,
    forceRefreshRoomData,
    handleParticipantLeave,
  };

  return (
    <MeetingLifecycleContext.Provider value={contextValue}>
      {children}
      
      {/* Session Rating Dialog */}
      {ratingSessionData && (
        <SessionRatingDialog
          open={showRatingDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowRatingDialog(false);
              setRatingSessionData(null);
            } else {
              setShowRatingDialog(true);
            }
          }}
          sessionId={ratingSessionData.sessionId}
          roomName={ratingSessionData.roomName}
          creatorName={ratingSessionData.creatorName}
          creatorId={ratingSessionData.creatorId}
          onRatingSubmitted={() => {
            setShowRatingDialog(false);
            if (ratingSessionData && currentUser?._id) {
              // Add the session to our rated sessions set
              const newRatedSessions = new Set([...ratedSessions, ratingSessionData.sessionId]);
              setRatedSessions(newRatedSessions);
              
              // Refresh the rating for this session
              if (ratingSessionData.sessionId) {
                fetchSessionRating(ratingSessionData.sessionId);
              }
              
              // Refresh all meeting data to show the updated rating immediately
              dispatch(fetchRooms());
              dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
              dispatch(fetchPublicSessions());
              
              // Notify parent component that rating was submitted
              if (onRatingSubmitted) {
                onRatingSubmitted(ratingSessionData.sessionId);
              }
            }
            setRatingSessionData(null);
          }}
        />
      )}
    </MeetingLifecycleContext.Provider>
  );
};

// Hook to use the meeting lifecycle context
export const useMeetingLifecycle = () => {
  const context = useContext(MeetingLifecycleContext);
  if (!context) {
    throw new Error('useMeetingLifecycle must be used within a MeetingLifecycleManager');
  }
  return context;
};
