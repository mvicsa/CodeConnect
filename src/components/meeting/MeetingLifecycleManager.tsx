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
    } catch (error) {
      console.error(`Failed to fetch ratings for session ${sessionId}:`, error);
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
        } catch (error) {
          console.error('Failed to fetch rated sessions:', error);
        }
      };
      loadRatedSessions();
    }
  }, [currentUser?._id]);

  // Function to check room status with retry until session is ended
  const checkRoomStatusUntilEnded = async (roomId: string, maxRetries: number = 10): Promise<Room | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`checkRoomStatusUntilEnded: Attempt ${attempt}/${maxRetries}`);
        
        const { data: roomData } = await axiosInstance.get(`/livekit/rooms/${roomId}/status`);
        console.log(`checkRoomStatusUntilEnded: Room data (attempt ${attempt})`, roomData);
        
        if (roomData.isActive === false) {
          console.log(`checkRoomStatusUntilEnded: Session ended on attempt ${attempt}`);
          return roomData;
        }
        
        if (attempt < maxRetries) {
          console.log(`checkRoomStatusUntilEnded: Session still active, retrying in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
        }
      } catch (error) {
        console.error(`checkRoomStatusUntilEnded: Error on attempt ${attempt}`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`checkRoomStatusUntilEnded: Max retries reached, session might still be active`);
    return null;
  };

  // Function to handle session ending with ratings
  const handleEndSessionWithRating = async (room: Room) => {
    if (!room || !currentUser) {
      console.log('handleEndSessionWithRating: Missing room or currentUser', { room, currentUser });
      return false;
    }
    
    try {
      console.log('handleEndSessionWithRating: Starting session end process', { 
        roomId: room._id, 
        roomName: room.name,
        currentUserId: currentUser._id,
        roomCreatorId: room.createdBy?._id,
        isCreator: room.createdBy?._id === currentUser._id
      });

      // End the session via API
      await axiosInstance.post(`/livekit/rooms/${room._id}/end-session`);
      console.log('handleEndSessionWithRating: API call successful');
      
      // Initial data refresh - no unnecessary delays
      console.log('handleEndSessionWithRating: Performing initial data refresh');
      await dispatch(fetchRooms());
      await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
      if (!room.isPrivate) {
        await dispatch(fetchPublicSessions());
      }
      
      toast.success("Session ended successfully");
      
      // Check if user was a participant (not creator) and show rating dialog
      if (room.createdBy?._id && room.createdBy._id !== currentUser._id) {
        console.log('handleEndSessionWithRating: User is participant, checking room status');
        
        // Poll room status until session is ended
        const updatedRoomData = await checkRoomStatusUntilEnded(room._id);
        
        if (updatedRoomData && updatedRoomData.isActive === false) {
          console.log('handleEndSessionWithRating: Session confirmed ended, showing rating dialog');
          
          // Perform additional data refresh for participants to ensure UI updates - no delays
          console.log('handleEndSessionWithRating: Performing additional refresh for participant');
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
          console.log('handleEndSessionWithRating: Setting showRatingDialog to true');
          setShowRatingDialog(true);
        } else {
          console.log('handleEndSessionWithRating: Session still active after max retries, no rating dialog');
          // Even if session is still active, refresh data again to show current state
          console.log('handleEndSessionWithRating: Refreshing data again for current state');
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
        }
      } else {
        console.log('handleEndSessionWithRating: User is creator, no rating dialog needed');
        // For creators, also perform an additional refresh to ensure UI updates - no delays
        console.log('handleEndSessionWithRating: Performing additional refresh for creator');
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      }
      
      return true; // Success
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Failed to end session");
      return false; // Failed
    }
  };

  // Function to check if meeting should be ended (no participants left)
  const checkAndEndMeetingIfEmpty = async (room: Room) => {
    try {
      const { data: roomStatus } = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
      console.log('checkAndEndMeetingIfEmpty: Room status', roomStatus);
      
      // If no participants left and meeting is still active, end it
      if (roomStatus.participantCount === 0 && roomStatus.isActive === true) {
        console.log('checkAndEndMeetingIfEmpty: No participants left, ending meeting');
        
        try {
          // Check if current user is creator (has permission to end meeting)
          if (room.createdBy?._id === currentUser?._id) {
            console.log('checkAndEndMeetingIfEmpty: User is creator, ending meeting');
            await axiosInstance.post(`/livekit/rooms/${room._id}/end-session`);
            console.log('checkAndEndMeetingIfEmpty: Meeting ended successfully');
          } else {
            console.log('checkAndEndMeetingIfEmpty: User is not creator, cannot end meeting directly');
            // For non-creators, we can't end the meeting, but we can mark it as inactive
            // This might require a different endpoint or the backend should handle it automatically
            console.log('checkAndEndMeetingIfEmpty: Meeting will remain active until creator ends it or backend auto-cleanup');
          }
          
          // Always refresh the data regardless of whether meeting was ended or not
          console.log('checkAndEndMeetingIfEmpty: Refreshing data...');
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
          console.log('checkAndEndMeetingIfEmpty: Data refreshed successfully');
          
          // Return true if meeting was ended, false if it couldn't be ended
          return room.createdBy?._id === currentUser?._id;
        } catch (error) {
          console.error('checkAndEndMeetingIfEmpty: Error ending meeting', error);
          // Even if ending failed, refresh data to show current state
          console.log('checkAndEndMeetingIfEmpty: Refreshing data after error...');
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
          return false;
        }
      } else if (roomStatus.isActive === false) {
        // Meeting is already ended, just refresh data
        console.log('checkAndEndMeetingIfEmpty: Meeting already ended, refreshing data only');
        console.log('checkAndEndMeetingIfEmpty: Refreshing data for already ended meeting...');
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
        console.log('checkAndEndMeetingIfEmpty: Data refreshed successfully for ended meeting');
        return false;
      } else {
        console.log('checkAndEndMeetingIfEmpty: Meeting still has participants or already ended', {
          participantCount: roomStatus.participantCount,
          isActive: roomStatus.isActive
        });
        
        // Even if meeting is not empty, refresh data to show current state
        console.log('checkAndEndMeetingIfEmpty: Refreshing data to show current state...');
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
        console.log('checkAndEndMeetingIfEmpty: Data refreshed successfully');
        
        return false;
      }
    } catch (error) {
      console.error('checkAndEndMeetingIfEmpty: Error checking room status', error);
      // Even if status check failed, refresh data to show current state
      console.log('checkAndEndMeetingIfEmpty: Refreshing data after status check error...');
      try {
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      } catch (refreshError) {
        console.error('checkAndEndMeetingIfEmpty: Error refreshing data', refreshError);
      }
      return false;
    }
  };

  // Function to check if current user should see rating dialog for a session
  const checkAndShowRatingDialog = useCallback(async (roomId: string) => {
    console.log('checkAndShowRatingDialog: Function called', {
      roomId,
      hasCurrentUser: !!currentUser,
      currentUserId: currentUser?._id
    });
    
    if (!currentUser) {
      console.log('checkAndShowRatingDialog: No current user, returning');
      return;
    }
    
    try {
      console.log('checkAndShowRatingDialog: Fetching room status for', roomId);
      
      // Poll room status until session is ended
      const updatedRoomData = await checkRoomStatusUntilEnded(roomId);
      
      if (updatedRoomData) {
        console.log('checkAndShowRatingDialog: Updated room data', updatedRoomData);
        
        // Only show rating dialog if session is ended and user is a participant
        if (updatedRoomData.isActive === false && 
            updatedRoomData.createdBy?._id && 
            updatedRoomData.createdBy._id !== currentUser._id) {
          
          console.log('checkAndShowRatingDialog: Session ended, showing rating dialog for participant', {
            isActive: updatedRoomData.isActive,
            creatorId: updatedRoomData.createdBy._id,
            currentUserId: currentUser._id,
            roomName: updatedRoomData.name
          });
          
          const creatorName = `${updatedRoomData.createdBy.firstName} ${updatedRoomData.createdBy.lastName}`;
          
          setRatingSessionData({
            sessionId: roomId,
            roomName: updatedRoomData.name || 'Unknown Session',
            creatorName,
            creatorId: updatedRoomData.createdBy._id,
          });

          console.log('checkAndShowRatingDialog: Setting showRatingDialog to true');
          setShowRatingDialog(true);
        } else {
          console.log('checkAndShowRatingDialog: No rating dialog needed', {
            isActive: updatedRoomData.isActive,
            isCreator: updatedRoomData.createdBy?._id === currentUser._id,
            hasCreator: !!updatedRoomData.createdBy?._id,
            creatorId: updatedRoomData.createdBy?._id,
            currentUserId: currentUser._id
          });
        }
      } else {
        console.log('checkAndShowRatingDialog: Could not get updated room data');
      }
    } catch (error) {
      console.error('checkAndShowRatingDialog: Error checking room status', error);
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
      console.log('handleDisconnectWithRating: Checking room status');
      
      // Check if meeting should be ended (no participants left)
      // BUT don't auto-end if creator is leaving alone - let them leave without ending session
      let meetingEnded = false;
      
      if (room.createdBy?._id === currentUser?._id) {
        // Creator is leaving - check if they're alone
        try {
          const { data: roomStatus } = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
          if (roomStatus.participantCount <= 1) {
            // Creator is alone, don't auto-end the session - let them leave freely
            console.log('handleDisconnectWithRating: Creator leaving alone, not auto-ending session');
            meetingEnded = false;
          } else {
            // Creator is leaving but others are still there, check if session should end
            meetingEnded = await checkAndEndMeetingIfEmpty(room);
          }
        } catch (error) {
          console.error('handleDisconnectWithRating: Error checking room status for creator', error);
          meetingEnded = false;
        }
      } else {
        // Non-creator is leaving, check if session should end
        meetingEnded = await checkAndEndMeetingIfEmpty(room);
      }
      
      console.log('handleDisconnectWithRating: Meeting end attempt result', { meetingEnded });
      
      // Initial data refresh
      console.log('handleDisconnectWithRating: Performing initial data refresh');
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
          console.log('handleDisconnectWithRating: Current room status (meeting not ended)', currentStatus);
        } catch (error) {
          console.error('handleDisconnectWithRating: Error getting current room status', error);
          return false;
        }
      }
      
      if (updatedRoomData) {
        console.log('handleDisconnectWithRating: Updated room data', updatedRoomData);
        
        // Check if user was a participant (not creator) and show rating dialog
        if (room.createdBy?._id && room.createdBy._id !== currentUser._id && updatedRoomData.isActive === false) {
          console.log('handleDisconnectWithRating: User is participant, session ended, showing rating dialog');
          
          // Perform additional data refresh for participants to ensure UI updates
          console.log('handleDisconnectWithRating: Performing additional refresh for participant');
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
          console.log('handleDisconnectWithRating: No rating dialog needed', {
            isCreator: room.createdBy?._id === currentUser._id,
            isActive: updatedRoomData.isActive,
            participantCount: updatedRoomData.participantCount
          });
          
          // Even if no rating dialog is needed, perform additional refresh to ensure UI updates
          console.log('handleDisconnectWithRating: Performing additional refresh for UI update');
          await dispatch(fetchRooms());
          await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
          if (!room.isPrivate) {
            await dispatch(fetchPublicSessions());
          }
        }
      } else {
        console.log('handleDisconnectWithRating: Could not get updated room data');
        // Even if we couldn't get updated data, perform additional refresh
        console.log('handleDisconnectWithRating: Performing additional refresh despite missing data');
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      }
      
      return true; // Success
    } catch (error) {
      console.error("Error checking room status:", error);
      // Even if there's an error, try to refresh data
      try {
        console.log('handleDisconnectWithRating: Refreshing data after error');
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
      } catch (refreshError) {
        console.error('handleDisconnectWithRating: Error refreshing data after error', refreshError);
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
  const forceRefreshRoomData = async (roomId: string) => {
    try {
      console.log('forceRefreshRoomData: Forcing refresh of specific room data', roomId);
      
      // Refresh all meeting-related data to ensure the specific room data is updated
      await Promise.all([
        dispatch(fetchRooms()),
        dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false })),
        dispatch(fetchPublicSessions())
      ]);
      
      console.log('forceRefreshRoomData: Specific room data refreshed successfully');
    } catch (error) {
      console.error('forceRefreshRoomData: Error refreshing specific room data', error);
    }
  };

  // Function to handle participant leaving a session
  const handleParticipantLeave = async (room: Room) => {
    if (!room || !currentUser) return;
    
    try {
      console.log('handleParticipantLeave: Participant leaving session', {
        roomId: room._id,
        roomName: room.name,
        currentUserId: currentUser._id,
        isCreator: room.createdBy?._id === currentUser._id
      });
      
      // For participants (not creators), we need to ensure data is refreshed
      // to show the updated session state
      if (room.createdBy?._id && room.createdBy._id !== currentUser._id) {
        console.log('handleParticipantLeave: User is participant, refreshing data');
        
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
        
        console.log('handleParticipantLeave: Data refreshed successfully for participant');
      } else {
        console.log('handleParticipantLeave: User is creator, minimal refresh needed');
        // For creators, just do a basic refresh
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      }
    } catch (error) {
      console.error('handleParticipantLeave: Error refreshing data', error);
      // Even if there's an error, try to refresh data
      try {
        await dispatch(fetchRooms());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        if (!room.isPrivate) {
          await dispatch(fetchPublicSessions());
        }
      } catch (refreshError) {
        console.error('handleParticipantLeave: Error during fallback refresh', refreshError);
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
