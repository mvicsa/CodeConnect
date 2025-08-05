"use client";

import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Video,
  Users,
  Plus,
  Copy,
  Trash2,
  Edit,
  Calendar,
  Clock,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Container from "@/components/Container";
import { User } from "@/types/user";
import { getAuthToken } from "@/lib/cookies";
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchFollowing } from '@/store/slices/followSlice';
import { 
  fetchRooms, 
  createRoom, 
  updateRoom, 
  deleteRoom,
  clearError,
  type Room as ReduxRoom,
  type CreateRoomData,
  type UpdateRoomData
} from '@/store/slices/meetingSlice';
import { RoomDialog } from "./RoomDialog";
import { VideoConferenceComponent } from "./VideoConference";
import { RoomCard } from "./RoomCard";
import { JoinMeetingCard } from "./JoinMeetingCard";
import { CreateRoomCard } from "./CreateRoomCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useContext } from 'react';
import { SocketContext } from '@/store/Provider';
import axiosInstance from '@/lib/axios';

// Remove local Room interface since we're using ReduxRoom from meetingSlice

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const MeetingClient = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms, loading, error, createLoading, updateLoading, deleteLoading } = useSelector((state: RootState) => state.meeting);
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: followedUsers } = useSelector((state: RootState) => state.follow.following);
  
  const [token, setToken] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<ReduxRoom | null>(null);
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState("join");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [secretId, setSecretId] = useState("");
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
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false);

  const t = useTranslations("meeting");
  const socket = useContext(SocketContext);

  useEffect(() => {
    console.log('Current User:', user);
    console.log('Followed Users:', followedUsers);
  }, [user, followedUsers]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/users');
        setAvailableUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      }
    };

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

    fetchUsers();
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

      const roomDataToSend: CreateRoomData = {
        name: newRoomData.name,
        description: newRoomData.description,
        isPrivate: newRoomData.isPrivate,
        maxParticipants: newRoomData.maxParticipants,
        invitedUsers: invitedEmails
      };

      const result = await dispatch(createRoom(roomDataToSend)).unwrap();
      
      toast.success("Room created successfully!");
      setShowCreateDialog(false);
      resetNewRoomData();
      
      // Refetch rooms to get complete data with createdBy information
      await dispatch(fetchRooms());
      
      // Send invitation messages if room is private and has invited users
      if (newRoomData.isPrivate && newRoomData.invitedUsers.length > 0) {
        const secretId = result.secretId;
        for (const invitedUser of newRoomData.invitedUsers) {
          await sendRoomInvitationMessage(invitedUser, result, secretId);
        }
      }
    } catch (error: any) {
      console.error("Error creating room:", error);
      toast.error(error.message || "Failed to create room");
    }
  };

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchRooms());
    }
  }, [dispatch, user?._id]);

  const joinRoomBySecretId = async (sid?: string) => {
    const idToJoin = sid ?? secretId;
    if (!idToJoin.trim()) {
      toast.error(t("pleaseEnterSecretId"));
      return;
    }

    // Loading state is handled by Redux
    try {
      const roomResponse = await axiosInstance.get(`/livekit/rooms/join/${idToJoin}`);

      if (roomResponse.status !== 200) {
        console.error("Failed to join room:", roomResponse.status, roomResponse.data);
        toast.error(t("invalidSecretId"));
        return;
      }

      const room = roomResponse.data;
      setCurrentRoom(room);

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
  };

  const handleDisconnect = () => {
    setJoined(false);
    setToken(null);
    setCurrentRoom(null);
    toast.info(t("disconnected"));
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    try {
      // Send cancellation messages to all invited users before deleting
      if (roomToDelete.isPrivate && roomToDelete.invitedUsers.length > 0) {
        for (const invitedUser of roomToDelete.invitedUsers) {
          await sendInvitationCancellationMessage(invitedUser, roomToDelete);
        }
      }
      
      await dispatch(deleteRoom(roomToDelete._id)).unwrap();
      toast.success(t("roomDeleted"));
    } catch (error: any) {
      console.error("Failed to delete room:", error);
      toast.error(error.message || t("failedToDeleteRoom"));
    } finally {
      setRoomToDelete(null);
    }
  };

  const handleJoinRoom = async (room: ReduxRoom) => {
    const secretId = await getRoomSecretId(room._id);
    if (secretId) {
      setCurrentRoom(room);
      joinRoomBySecretId(secretId);
    }
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
      socket.emit('createPrivateRoom', { receiverId: invitedUser._id }, async (response: any) => {
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
      socket.emit('createPrivateRoom', { receiverId: removedUser._id }, async (response: any) => {
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

  if (joined && token && currentRoom) {
    return (
      <VideoConferenceComponent
        token={token}
        currentRoom={currentRoom}
        onDisconnect={handleDisconnect}
        t={t}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Container>
        <div className="mb-8">
          <div className="flex gap-3">
            <Link href="/" className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="join">{t("joinMeeting")}</TabsTrigger>
            <TabsTrigger value="rooms">{t("myRooms")}</TabsTrigger>
            <TabsTrigger value="sessions">{t("recentSessions")}</TabsTrigger>
          </TabsList>

          <TabsContent value="join" className="space-y-6 mt-3">
            <div className="grid md:grid-cols-2 gap-6">
              <JoinMeetingCard
                secretId={secretId}
                setSecretId={setSecretId}
                onJoinRoom={() => joinRoomBySecretId()}
                isLoading={createLoading}
                t={t}
              />

              <CreateRoomCard
                onCreateRoom={() => setShowCreateDialog(true)}
                t={t}
              />
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("myRooms")}</h2>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                {t("createRoom")}
              </Button>
            </div>

            <div className="grid gap-4">
              {rooms.length === 0 ? (
                <Card className="flex items-center dark:border-transparent">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Video className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      {t("noRooms")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                rooms.map((room) => (
                  <RoomCard
                    key={room._id}
                    room={room}
                    t={t}
                    onCopySecretId={copySecretId}
                    onJoinRoom={handleJoinRoom}
                    onEditRoom={handleEditRoom}
                    onDeleteRoom={handleDeleteRoomClick}
                    getRoomSecretId={getRoomSecretId}
                    currentUser={user || undefined}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <h2 className="text-xl font-semibold">
              {t("recentSessionsTitle")}
            </h2>

            <div className="grid gap-4">
              <Card className="dark:border-transparent">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Sessions feature is not implemented yet.
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    This feature will be available in a future update.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Room Dialog */}
        <RoomDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          mode="create"
          roomData={newRoomData}
          onRoomDataChange={setNewRoomData}
          onSubmit={handleCreateRoom}
          isLoading={createLoading}
          followedUsers={followedUsers}
          showSuggestionMenu={showSuggestionMenu}
          setShowSuggestionMenu={setShowSuggestionMenu}
          t={t}
          currentUser={user || undefined}
        />

        {/* Edit Room Dialog */}
        <RoomDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          mode="edit"
          roomData={editingRoom || {}}
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
              } catch (error: any) {
                console.error('Update room error:', error);
                toast.error(error.message || "Failed to update room");
              }
            }
          }}
          isLoading={updateLoading}
          followedUsers={followedUsers}
          showSuggestionMenu={showSuggestionMenu}
          setShowSuggestionMenu={setShowSuggestionMenu}
          t={t}
          currentUser={user || undefined}
        />

        {/* Confirm Delete Dialog */}
        <DeleteConfirmDialog
          open={!!roomToDelete}
          onOpenChange={(open) => {
            if (!open) setRoomToDelete(null);
          }}
          onConfirm={handleDeleteRoom}
          t={t}
        />

        {error && (
          <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg">
            {error}
          </div>
        )}
      </Container>
    </div>
  );
}; 