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
  ArrowLeft,
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
  Room
} from '@/store/slices/meetingSlice';
import { RoomDialog } from "./RoomDialog";
import { VideoConferenceComponent } from "./VideoConference";
import { RoomCard } from "./RoomCard";
import { JoinMeetingCard } from "./JoinMeetingCard";
import { CreateRoomCard } from "./CreateRoomCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { JoinPublicSessionCard } from "./JoinPublicSessionCard";
import { PublicSessionCard } from "./PublicSessionCard";
import { PublicSessionsSearch } from "./PublicSessionsSearch";
import { useContext } from 'react';
import { SocketContext } from '@/store/Provider';
import axiosInstance from '@/lib/axios';
import axios from 'axios';
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import { SessionRatingDialog } from '@/components/rating';
import { ratingService } from '@/services/ratingService';


export const MeetingClient = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms, publicSessions, error, createLoading, updateLoading, publicSessionsLoading, sessionHistory, sessionHistoryLoading } = useSelector((state: RootState) => state.meeting);
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
    name: "",
    description: "",
    isPrivate: false,
    maxParticipants: 10,
    invitedUsers: [] as User[], // Array of User objects for UI
    inviteEmail: ''
  });
  const [publicSessionsSearchQuery, setPublicSessionsSearchQuery] = useState("");

  const resetNewRoomData = () => {
    setNewRoomData({
      name: "",
      description: "",
      isPrivate: false,
      maxParticipants: 10,
      invitedUsers: [],
      inviteEmail: ''
    });
  };
  
  const [roomToDelete, setRoomToDelete] = useState<ReduxRoom | null>(null);
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false);
  const [isJoiningBySecretId, setIsJoiningBySecretId] = useState(false);
  const [isJoiningPublicSession, setIsJoiningPublicSession] = useState(false);
  
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

  const t = useTranslations("meeting");
  const socket = useContext(SocketContext);

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
      <div className="flex items-center gap-1">
        {stars}
        <span className={`ml-1 text-xs ${size === 'sm' ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  useEffect(() => {
    console.log('Current User:', user);
    console.log('Followed Users:', followedUsers);
  }, [user, followedUsers]);

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
            console.error('Failed to fetch followed users:', response.statusText);
            toast.error("Failed to fetch followed users");
          }
        } else {
          console.warn('No user ID available to fetch followed users');
        }
      } catch (error) {
        console.error("Error fetching followed users:", error);
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
        invitedUsers: newRoomData.isPrivate ? invitedEmails : [] // Only send invitedUsers for private rooms
      };

      console.log('Creating room with data:', roomDataToSend);
      console.log('Room is private:', newRoomData.isPrivate);

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
        const secretId = result.secretId;
        for (const invitedUser of newRoomData.invitedUsers) {
          await sendRoomInvitationMessage(invitedUser, result, secretId);
        }
      }
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error((error as Error).message || "Failed to create room");
    }
  };

  useEffect(() => {
    if (user?._id) {
      const fetchData = async () => {
      await dispatch(fetchRooms());
        await dispatch(fetchPublicSessions());
        await dispatch(fetchSessionHistory());
      };
      fetchData();
      
      // Check for already rated sessions (you can implement this API call)
      // For now, we'll use localStorage to persist rated sessions
      const savedRatedSessions = localStorage.getItem(`ratedSessions_${user._id}`);
      if (savedRatedSessions) {
        try {
          const ratedSessionsArray = JSON.parse(savedRatedSessions);
          setRatedSessions(new Set(ratedSessionsArray));
        } catch (error) {
          console.error('Failed to parse rated sessions from localStorage:', error);
        }
      }
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

    setIsJoiningBySecretId(true);
    try {
      const roomResponse = await axiosInstance.get(`/livekit/rooms/join/${idToJoin}`);

      if (roomResponse.status !== 200) {
        console.error("Failed to join room:", roomResponse.status, roomResponse.data);
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
      } catch (error) {
        console.error('Failed to get live room status:', error);
        setCurrentRoom(room);
      }

      const tokenResponse = await axiosInstance.get(`/livekit/token?secretId=${idToJoin}`);

      if (tokenResponse.status !== 200) {
        console.error("Failed to get token:", tokenResponse.status, tokenResponse.data);

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
      console.log("Token data:", tokenData);

      if (!tokenData.token) {
        console.error("No token in response:", tokenData);
        toast.error("Invalid token response from server");
        return;
      }

      const { token: livekitToken } = tokenData;

      setToken(livekitToken);
      setJoined(true);
      setSecretId("");
      toast.success(t("joinedRoom"));
    } catch (error) {
      console.error("Network error joining room:", error);
      toast.error(t("failedToJoinRoom"));
    } finally {
      setIsJoiningBySecretId(false);
    }
  };

  const joinRoomByRoomId = async (rid?: string) => {
    const idToJoin = rid ?? roomId;
    console.log('joinRoomByRoomId called with idToJoin:', idToJoin);
    
    if (!idToJoin || !idToJoin.trim()) {
      toast.error("Please enter a room ID");
      return;
    }

    setIsJoiningPublicSession(true);
    try {
      console.log('Making request to join public room:', idToJoin);
      // Use the join-public endpoint for public rooms
      const roomResponse = await axiosInstance.get(`/livekit/rooms/join-public/${idToJoin}`);

      if (roomResponse.status !== 200) {
        console.error("Failed to join room:", roomResponse.status, roomResponse.data);
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
      } catch (error) {
        console.error('Failed to get live room status:', error);
        setCurrentRoom(room);
      }

      // Use the correct token endpoint for getting tokens by room ID
      const tokenResponse = await axiosInstance.get(`/livekit/token/room?roomId=${idToJoin}`);

      if (tokenResponse.status !== 200) {
        console.error("Failed to get token:", tokenResponse.status, tokenResponse.data);

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
      console.log("Token data:", tokenData);

      if (!tokenData.token) {
        console.error("No token in response:", tokenData);
        toast.error("Invalid token response from server");
        return;
      }

      const { token: livekitToken } = tokenData;

      setToken(livekitToken);
      setJoined(true);
      setRoomId("");
      toast.success(t("joinedRoom"));
    } catch (error) {
      console.error("Network error joining room:", error);
      toast.error(t("failedToJoinRoom"));
    } finally {
      setIsJoiningPublicSession(false);
    }
  };

  // Remove updateRoom function since we're using Redux updateRoom thunk

  const getRoomSecretId = async (roomId: string) => {
    try {
      const response = await axiosInstance.get(`/livekit/rooms/${roomId}/secret-id`);

      if (response.status === 200) {
        const { secretId } = response.data;
        return secretId;
      } else {
        toast.error("Failed to get secret ID");
        return null;
      }
    } catch (error) {
      console.error("Failed to get secret ID:", error);
      toast.error("Failed to get secret ID");
      return null;
    }
  };

  const copySecretId = async (roomId: string) => {
    // Find the room to check if it's public or private
    const room = rooms.find(r => r._id === roomId);
    
    if (room?.isPrivate) {
      // For private rooms, copy the secret ID
      const secretId = await getRoomSecretId(roomId);
      if (secretId) {
        try {
          await navigator.clipboard.writeText(secretId);
          toast.success(t("secretIdCopied"));
        } catch (error) {
          console.error("Failed to copy secret ID:", error);
          toast.error(t("failedToCopyId"));
        }
      }
    } else {
      // For public rooms, copy the room ID directly
      try {
        await navigator.clipboard.writeText(roomId);
        toast.success("Room ID copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy room ID:", error);
        toast.error("Failed to copy room ID");
      }
    }
  };

  const copyRoomId = async (roomId: string) => {
    if (!roomId || typeof roomId !== 'string') {
      toast.error("Invalid room ID");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy room ID:", error);
      toast.error("Failed to copy room ID");
    }
  };

  const handleDisconnect = async () => {
    // Check if user was a participant (not creator) and show rating dialog
    if (currentRoom && user && currentRoom.createdBy._id && currentRoom.createdBy._id !== user._id) {
      const creatorName = currentRoom.createdBy.username || 
                         currentRoom.createdBy.name || 
                         currentRoom.createdBy.firstName || 
                         'Unknown Creator';
      
      setRatingSessionData({
        sessionId: currentRoom._id,
        roomName: currentRoom.name || 'Unknown Session',
        creatorName,
        creatorId: currentRoom.createdBy._id,
      });
      setShowRatingDialog(true);
    }
    
    setJoined(false);
    setToken(null);
    setCurrentRoom(null);
    toast.info(t("disconnected"));

    // refresh the data
    await dispatch(fetchRooms());
    await dispatch(fetchPublicSessions());
    await dispatch(fetchSessionHistory());
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
      await dispatch(fetchSessionHistory());
      if (!currentRoom.isPrivate) {
        await dispatch(fetchPublicSessions());
      }
      
      // Redirect all participants back to meeting page
      handleDisconnect();
      toast.success("Session ended successfully");
    } catch (error) {
      console.error("Failed to end session:", error);
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
      console.error("Failed to delete room:", error);
      
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
    console.log('handleJoinRoom called with room:', room);
    console.log('Room is private:', room.isPrivate);
    
    if (room.isPrivate) {
      // For private rooms, get the secret ID and join
      console.log('Joining private room with secret ID');
      const secretId = await getRoomSecretId(room._id);
      if (secretId) {
        setCurrentRoom(room);
        joinRoomBySecretId(secretId);
      } else {
        toast.error("Failed to get secret ID for private room");
      }
    } else {
      // For public rooms, join directly using the room ID
      console.log('Joining public room with room ID:', room._id);
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
  const sendRoomInvitationMessage = async (invitedUser: User, room: ReduxRoom, secretId: string) => {
    if (!socket || !user) {
      console.error('Socket or user not available');
      return;
    }

    try {
      // Create a private chat room with the invited user
      socket.emit('createPrivateRoom', { receiverId: invitedUser._id }, async (response: { roomId: string }) => {
        if (response && response.roomId) {
          // Send the room invitation message
          const invitationMessage = {
            roomId: response.roomId,
            content: `🎥 You've been invited to join a meeting room!\n\n📋 **Room Details:**\n\n• **Name:** ${room.name}\n\n• **Description:** ${room.description}\n\n• **Secret ID:** \`${secretId}\`\n\n🔗 **Join the meeting:**\nUse the secret ID above to join the room at: ${window.location.origin}/meeting\n\n👤 **Created by:** ${user.firstName} ${user.lastName} (@${user.username})`,
            type: 'text',
            replyTo: null,
          };

          socket.emit('chat:send_message', invitationMessage);
        } else {
          console.error('Failed to create private room for invitation message');
        }
      });
    } catch (error) {
      console.error('Error sending room invitation message:', error);
    }
  };

  // Function to send cancellation message for removed users
  const sendInvitationCancellationMessage = async (removedUser: User, room: ReduxRoom) => {
    if (!socket || !user) {
      console.error('Socket or user not available');
      return;
    }

    try {
      // Create a private chat room with the removed user
      socket.emit('createPrivateRoom', { receiverId: removedUser._id }, async (response: { roomId: string }) => {
        if (response && response.roomId) {
          // Send the cancellation message
          const cancellationMessage = {
            roomId: response.roomId,
            content: `❌ **Meeting Invitation Cancelled**\n\nThe invitation to join **${room.name}** has been cancelled.\n\n👤 **Cancelled by:** ${user.username}`,
            type: 'text',
            replyTo: null,
          };

          socket.emit('chat:send_message', cancellationMessage);
        } else {
          console.error('Failed to create private room for cancellation message');
        }
      });
    } catch (error) {
      console.error('Error sending invitation cancellation message:', error);
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
    <div className="min-h-screen bg-background">
      <Container>
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 sm:gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="p-2 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t("title")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{t("subtitle")}</p>
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
          <TabsList className="grid w-full grid-cols-4 h-auto sm:h-10 mb-3">
            <TabsTrigger value="public" className="text-xs sm:text-sm py-2 sm:py-1.5">{t("publicSessions")}</TabsTrigger>
            <TabsTrigger value="join" className="text-xs sm:text-sm py-2 sm:py-1.5">Private Sessions</TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs sm:text-sm py-2 sm:py-1.5">{t("myRooms")}</TabsTrigger>
            <TabsTrigger value="ended" className="text-xs sm:text-sm py-2 sm:py-1.5">Sessions History</TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold">
                {t("publicSessionsTitle")}
              </h2>
              
              <div className="grid grid-cols-1">
                <JoinPublicSessionCard
                  roomId={roomId}
                  setRoomId={setRoomId}
                  onJoinSession={() => joinRoomByRoomId()}
                  isLoading={isJoiningPublicSession}
                  isUserInRoom={joined}
                />
              </div>

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
                     .map((session) => (
                       <PublicSessionCard
                         key={session._id}
                         session={session}
                         onJoinSession={handleJoinPublicSession}
                         onCopyRoomId={copyRoomId}
                         isUserInRoom={joined}
                       />
                     ))
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

          <TabsContent value="join" className="space-y-4 sm:space-y-6 ">
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold">Private Sessions</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <JoinMeetingCard
                  secretId={secretId}
                  setSecretId={setSecretId}
                  onJoinRoom={() => joinRoomBySecretId()}
                  isLoading={isJoiningBySecretId}
                  isUserInRoom={joined}
                />

                <CreateRoomCard
                  onCreateRoom={() => setShowCreateDialog(true)}
                  isLoading={createLoading}
                  />
                </div>
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold">{t("myRooms")}</h2>
              <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                {t("createRoom")}
              </Button>
            </div>

            <div className="space-y-6">
              {/* Open Sessions */}
              <div className="space-y-3">
                <h3 className="text-base font-medium text-muted-foreground">Open Sessions</h3>
                <div className="grid gap-3 sm:gap-4">
                  {rooms.filter(room => room.isActive).length === 0 ? (
                    <Card className="flex items-center dark:border-transparent">
                      <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                        <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-muted-foreground text-center">
                          No open sessions
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
                          onCopySecretId={copySecretId}
                          onJoinRoom={handleJoinRoom}
                          onEditRoom={handleEditRoom}
                          onDeleteRoom={handleDeleteRoomClick}
                          getRoomSecretId={getRoomSecretId}
                          currentUser={user || undefined}
                          isUserInRoom={joined}
                        />
                      ))
                  )}
                </div>
              </div>

                                                           {/* Ended Sessions */}
                <div className="space-y-3">
                  <h3 className="text-base font-medium text-muted-foreground">Ended Sessions</h3>
                  <div className="grid gap-3 sm:gap-4">
                                         {sessionHistory && sessionHistory.filter(session => !session.isActive && session.createdBy?._id === user?._id).length === 0 ? (
                      <Card className="flex items-center dark:border-transparent">
                        <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                          <Globe className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                          <p className="text-sm sm:text-base text-muted-foreground text-center">
                            No ended sessions
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                                             // Sort ended sessions by creation date (newest first) - ONLY YOUR ROOMS
                       [...(sessionHistory || [])]
                         .filter(session => !session.isActive && session.createdBy?._id === user?._id)
                         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                         .map((session) => {
                           // Convert session to room format for RoomCard
                           const roomData = {
                             _id: session.roomId,
                             name: session.roomName,
                             description: session.roomDescription, // SessionHistory doesn't have description
                             isPrivate: session.isPrivate,
                             maxParticipants: 10,
                             createdAt: session.createdAt,
                             createdBy: session.createdBy || { _id: '', username: '', firstName: '', lastName: '', email: '' } as User,
                             invitedUsers: [],
                             isActive: false,
                             currentParticipants: 0,
                             secretId: '', // Required by Room type
                             updatedAt: session.createdAt // Use createdAt as updatedAt since SessionHistory doesn't have it
                           };
                           
                                                       return (
                              <div key={session.roomId}>
                                <RoomCard
                                  room={roomData}
                                  onCopySecretId={() => {}} // No action needed for ended sessions
                                  onJoinRoom={() => {}} // No action needed for ended sessions
                                  onEditRoom={() => {}} // No action needed for ended sessions
                                  onDeleteRoom={() => {}} // No action needed for ended sessions
                                  getRoomSecretId={() => Promise.resolve(null)} // No action needed for ended sessions
                                  currentUser={user || undefined}
                                  isUserInRoom={false}
                                  showActions={false} // Hide all action buttons
                                  showRating={true} // Show rating inside the card
                                  rating={sessionRatings[session.roomId] || 0}
                                  ratingCount={sessionRatingCounts[session.roomId] || 0}
                                  ratingLoading={ratingsLoading[session.roomId] || false}
                                />
                              </div>
                            );
                         })
                    )}
                  </div>
                </div>
            </div>
          </TabsContent>

          <TabsContent value="ended" className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold">
                  My Session History
                </h2>
              </div>
              
              {sessionHistoryLoading ? (
                <Card className="dark:border-transparent">
                  <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mb-3" />
                    <p className="text-sm text-muted-foreground">Loading your session history...</p>
                  </CardContent>
                </Card>
              ) : sessionHistory && sessionHistory.length > 0 ? (
                <div className="space-y-4">
                  {/* Active Sessions */}
                  <div className="space-y-3">
                    <h3 className="text-base font-medium text-muted-foreground">Active Sessions</h3>
                    <div className="grid gap-3 sm:gap-4">
                      {sessionHistory.filter(session => session.isActive).length === 0 ? (
                        <Card className="dark:border-transparent">
                          <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6">
                            <Video className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground text-center">
                              No active sessions
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        [...sessionHistory]
                          .filter(session => session.isActive)
                          .sort((a, b) => {
                            // Handle null lastJoined values
                            const aDate = a.lastJoined ? new Date(a.lastJoined).getTime() : 0;
                            const bDate = b.lastJoined ? new Date(b.lastJoined).getTime() : 0;
                            return bDate - aDate;
                          })
                          .map((session) => (
                            <Card key={session.roomId} className="p-4 dark:border-transparent shadow-none">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{session.roomName}</h4>
                                    <Badge variant={session.isPrivate ? "secondary" : "default"}>
                                      {session.isPrivate ? "Private" : "Public"}
                                    </Badge>
                                    <Badge variant="outline" className="text-green-600">
                                      Active
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Created by <Link href={`/profile/${session.createdBy?.username}`} className="text-primary hover:underline">{session.createdBy?.username || 'Unknown'}</Link>
                                  </p>
                                  {/* <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                    <span>Joined {session.joinCount} time(s)</span>
                                    <span>Last: {session.lastJoined ? formatTime(session.lastJoined) : 'Never'}</span>
                                    <span>Total time: {totalTimeSpent(session.totalTimeSpent)}</span>
                                  </div> */}
                                </div>
                              </div>
                            </Card>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Ended Sessions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-muted-foreground">Ended Sessions</h3>
                      {sessionHistory.filter(session => !session.isActive).length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Overall Rating:</span>
                          {(() => {
                            const endedSessions = sessionHistory.filter(session => !session.isActive);
                            const sessionsWithRatings = endedSessions.filter(session => 
                              sessionRatings[session.roomId] > 0
                            );
                            
                            if (sessionsWithRatings.length === 0) {
                              return <span>No ratings yet</span>;
                            }
                            
                            const totalRating = sessionsWithRatings.reduce((sum, session) => 
                              sum + sessionRatings[session.roomId], 0
                            );
                            const averageRating = totalRating / sessionsWithRatings.length;
                            
                            return (
                              <div className="flex items-center gap-1">
                                {renderStarRating(averageRating, 'sm')}
                                <span>({sessionsWithRatings.length} session{sessionsWithRatings.length !== 1 ? 's' : ''})</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-3 sm:gap-4">
                      {sessionHistory.filter(session => !session.isActive).length === 0 ? (
                        <Card className="dark:border-transparent">
                          <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6">
                            <Globe className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground text-center">
                              No ended sessions
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        [...sessionHistory]
                          .filter(session => !session.isActive)
                          .sort((a, b) => {
                            // Handle null lastJoined values
                            const aDate = a.lastJoined ? new Date(a.lastJoined).getTime() : 0;
                            const bDate = b.lastJoined ? new Date(b.lastJoined).getTime() : 0;
                            return bDate - aDate;
                          })
                          .map((session) => (
                            <Card key={session.roomId} className="p-4 dark:border-transparent shadow-none">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{session.roomName}</h4>
                                    <Badge variant={session.isPrivate ? "secondary" : "default"}>
                                      {session.isPrivate ? "Private" : "Public"}
                                    </Badge>
                                    <Badge variant="outline" className="text-red-600">
                                      Ended
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Created by <Link href={`/profile/${session.createdBy?.username}`} className="text-primary hover:underline">{session.createdBy?.username || 'Unknown'}</Link>
                                  </p>
                                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                    {/* <span>Joined {session.joinCount} time(s)</span>
                                    <span>Last: {session.lastJoined ? formatTime(session.lastJoined) : 'Never'}</span>
                                    <span>Total time: {totalTimeSpent(session.totalTimeSpent)}</span> */}
                                    {session.endedAt && (
                                      <span>Ended: {formatTime(session.endedAt!)}</span>
                                    )}
                                    {ratedSessions.has(session.roomId) && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <Star className="h-3 w-3 fill-current" />
                                        <span>Rated</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Average Rating Display */}
                                  <div className="mt-3 flex items-center gap-2">
                                    {ratingsLoading[session.roomId] ? (
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        <span className="text-xs text-muted-foreground">Loading rating...</span>
                                      </div>
                                    ) : sessionRatings[session.roomId] > 0 ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Average Rating:</span>
                                        {renderStarRating(sessionRatings[session.roomId], 'sm')}
                                        <span className="text-xs text-muted-foreground">
                                          ({sessionRatingCounts[session.roomId]} rating{sessionRatingCounts[session.roomId] !== 1 ? 's' : ''})
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">No ratings yet</span>
                                        <div className="flex gap-1">
                                          {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="h-3 w-3 text-gray-300" />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
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
                                    }}
                                    disabled={!session.createdBy?._id || session.createdBy._id === user?._id || ratedSessions.has(session.roomId)}
                                    className="flex items-center gap-2"
                                  >
                                    <Star className="h-4 w-4" />
                                    {ratedSessions.has(session.roomId) ? 'Already Rated' : 'Rate Session'}
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))
                      )}
                    </div>
                  </div>
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
          onRoomDataChange={(data: Room) => setNewRoomData(data as unknown as { name: string; description: string; isPrivate: boolean; maxParticipants: number; invitedUsers: User[]; inviteEmail: string; })}
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

              const roomDataToSend: UpdateRoomData = {
                name: editingRoom.name,
                description: editingRoom.description,
                isPrivate: editingRoom.isPrivate,
                maxParticipants: editingRoom.maxParticipants,
                invitedUsers: invitedEmails
              };

              try {
                const updatedRoom = await dispatch(updateRoom({ roomId: editingRoom._id, roomData: roomDataToSend })).unwrap();
                
                // If the room was changed to public, refetch public sessions
                if (editingRoom.isPrivate && !roomDataToSend.isPrivate) {
                  await dispatch(fetchPublicSessions());
                }
                
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
                      await sendRoomInvitationMessage(addedUser, updatedRoom, secretId);
                    }
                  }
                }
                
                setShowEditDialog(false);
                setEditingRoom(null);
                setOriginalInvitedUsers([]);
              } catch (error) {
                console.error('Update room error:', error);
                toast.error((error as Error).message || "Failed to update room");
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
                const newRatedSessions = new Set([...ratedSessions, ratingSessionData.sessionId]);
                setRatedSessions(newRatedSessions);
                
                // Save to localStorage
                localStorage.setItem(`ratedSessions_${user._id}`, JSON.stringify([...newRatedSessions]));
                
                // Refresh the rating for this session
                if (ratingSessionData.sessionId) {
                  fetchSessionRating(ratingSessionData.sessionId);
                }
              }
              setRatingSessionData(null);
            }}
          />
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg">
            {error}
          </div>
        )}
      </Container>
    </div>
  );
}; 