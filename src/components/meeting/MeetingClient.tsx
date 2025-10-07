"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Video,
  Plus,
  Globe,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Container from "@/components/Container";
import { User } from "@/types/user";
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchFollowing } from '@/store/slices/followSlice';
import { 
  fetchRooms, 
  fetchPublicSessions,
  fetchSessionHistory,
  createRoom, 
  updateRoom, 
  deleteRoom,
  type Room as ReduxRoom,
  type PublicSession,
  type CreateRoomData,
  type UpdateRoomData,
  Room,
  SessionHistory
} from '@/store/slices/meetingSlice';
import { RoomDialog } from "./RoomDialog";
import { VideoConferenceComponent } from "./VideoConference";
import { RoomCard } from "./RoomCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { PublicSessionsSearch } from "./PublicSessionsSearch";
import { useContext } from 'react';
import { SocketContext } from '@/store/Provider';
import axiosInstance from '@/lib/axios';
import axios, { AxiosError } from 'axios';
import { SessionRatingDialog } from '@/components/rating';
import { ratingService } from '@/services/ratingService';
import { SessionHistorySection } from './index';


export const MeetingClient = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms, publicSessions, createLoading, updateLoading, publicSessionsLoading, sessionHistory, sessionHistoryLoading, currentPage, hasMoreSessions, totalSessions, totalRooms, activeRooms, endedRooms } = useSelector((state: RootState) => state.meeting);
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: followedUsers } = useSelector((state: RootState) => state.follow.following);
  
  const [token, setToken] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<ReduxRoom | null>(null);
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState("public");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [secretId, setSecretId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [editingRoom, setEditingRoom] = useState<ReduxRoom | null>(null);
  const [originalInvitedUsers, setOriginalInvitedUsers] = useState<User[]>([]);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxParticipants: 10,
    invitedUsers: [] as User[], // Array of User objects for UI
    inviteEmail: '',
    scheduledStartTime: undefined as string | undefined
  });
  const [publicSessionsSearchQuery, setPublicSessionsSearchQuery] = useState("");

  const resetNewRoomData = () => {
    setNewRoomData({
      name: '',
      description: '',
      isPrivate: false,
      maxParticipants: 10,
      invitedUsers: [],
      inviteEmail: '',
      scheduledStartTime: undefined
    });
  };
  
  const [roomToDelete, setRoomToDelete] = useState<ReduxRoom | null>(null);
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false);
  
  // Separate loading state for load more operations
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
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

  // Helper function to check if a session is rated
  const isSessionRated = useCallback((sessionId: string): boolean => {
    if (!sessionId) return false;
    return ratedSessions.has(sessionId);
  }, [ratedSessions]);

  // Function to handle rating a session
  const handleRateSession = useCallback((session: SessionHistory) => {
    if (session.createdBy?._id && session.createdBy._id !== user?._id) {
      const creatorName = session.createdBy.username || 
                        session.createdBy.name || 
                        session.createdBy.firstName || 
                        'Unknown Creator';
      
      setRatingSessionData({
        sessionId: session.roomId,
        roomName: session.roomName,
        creatorName,
        creatorId: session.createdBy._id,
      });
      setShowRatingDialog(true);
    }
  }, [user?._id]);

  const t = useTranslations("meeting");
  const socket = useContext(SocketContext);

  // // Check socket connection status
  // useEffect(() => {
  //   if (socket) {
  //     console.log('🔌 Socket connected:', socket.connected);
      
  //     socket.on('connect', () => {
  //       console.log('✅ Socket connected successfully');
  //     });
      
  //     socket.on('disconnect', () => {
  //       console.log('❌ Socket disconnected');
  //     });
      
  //     socket.on('connect_error', (error: Error) => {
  //       console.error('❌ Socket connection error:', error);
  //     });
  //   }
  // }, [socket]);

  // Function to fetch and calculate average rating for a session
  const fetchSessionRating = useCallback(async (sessionId: string) => {
    if (sessionRatings[sessionId] !== undefined) return; // Already fetched
    
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
      toast.error(`Failed to fetch ratings`);
      setSessionRatings(prev => ({ ...prev, [sessionId]: 0 }));
      setSessionRatingCounts(prev => ({ ...prev, [sessionId]: 0 }));
    }
  }, [sessionRatings]);

  // Function to load more session history
  const handleLoadMoreSessions = useCallback(async () => {
    if (!hasMoreSessions || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      await dispatch(fetchSessionHistory({ 
        page: nextPage, 
        limit: 10, 
        loadMore: true 
      }));
    } catch {
      toast.error('Failed to load more sessions');
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMoreSessions, isLoadingMore, currentPage, dispatch]);

  // Function to render star rating display
  const renderStarRating = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        // Filled star
        stars.push(
          <Star key={i} className={`${starSize} fill-yellow-400 text-yellow-400`} />
        );
      } else if (i - 0.5 <= rating) {
        // Half star
        stars.push(
          <div key={i} className="relative">
            <Star className={`${starSize} text-gray-300`} />
            <Star className={`${starSize} fill-yellow-400 text-yellow-400 absolute inset-0 overflow-hidden`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
          </div>
        );
      } else {
        // Empty star
        stars.push(
          <Star key={i} className={`${starSize} text-gray-300`} />
        );
      }
    }
    
    return (
      <div className="flex items-center justify-center gap-1">
        {stars}
        <span className={`ms-1 text-xs ${size === 'sm' ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // useEffect(() => {
  //   console.log('Current User:', user);
  //   console.log('Followed Users:', followedUsers);
  // }, [user, followedUsers]);

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      try {
        if (user?._id) {
          const response = await axiosInstance.get(`/users/${user._id}/following`);

          if (response.status === 200) {
            const followedUsers = response.data;
            
            dispatch(fetchFollowing.fulfilled({ 
              items: followedUsers, 
              limit: followedUsers.length, 
              skip: 0 
            }, 'fetchFollowing/fulfilled', { userId: user._id }));
          } else {
            toast.error("Failed to fetch followed users");
          }
        } else {
          console.warn('No user ID available to fetch followed users');
        }
      } catch {
        toast.error("Failed to fetch followed users");
      }
    };
    fetchFollowedUsers();
  }, [user?._id, dispatch]);

  const handleCreateRoom = async () => {
    if (!newRoomData.name.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    if (newRoomData.name.length > 50) {
      toast.error("Room name must be 50 characters or less");
      return;
    }

    if (newRoomData.description.length > 200) {
      toast.error("Description must be 200 characters or less");
      return;
    }

    try {
      // Convert invitedUsers from User[] to string[] (emails)
      const invitedEmails = newRoomData.invitedUsers
        .map(user => user.email)
        .filter((email): email is string => 
          email !== undefined && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        );

      // For public rooms, we might not need invitedUsers or it might cause issues
      const roomDataToSend: CreateRoomData = {
        name: newRoomData.name,
        description: newRoomData.description,
        isPrivate: newRoomData.isPrivate,
        maxParticipants: newRoomData.maxParticipants,
        invitedUsers: newRoomData.isPrivate ? invitedEmails : [], // Only send invitedUsers for private rooms
        scheduledStartTime: newRoomData.scheduledStartTime // Include scheduled start time
      };

      const result = await dispatch(createRoom(roomDataToSend)).unwrap();
      
      toast.success("Room created successfully!");
      setShowCreateDialog(false);
      resetNewRoomData();
      
      // Refetch rooms to get complete data with createdBy information
      await dispatch(fetchRooms());
      
      // If the room is public, also refetch public sessions to show it immediately
      if (!newRoomData.isPrivate) {
        await dispatch(fetchPublicSessions());
      }
      
      // Send invitation messages if room is private and has invited users
      if (newRoomData.isPrivate && newRoomData.invitedUsers.length > 0) {
        for (const invitedUser of newRoomData.invitedUsers) {
          await sendRoomInvitationMessage(invitedUser, result);
        }
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to create room");
    }
  };

  // Check localStorage for existing meeting data when component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('livekitToken');
    const storedRoom = localStorage.getItem('currentRoom');
    const isJoined = localStorage.getItem('isJoined');
    
    if (storedToken && storedRoom && isJoined === 'true') {
      try {
        const roomData = JSON.parse(storedRoom);
        setToken(storedToken);
        setCurrentRoom(roomData);
        setJoined(true);
        
        // Clear localStorage after restoring state
        localStorage.removeItem('livekitToken');
        localStorage.removeItem('currentRoom');
        localStorage.removeItem('isJoined');
      } catch {
        // Clear invalid data
        localStorage.removeItem('livekitToken');
        localStorage.removeItem('currentRoom');
        localStorage.removeItem('isJoined');
      }
    }
  }, []);

  useEffect(() => {
    if (user?._id) {
      const fetchData = async () => {
        await dispatch(fetchRooms());
        await dispatch(fetchPublicSessions());
        await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
        
        // Load user's rated sessions from backend
        try {
          const response = await ratingService.getMySubmittedRatings(1, 1000); // Get all submitted ratings
          const ratedSessionIds = response.ratings.map(rating => rating.sessionId);
          setRatedSessions(new Set(ratedSessionIds));
        } catch {
          toast.error('Failed to fetch rated sessions');
        }
      };
      fetchData();
    }
  }, [dispatch, user?._id]);

  // Fetch ratings for ended sessions when session history changes
  useEffect(() => {
    if (sessionHistory && sessionHistory.length > 0) {
      const endedSessions = sessionHistory.filter(session => !session.isActive);
      endedSessions.forEach(session => {
        fetchSessionRating(session.roomId);
      });
    }
  }, [sessionHistory, fetchSessionRating]);

  // Fetch ratings for ended rooms when rooms data changes
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      const endedRooms = rooms.filter(room => !room.isActive);
      endedRooms.forEach(room => {
        fetchSessionRating(room._id);
      });
    }
  }, [rooms, fetchSessionRating]);

  const joinRoomBySecretId = async (sid?: string) => {
    const idToJoin = sid ?? secretId;
    if (!idToJoin.trim()) {
      toast.error(t("pleaseEnterSecretId"));
      return;
    }

    try {
      const roomResponse = await axiosInstance.get(`/livekit/rooms/join/${idToJoin}`);

      if (roomResponse.status !== 200) {
        toast.error(t("invalidSecretId"));
        return;
      }

      const room = roomResponse.data;
      
      // Get live room status including current participant count
      try {
        const statusResponse = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
        if (statusResponse.status === 200) {
          const roomStatus = statusResponse.data;
          // Update the room data with live participant count
          setCurrentRoom({
            ...room,
            currentParticipants: roomStatus.participantCount || 0
          });
        } else {
          setCurrentRoom(room);
        }
      } catch {
        toast.error('Failed to get live room status');
        setCurrentRoom(room);
      }

      const tokenResponse = await axiosInstance.get(`/livekit/token?secretId=${idToJoin}`);

      if (tokenResponse.status !== 200) {
        toast.error("Failed to get token");

        try {
          const errorData = tokenResponse.data;
          if (errorData.message) {
            toast.error(`Token Error: ${errorData.message}`);
          } else {
            toast.error(t("failedToGetToken"));
          }
        } catch {
          toast.error(`Server Error: ${tokenResponse.status}`);
        }
        return;
      }

      const tokenData = tokenResponse.data;

      if (!tokenData.token) {
        toast.error("Invalid token response from server");
        return;
      }

      const { token: livekitToken } = tokenData;

      setToken(livekitToken);
      setJoined(true);
      setSecretId("");
      toast.success(t("joinedRoom"));
    } catch {
      toast.error(t("failedToJoinRoom"));
    }
  };

  const joinRoomByRoomId = async (rid?: string) => {
    const idToJoin = rid ?? roomId;
    
    if (!idToJoin || !idToJoin.trim()) {
      toast.error("Please enter a room ID");
      return;
    }

    try {
      // Use the join-public endpoint for public rooms
      const roomResponse = await axiosInstance.get(`/livekit/rooms/join-public/${idToJoin}`);

      if (roomResponse.status !== 200) {
        toast.error("Invalid room ID or room not found");
        return;
      }

      const room = roomResponse.data;
      
      // Get live room status including current participant count
      try {
        const statusResponse = await axiosInstance.get(`/livekit/rooms/${idToJoin}/status`);
        if (statusResponse.status === 200) {
          const roomStatus = statusResponse.data;
          // Update the room data with live participant count
          setCurrentRoom({
            ...room,
            currentParticipants: roomStatus.participantCount || 0
          });
        } else {
          setCurrentRoom(room);
        }
      } catch {
        toast.error('Failed to get live room status');
        setCurrentRoom(room);
      }

      // Use the correct token endpoint for getting tokens by room ID
      const tokenResponse = await axiosInstance.get(`/livekit/token/room?roomId=${idToJoin}`);

      if (tokenResponse.status !== 200) {
        toast.error("Failed to get token");

        try {
          const errorData = tokenResponse.data;
          if (errorData.message) {
            toast.error(`Token Error: ${errorData.message}`);
          } else {
            toast.error(t("failedToGetToken"));
          }
        } catch {
          toast.error(`Server Error: ${tokenResponse.status}`);
        }
        return;
      }

      const tokenData = tokenResponse.data;

      if (!tokenData.token) {
        toast.error("Invalid token response from server");
        return;
      }

      const { token: livekitToken } = tokenData;

      setToken(livekitToken);
      setJoined(true);
      setRoomId("");
      toast.success(t("joinedRoom"));
    } catch {
      toast.error(t("failedToJoinRoom"));
    }
  };

  // Remove updateRoom function since we're using Redux updateRoom thunk

  // Track if we're already fetching a secret ID to prevent multiple simultaneous calls
  const [isFetchingSecretId, setIsFetchingSecretId] = useState(false);
  // Track if the secret ID endpoint exists
  const [secretIdEndpointExists, setSecretIdEndpointExists] = useState<boolean | null>(null);


  const getRoomSecretId = async (roomId: string) => {
    // Prevent multiple simultaneous calls
    if (isFetchingSecretId) {
      return null;
    }

    try {
      setIsFetchingSecretId(true);
      const response = await axiosInstance.get(`/livekit/rooms/${roomId}/secret-id`);

      if (response.status === 200) {
        const { secretId } = response.data;
        return secretId;
      } else {
        console.warn("Failed to get secret ID - non-200 status:", response.status);
        return null;
      }
    } catch (error) {
      // Only show toast for non-404 errors (404 means endpoint doesn't exist)
      if (error && (error as AxiosError).response?.status !== 404) {
        toast.error("Failed to get secret ID");
      } else {
        console.warn("Secret ID endpoint not found (404) - this feature may not be implemented yet");
        setSecretIdEndpointExists(false);
      }
      return null;
    } finally {
      setIsFetchingSecretId(false);
    }
  };

  // const copySecretId = async (roomId: string) => {
  //   // Find the room to check if it's public or private
  //   const room = rooms.find(r => r._id === roomId);
    
  //   if (room?.isPrivate) {
  //     // For private rooms, copy the secret ID
  //     const secretId = await getRoomSecretId(roomId);
  //     if (secretId) {
  //       try {
  //         await navigator.clipboard.writeText(secretId);
  //         toast.success(t("secretIdCopied"));
  //       } catch (error) {
  //         console.error("Failed to copy secret ID:", error);
  //         toast.error(t("failedToCopyId"));
  //       }
  //     }
  //   } else {
  //     // For public rooms, copy the room ID directly
  //     try {
  //       await navigator.clipboard.writeText(roomId);
  //       toast.success("Room ID copied to clipboard!");
  //     } catch (error) {
  //       console.error("Failed to copy room ID:", error);
  //       toast.error("Failed to copy room ID");
  //     }
  //   }
  // };

  // const copyRoomId = async (roomId: string) => {
  //   if (!roomId || typeof roomId !== 'string') {
  //     toast.error("Invalid room ID");
  //     return;
  //   }
    
  //   try {
  //     await navigator.clipboard.writeText(roomId);
  //     toast.success("Room ID copied to clipboard!");
  //   } catch (error) {
  //     console.error("Failed to copy room ID:", error);
  //     toast.error("Failed to copy room ID");
  //   }
  // };

  const handleDisconnect = async (skipPublicSessionsRefresh = false, skipDisconnectToast = false) => {
    
    // Store currentRoom before setting it to null
    const roomToCheck = currentRoom;
    
    setJoined(false);
    setToken(null);
    setCurrentRoom(null);
    
    // Only show disconnect toast if not explicitly skipped
    if (!skipDisconnectToast) {
      toast.info(t("disconnected"));
    }

    // refresh the data
    await dispatch(fetchRooms());
    // Always refresh public sessions for participants to see updated room status
    // Only skip if explicitly requested (e.g., from handleEndSession)
    if (!skipPublicSessionsRefresh) {
      await dispatch(fetchPublicSessions());
    }
    await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));

    // Check if user was a participant (not creator) and show rating dialog
    if (roomToCheck && user && roomToCheck.createdBy._id && roomToCheck.createdBy._id !== user._id) {
      try {
        const { data } = await axiosInstance.get(`/livekit/rooms/${roomToCheck._id}/status`);
        
        const creatorName = roomToCheck.createdBy.username || 
          roomToCheck.createdBy.name || 
          roomToCheck.createdBy.firstName || 
          'Unknown Creator';
        
        setRatingSessionData({
          sessionId: roomToCheck._id,
          roomName: roomToCheck.name || 'Unknown Session',
          creatorName,
          creatorId: roomToCheck.createdBy._id,
        });

        if (data.isActive === false) {
          await dispatch(fetchRooms());
          setShowRatingDialog(true);
        }
      } catch {
        toast.error('Failed to check room status for rating dialog');
      }
    }
  };

  const handleEndSession = async () => {
    if (!currentRoom || !user) return;
    
    // Only room creator can end the session
    if (currentRoom.createdBy._id !== user._id) {
      toast.error("Only the room creator can end the session");
      return;
    }
    
    try {
      await axiosInstance.post(`/livekit/rooms/${currentRoom._id}/end-session`);
      
      // Refresh the data to update the ended sessions tab
      await dispatch(fetchRooms());
      await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
      
      // Always refetch public sessions because room status might have changed
      // (e.g., from Active to Ended, which affects public sessions display)
      await dispatch(fetchPublicSessions());
      
      // Redirect all participants back to meeting page
      // Pass true to skip public sessions refresh since we already did it above
      // Also pass true to skip the disconnect toast since we already show success toast
      handleDisconnect(true, true);
      toast.success("Session ended successfully");
    } catch {
      toast.error("Failed to end session");
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    try {
      // Check if there are any active participants in the room
      const statusResponse = await axiosInstance.get(`/livekit/rooms/${roomToDelete._id}/status`);
      
      if (statusResponse.status === 200) {
        const roomStatus = statusResponse.data;
        const currentParticipants = roomStatus.participantCount || 0;
        
        if (currentParticipants > 0) {
          toast.error(`Cannot delete room. There are currently ${currentParticipants} participant(s) in the room.`);
          setRoomToDelete(null);
          return;
        }
      }
      
      // Send cancellation messages to all invited users before deleting
      if (roomToDelete.isPrivate && roomToDelete.invitedUsers.length > 0) {
        for (const invitedUser of roomToDelete.invitedUsers) {
          await sendInvitationCancellationMessage(invitedUser, roomToDelete);
        }
      }
      
      await dispatch(deleteRoom(roomToDelete._id)).unwrap();
      
      // If the deleted room was public, refetch public sessions
      if (!roomToDelete.isPrivate) {
        await dispatch(fetchPublicSessions());
      }
      
      toast.success(t("roomDeleted"));
    } catch (error: unknown) {
      toast.error("Failed to delete room");
      
      // Check if it's a network error or if the room has participants
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("Cannot delete room while participants are present");
      } else {
        toast.error((error as Error).message || t("failedToDeleteRoom"));
      }
    } finally {
      setRoomToDelete(null);
    }
  };

  const handleJoinRoom = async (room: ReduxRoom) => {
    if (room.isPrivate) {
      // For private rooms, get the secret ID and join
      const secretId = await getRoomSecretId(room._id);
      if (secretId) {
        setCurrentRoom(room);
        joinRoomBySecretId(secretId);
      } else {
        // Check if the endpoint doesn't exist
        if (secretIdEndpointExists === false) {
          toast.error("Private room feature is not available yet");
          console.warn("Cannot join private room - secret ID endpoint not implemented");
          return;
        }
        // The getRoomSecretId function already handles 404 errors gracefully
        // If we get here, it means there was a different error
        toast.error("Unable to join private room - please try again later");
      }
    } else {
      // For public rooms, join directly using the room ID
      setCurrentRoom(room);
      joinRoomByRoomId(room._id);
    }
  };

  const handleJoinPublicSession = (session: PublicSession) => {
    if (!session || !session._id) {
      toast.error("Invalid session data");
      return;
    }
    
    setCurrentRoom(session as unknown as ReduxRoom);
    joinRoomByRoomId(session._id);
  };

  const handleEditRoom = (room: ReduxRoom) => {
    const roomForEdit = {
      ...room,
      inviteEmail: '',
      invitedUsers: room.invitedUsers || [] // Ensure invitedUsers is always an array
    };
    
    // Store original invited users for comparison
    setOriginalInvitedUsers(room.invitedUsers || []);
    setEditingRoom(roomForEdit);
    setShowEditDialog(true);
  };

  const handleDeleteRoomClick = (room: ReduxRoom) => {
    setRoomToDelete(room);
  };

  // Function to send room invitation message to a user
  const sendRoomInvitationMessage = async (invitedUser: User, room: ReduxRoom) => {
    if (!socket || !user) {
      return;
    }

    try {
      // Create a private chat room with the invited user
      socket.emit('createPrivateRoom', { receiverId: invitedUser._id }, (response: { roomId: string }) => {
        if (response && response.roomId) {
          // Send the room invitation message
          const invitationMessage = {
            roomId: response.roomId,
            content: `🎥 You've been invited to join a meeting room!\n\n📋 **Room Details:**\n\n• **Name:** ${room.name}\n\n• **Description:** ${room.description}\n\n• 🔗 **Join the meeting via Link:**\n <${window.location.origin}/meeting/${room._id}/>\n\n👤 **Created by:** ${user.firstName} ${user.lastName} (@${user.username})`,
            type: 'text',
            replyTo: null,
          };
          socket.emit('chat:send_message', invitationMessage, (sendResponse: { success: boolean }) => {
            if (sendResponse && sendResponse.success) {
              toast.success('Invitation message sent successfully!'); 
            } else {
              toast.error('Failed to send invitation message');
            }
          });
        } else {
          toast.error('Failed to create private room for invitation message');
        }
      });
    } catch {
      toast.error('Failed to send room invitation message');
    }
  };

  // Function to send cancellation message for removed users
  const sendInvitationCancellationMessage = async (removedUser: User, room: ReduxRoom) => {
    if (!socket || !user) {
      return;
    }

    try {
      // Create a private chat room with the removed user
      socket.emit('createPrivateRoom', { receiverId: removedUser._id }, (response: { roomId: string }) => {
        if (response && response.roomId) {
          // Send the cancellation message
          const cancellationMessage = {
            roomId: response.roomId,
            content: `❌ **Meeting Invitation Cancelled**\n\nThe invitation to join **${room.name}** has been cancelled.\n\n👤 **Cancelled by:** ${user.username}`,
            type: 'text',
            replyTo: null,
          };

          socket.emit('chat:send_message', cancellationMessage, (sendResponse: { success: boolean }) => {
            if (sendResponse && sendResponse.success) {
              toast.success('Cancellation message sent successfully!');  
            } else {
              toast.error('Failed to send cancellation message');
            }
          });
        } else {
          toast.error('Failed to create private room for cancellation message');
        }
      });
    } catch {
      toast.error('Failed to send invitation cancellation message');
    }
  };

  // Filter public sessions based on search query
  const filteredPublicSessions = (publicSessions || []).filter(session =>
    session.name.toLowerCase().includes(publicSessionsSearchQuery.toLowerCase()) ||
    session.description.toLowerCase().includes(publicSessionsSearchQuery.toLowerCase()) ||
    (session.createdBy?.firstName?.toLowerCase() || '').includes(publicSessionsSearchQuery.toLowerCase()) ||
    (session.createdBy?.lastName?.toLowerCase() || '').includes(publicSessionsSearchQuery.toLowerCase())
  );

  if (joined && token && currentRoom) {
    return (
      <VideoConferenceComponent
        token={token}
        currentRoom={currentRoom}
        onDisconnect={handleDisconnect}
        onEndSession={handleEndSession}
        currentUser={user}
      />
    );
  }

  return (
    <div>
      <Container>
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex gap-2 sm:gap-3">
              {/* <Link href="/">
                <Button variant="ghost" size="icon" className="p-2 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link> */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t("title")}</h1>
                <p className="text-sm sm:text-base text-muted-foreground">{t("subtitle")}</p>
              </div>
            </div>
            <Link href="/ratings">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Ratings
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
          <TabsList className="grid w-full grid-cols-3 h-auto sm:h-10 mb-3">
            <TabsTrigger value="public" className="text-xs sm:text-sm py-2 sm:py-1.5">{t("publicSessions")}</TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs sm:text-sm py-2 sm:py-1.5">My Sessions</TabsTrigger>
            <TabsTrigger value="ended" className="text-xs sm:text-sm py-2 sm:py-1.5">Sessions History</TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold">
                {t("publicSessionsTitle")}
              </h2>
              
              {/* <div className="grid grid-cols-1">
                <JoinPublicSessionCard
                  roomId={roomId}
                  setRoomId={setRoomId}
                  onJoinSession={() => joinRoomByRoomId()}
                  isLoading={isJoiningPublicSession}
                  isUserInRoom={joined}
                />
              </div> */}

              <PublicSessionsSearch
                searchQuery={publicSessionsSearchQuery}
                onSearchChange={setPublicSessionsSearchQuery}
              />

              <div className="grid gap-3 sm:gap-4">
                {publicSessionsLoading ? (
                  <Card className="dark:border-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mb-3" />
                      <p className="text-sm text-muted-foreground">Loading public sessions...</p>
                    </CardContent>
                  </Card>
                ) : publicSessions && publicSessions.length > 0 ? (
                   // Sort public sessions by creation date (newest first)
                   [...filteredPublicSessions]
                     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                     .map((session) => {
                       // Convert PublicSession to Room format for RoomCard
                       const roomData = {
                         _id: session._id,
                         name: session.name,
                         description: session.description || '',
                         isPrivate: false, // Public sessions are always public
                         maxParticipants: session.maxParticipants || 10,
                         createdAt: session.createdAt,
                         createdBy: session.createdBy || { _id: '', username: '', firstName: '', lastName: '', email: '' } as User,
                         invitedUsers: [],
                         isActive: session.isActive || false,
                         currentParticipants: session.currentParticipants || 0,
                         secretId: '', // Public sessions don't have secret IDs
                         updatedAt: session.updatedAt || session.createdAt
                       };
                       
                      return (
                          <RoomCard
                             key={session._id}
                             room={roomData}
                             onJoinRoom={() => handleJoinPublicSession(session)} // Use handleJoinPublicSession
                             onEditRoom={() => {}} // No edit for public sessions
                             onDeleteRoom={() => {}} // No delete for public sessions
                             getRoomSecretId={() => Promise.resolve(null)} // No secret ID for public sessions
                             currentUser={user || undefined}
                             isUserInRoom={joined}
                             showActions={true} // Show actions but hide edit/delete
                             showRating={false} // No rating for public sessions
                             showEditDelete={false} // Hide edit/delete for public sessions
                             showCopyButton={false} // Hide copy button for public sessions
                           />
                        );
                     })
                 ) : (
                  <Card className="dark:border-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                      <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                      <p className="text-sm text-base text-muted-foreground text-center">
                        {publicSessionsSearchQuery ? "No public sessions found matching your search." : t("noPublicSessions")}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold">My Sessions</h2>
              <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                {t("createRoom")}
              </Button>
            </div>

            <div className="space-y-6">
              {/* Open Sessions */}
              <div className="space-y-3">
                <div className="grid gap-3 sm:gap-4">
                  {rooms.filter(room => room.isActive).length === 0 ? (
                    <Card className="flex items-center dark:border-transparent">
                      <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                        <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-muted-foreground text-center">
                          No sessions
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    // Sort open rooms by creation date (newest first)
                    [...rooms]
                      .filter(room => room.isActive)
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((room) => (
                        <RoomCard
                          key={room._id}
                          room={room}
                          onJoinRoom={handleJoinRoom}
                          onEditRoom={handleEditRoom}
                          onDeleteRoom={handleDeleteRoomClick}
                          getRoomSecretId={getRoomSecretId}
                          currentUser={user || undefined}
                          isUserInRoom={joined}
                          showCopyButton={true}
                        />
                      ))
                  )}
                </div>
              </div>


            </div>
          </TabsContent>

          <TabsContent value="ended" className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Session History
                </h2>
              </div>
              
              {/* Session Statistics */}
              {!sessionHistoryLoading && sessionHistory && sessionHistory.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <Card className="dark:border-transparent">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-primary">{totalRooms}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Total Sessions</div>
                    </CardContent>
                  </Card>
                  <Card className="dark:border-transparent">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">{activeRooms}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Open Sessions</div>
                    </CardContent>
                  </Card>
                  <Card className="dark:border-transparent">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">{endedRooms}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Ended Sessions</div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {sessionHistoryLoading ? (
                <Card className="dark:border-transparent">
                  <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mb-3" />
                    <p className="text-sm text-muted-foreground">Loading your session history...</p>
                  </CardContent>
                </Card>
              ) : sessionHistory && sessionHistory.length > 0 ? (
                <div className="space-y-4">
                  {/* Open Sessions */}
                  <SessionHistorySection
                    title="Open Sessions"
                    sessions={sessionHistory.filter(session => session.isActive)}
                    emptyIcon={<Video className="h-8 w-8 text-muted-foreground mb-2" />}
                    emptyMessage="No open sessions"
                    sessionRatings={sessionRatings}
                    sessionRatingCounts={sessionRatingCounts}
                    isSessionRated={isSessionRated}
                    onRateSession={handleRateSession}
                    currentUser={user}
                    renderStarRating={renderStarRating}
                  />

                  {/* Ended Sessions */}
                  <SessionHistorySection
                    title="Ended Sessions"
                    sessions={sessionHistory.filter(session => !session.isActive)}
                    emptyIcon={<Globe className="h-8 w-8 text-muted-foreground mb-2" />}
                    emptyMessage="No ended sessions"
                    sessionRatings={sessionRatings}
                    sessionRatingCounts={sessionRatingCounts}
                    isSessionRated={isSessionRated}
                    onRateSession={handleRateSession}
                    currentUser={user}
                    renderStarRating={renderStarRating}
                  />
                  
                  {/* Load More Button */}
                  {hasMoreSessions && sessionHistory && sessionHistory.length > 0 && (
                    <div className="flex flex-col items-center gap-3 pt-4">
                      <Button
                        onClick={handleLoadMoreSessions}
                        disabled={isLoadingMore}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More Sessions
                            <span className="text-xs text-muted-foreground">
                              ({sessionHistory.length} of {totalSessions})
                            </span>
                          </>
                        )}
                      </Button>
                      
                      {/* Pagination Info */}
                      <div className="text-xs text-muted-foreground text-center">
                        Page {currentPage} • {Math.ceil(totalSessions / 10)} total pages
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <Card className="dark:border-transparent">
                  <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                    <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                    <p className="text-sm text-muted-foreground text-center">
                      You haven&apos;t participated in any sessions yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          
        </Tabs>

        {/* Create Room Dialog */}
        <RoomDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          mode="create"
          roomData={newRoomData as unknown as Room}
          onRoomDataChange={(data: Room) => setNewRoomData(data as unknown as { 
              name: string; 
              description: string; 
              isPrivate: boolean; 
              maxParticipants: number; 
              invitedUsers: User[]; 
              inviteEmail: string; 
              scheduledStartTime: string | undefined; 
            })}
          onSubmit={handleCreateRoom}
          isLoading={createLoading}
          followedUsers={followedUsers}
          showSuggestionMenu={showSuggestionMenu}
          setShowSuggestionMenu={setShowSuggestionMenu}
          currentUser={user || undefined}
        />

        {/* Edit Room Dialog */}
        <RoomDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          mode="edit"
          roomData={editingRoom || ({} as Room)}
          onRoomDataChange={setEditingRoom}
          onSubmit={async () => {
            if (editingRoom) {
              // Convert invitedUsers from User[] to string[] (emails)
              const invitedEmails = editingRoom.invitedUsers
                .map(user => user.email)
                .filter((email): email is string => 
                  email !== undefined && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                );

              // Ensure scheduledStartTime is properly formatted for the backend
              // If it's undefined, send null to explicitly clear it
              const scheduledStartTime = editingRoom.scheduledStartTime === undefined ? null : editingRoom.scheduledStartTime;
              
              const roomDataToSend: UpdateRoomData = {
                name: editingRoom.name,
                description: editingRoom.description,
                isPrivate: editingRoom.isPrivate,
                maxParticipants: editingRoom.maxParticipants,
                invitedUsers: invitedEmails,
                scheduledStartTime: scheduledStartTime
              };

              try {
                const updatedRoom = await dispatch(updateRoom({ roomId: editingRoom._id, roomData: roomDataToSend })).unwrap();
                
                // Manually update the local state to ensure scheduledStartTime is correctly updated
                // This is necessary because the backend might not send undefined values properly
                const manuallyUpdatedRoom = {
                  ...updatedRoom,
                  scheduledStartTime: editingRoom.scheduledStartTime
                };
                
                // Update the Redux store manually to ensure our changes are reflected
                dispatch({
                  type: 'meeting/updateRoom/fulfilled',
                  payload: manuallyUpdatedRoom
                });
                
                // Always refetch public sessions because room status might have changed
                // (e.g., from Open to Scheduled, or vice versa)
                await dispatch(fetchPublicSessions());
                
                // Compare original vs new invited users and send appropriate messages
                if (editingRoom.isPrivate) {
                  const originalEmails = originalInvitedUsers.map(user => user.email).filter(Boolean);
                  const newEmails = invitedEmails;
                  
                  // Find removed users (in original but not in new)
                  const removedUsers = originalInvitedUsers.filter(user => 
                    user.email && !newEmails.includes(user.email)
                  );
                  
                  // Find added users (in new but not in original)
                  const addedUsers = editingRoom.invitedUsers.filter(user => 
                    user.email && !originalEmails.includes(user.email)
                  );
                  
                  // Send cancellation messages to removed users
                  for (const removedUser of removedUsers) {
                    await sendInvitationCancellationMessage(removedUser, editingRoom);
                  }
                  
                  // Send invitation messages to newly added users
                  const secretId = await getRoomSecretId(editingRoom._id);
                  if (secretId) {
                    for (const addedUser of addedUsers) {
                      await sendRoomInvitationMessage(addedUser, updatedRoom);
                    }
                  }
                }
                
                // Refresh rooms data to ensure everything is up to date
                await dispatch(fetchRooms());
                
                setShowEditDialog(false);
                setEditingRoom(null);
                setOriginalInvitedUsers([]);
              } catch {
                toast.error("Failed to update room");
              }
            }
          }}
          isLoading={updateLoading}
          followedUsers={followedUsers}
          showSuggestionMenu={showSuggestionMenu}
          setShowSuggestionMenu={setShowSuggestionMenu}
          currentUser={user || undefined}
        />

        {/* Confirm Delete Dialog */}
        <DeleteConfirmDialog
          open={!!roomToDelete}
          onOpenChange={(open) => {
            if (!open) setRoomToDelete(null);
          }}
          onConfirm={handleDeleteRoom}
        />

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
              if (ratingSessionData && user?._id) {
                // Add the session to our rated sessions set
                const newRatedSessions = new Set([...ratedSessions, ratingSessionData.sessionId]);
                setRatedSessions(newRatedSessions);
                
                // Refresh the rating for this session
                if (ratingSessionData.sessionId) {
                  fetchSessionRating(ratingSessionData.sessionId);
                }
              }
              setRatingSessionData(null);
            }}
          />
        )}

        {/* {error && (
          <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg">
            {error}
          </div>
        )} */}
      </Container>
    </div>
  );
}; 