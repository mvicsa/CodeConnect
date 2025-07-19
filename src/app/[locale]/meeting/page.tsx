'use client';

import { useState, useEffect } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Video, 
  Users, 
  Plus, 
  Copy, 
  Settings, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  Calendar,
  Clock,
  User,
  LogOut,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Container from '@/components/Container';

// Types
interface Room {
  _id: string;
  name: string;
  description: string;
  secretId: string;
  isPrivate: boolean;
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    username: string;
  };
}

interface Session {
  _id: string;
  room: string;
  roomId: string;
  participants: Array<{
    userId: string;
    username: string;
    joinedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://codeconnect-1r7agrz5.livekit.cloud';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function MeetingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('join');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [secretId, setSecretId] = useState('');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxParticipants: 10
  });
  const [isClient, setIsClient] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'Loading' | 'Present' | 'Missing'>('Loading');
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const t = useTranslations('meeting');

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get user info from JWT
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const jwt = localStorage.getItem('token');
      if (jwt) {
        try {
          jwtDecode(jwt);
          setTokenStatus('Present');
          fetchRooms();
          fetchSessions();
        } catch {
          setError('Invalid token. Please login again.');
          setTokenStatus('Missing');
        }
      } else {
        setError('No authentication token found. Please login.');
        setTokenStatus('Missing');
      }
    }
  }, []);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (typeof window !== 'undefined') {
      const jwt = localStorage.getItem('token');
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      } else {
        console.error('No JWT token found');
      }
    }
    
    return headers;
  };

  const fetchRooms = async () => {
    try {
      console.log('Fetching rooms from:', `${API_BASE_URL}/livekit/rooms/user/my-rooms`);
      const headers = getAuthHeaders();
      console.log('Request headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}/livekit/rooms/user/my-rooms`, {
        headers
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Rooms data:', data);
        setRooms(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch rooms:', response.status, errorText);
        toast.error(`Failed to fetch rooms: ${response.status}`);
      }
    } catch (error) {
      console.error('Network error fetching rooms:', error);
      toast.error('Network error fetching rooms');
    }
  };

  const fetchSessions = async () => {
    // Sessions endpoint not implemented yet - skip for now
    console.log('Sessions endpoint not implemented yet');
    setSessions([]);
  };

  const createRoom = async () => {
    setIsLoading(true);
    try {
      console.log('Creating room with data:', newRoomData);
      const headers = getAuthHeaders();
      console.log('Create room headers:', headers);
      
      let roomName = newRoomData.name;
      
      const roomDataToSend = {
        ...newRoomData,
        name: roomName
      };
      
      const response = await fetch(`${API_BASE_URL}/livekit/rooms`, {
        method: 'POST',
        headers,
        body: JSON.stringify(roomDataToSend)
      });

      console.log('Create room response status:', response.status);
      
      if (response.ok) {
        const room = await response.json();
        console.log('Created room:', room);
        setRooms(prev => [room, ...prev]);
        setShowCreateDialog(false);
        setNewRoomData({ name: '', description: '', isPrivate: false, maxParticipants: 10 });
        toast.success(t('roomCreated'));
      } else {
        const errorText = await response.text();
        console.error('Failed to create room:', response.status, errorText);
        try {
          const error = JSON.parse(errorText);
          // Handle specific duplicate name error
          if (error.message && error.message.toLowerCase().includes('duplicate') || 
              error.message && error.message.toLowerCase().includes('already exists')) {
            toast.error(t('roomNameExists'));
          } else {
            toast.error(error.message || t('failedToCreateRoom'));
          }
        } catch {
          toast.error(`Failed to create room: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Network error creating room:', error);
      toast.error(t('failedToCreateRoom'));
    } finally {
      setIsLoading(false);
    }
  };

  // Refactor joinRoomBySecretId to accept an optional sid parameter
  const joinRoomBySecretId = async (sid?: string) => {
    const idToJoin = sid ?? secretId;
    if (!idToJoin.trim()) {
      toast.error(t('pleaseEnterSecretId'));
      return;
    }

    setIsLoading(true);
    try {
      console.log('Joining room with secret ID:', idToJoin);
      const headers = getAuthHeaders();
      console.log('Join room headers:', headers);
      
      // Get room details by secret ID
      const roomResponse = await fetch(`${API_BASE_URL}/livekit/rooms/join/${idToJoin}`, {
        headers
      });

      console.log('Join room response status:', roomResponse.status);
      
      if (!roomResponse.ok) {
        const errorText = await roomResponse.text();
        console.error('Failed to join room:', roomResponse.status, errorText);
        toast.error(t('invalidSecretId'));
        return;
      }

      const room = await roomResponse.json();
      console.log('Room details:', room);
      setCurrentRoom(room);

      // Get LiveKit token
      console.log('Getting LiveKit token for secret ID:', idToJoin);
      const tokenResponse = await fetch(`${API_BASE_URL}/livekit/token?secretId=${idToJoin}`, {
        headers
      });

      console.log('Token response status:', tokenResponse.status);
      console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Failed to get token:', tokenResponse.status, errorText);
        
        // Try to parse error for better user feedback
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            toast.error(`Token Error: ${errorData.message}`);
          } else {
            toast.error(t('failedToGetToken'));
          }
        } catch {
          toast.error(`Server Error: ${tokenResponse.status}`);
        }
        return;
      }

      const tokenData = await tokenResponse.json();
      console.log('Token data:', tokenData);
      
      if (!tokenData.token) {
        console.error('No token in response:', tokenData);
        toast.error('Invalid token response from server');
        return;
      }
      
      const { token: livekitToken } = tokenData;
      
      setToken(livekitToken);
      setJoined(true);
      setShowJoinDialog(false);
      setSecretId('');
      toast.success(t('joinedRoom'));
    } catch (error) {
      console.error('Network error joining room:', error);
      toast.error(t('failedToJoinRoom'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateRoom = async (roomId: string, roomData: Partial<Room>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/livekit/rooms/${roomId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(roomData)
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        setRooms(prev => prev.map(room => room._id === roomId ? updatedRoom : room));
        setShowEditDialog(false);
        setEditingRoom(null);
        toast.success('Room updated successfully!');
      } else {
        toast.error('Failed to update room');
      }
    } catch (error) {
      toast.error('Failed to update room');
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/livekit/rooms/${roomId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setRooms(prev => prev.filter(room => room._id !== roomId));
        toast.success(t('roomDeleted'));
      } else {
        toast.error(t('failedToDeleteRoom'));
      }
    } catch (error) {
      toast.error(t('failedToDeleteRoom'));
    }
  };

  const getRoomSecretId = async (roomId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/livekit/rooms/${roomId}/secret-id`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const { secretId } = await response.json();
        return secretId;
      } else {
        toast.error('Failed to get secret ID');
        return null;
      }
    } catch (error) {
      toast.error('Failed to get secret ID');
      return null;
    }
  };

  const copySecretId = async (roomId: string) => {
    const secretId = await getRoomSecretId(roomId);
    if (secretId) {
      try {
        await navigator.clipboard.writeText(secretId);
        toast.success(t('secretIdCopied'));
      } catch (error) {
        toast.error(t('failedToCopyId'));
      }
    }
  };

  const handleDisconnect = () => {
    setJoined(false);
    setToken(null);
    setCurrentRoom(null);
    toast.info(t('disconnected'));
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/livekit/rooms/${roomToDelete._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setRooms(prev => prev.filter(room => room._id !== roomToDelete._id));
        toast.success(t('roomDeleted'));
      } else {
        toast.error(t('failedToDeleteRoom'));
      }
    } catch (error) {
      toast.error(t('failedToDeleteRoom'));
    } finally {
      setRoomToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (joined && token && currentRoom) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Video className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">{currentRoom.name}</h1>
              <p className="text-sm text-muted-foreground">{currentRoom.description}</p>
            </div>
          </div>
          <div className="">
            {/* Created By with avatar and first name and last name and username */}
            <div className="text-muted-foreground">
              Created by 
              <Link href={`/profile/${currentRoom.createdBy.username}`} className="text-primary hover:underline ms-1">
                {currentRoom.createdBy.username}
              </Link>
            </div>
          </div>
        </div>
        
        <div className="h-[calc(100vh-80px)]">
          <LiveKitRoom
            token={token}
            data-lk-theme="default"
            serverUrl={LIVEKIT_URL}
            connect={true}
            onDisconnected={handleDisconnect}
            style={{ height: '100%', width: '100%' }}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>
      </div>
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
              <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
              <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="join">{t('joinMeeting')}</TabsTrigger>
            <TabsTrigger value="rooms">{t('myRooms')}</TabsTrigger>
            <TabsTrigger value="sessions">{t('recentSessions')}</TabsTrigger>
          </TabsList>

          <TabsContent value="join" className="space-y-6 mt-3">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="dark:border-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    {t('joinBySecretId')}
                  </CardTitle>
                  <CardDescription>
                    {t('joinBySecretIdDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder={t('enterSecretId')}
                      value={secretId}
                      onChange={(e) => setSecretId(e.target.value)}
                    />
                    <Button 
                      onClick={() => joinRoomBySecretId()} 
                      disabled={isLoading || !secretId.trim()}
                      className="w-full"
                    >
                      {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                      {t('joinMeetingBtn')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col dark:border-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {t('createNewRoom')}
                  </CardTitle>
                  <CardDescription>
                    {t('createNewRoomDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4" />
                    {t('createRoom')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('myRooms')}</h2>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                {t('createRoom')}
              </Button>
            </div>
            
            <div className="grid gap-4">
              {rooms.length === 0 ? (
                <Card className="flex items-center dark:border-transparent">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Video className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      {t('noRooms')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                rooms.map((room) => (
                  <Card key={room._id} className="dark:border-transparent">
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{room.name}</h3>
                            <Badge variant={room.isActive ? "default" : "secondary"}>
                              {room.isActive ? t('active') : t('inactive')}
                            </Badge>
                            <Badge variant={room.isPrivate ? "destructive" : "outline"}>
                              {room.isPrivate ? t('private') : t('public')}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{room.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center !hidden">
                              <Users className="h-4 w-4" />
                              {t('maxParticipants')}: {room.maxParticipants}
                            </span>
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(room.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => copySecretId(room._id)}
                          >
                            <Copy className="h-4 w-4" />
                            {t('copyId')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const secretId = await getRoomSecretId(room._id);
                              if (secretId) {
                                setCurrentRoom(room);
                                joinRoomBySecretId(secretId); // Pass the secretId directly!
                              }
                            }}
                          >
                            <Video className="h-4 w-4" />
                            {t('join')}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditingRoom(room);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setRoomToDelete(room)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <h2 className="text-xl font-semibold">{t('recentSessionsTitle')}</h2>
            
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
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('createNewRoomTitle')}</DialogTitle>
              <DialogDescription>
                {t('createNewRoomDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name">{t('roomName')}</label>
                <Input
                  id="name"
                  value={newRoomData.name}
                  onChange={(e) => setNewRoomData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('enterRoomName')}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">{t('description')}</label>
                <Input
                  id="description"
                  value={newRoomData.description}
                  onChange={(e) => setNewRoomData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('enterDescription')}
                />
              </div>
              <div className="grid gap-2 hidden">
                <label htmlFor="maxParticipants">{t('maxParticipantsLabel')}</label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={newRoomData.maxParticipants}
                  onChange={(e) => setNewRoomData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                  min="1"
                  max="50"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrivate"
                  checked={newRoomData.isPrivate}
                  onCheckedChange={(checked: boolean) => setNewRoomData(prev => ({ ...prev, isPrivate: checked }))}
                />
                <label htmlFor="isPrivate">{t('privateRoom')}</label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={createRoom} disabled={isLoading || !newRoomData.name.trim()}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t('createRoom')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Room Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Room</DialogTitle>
              <DialogDescription>
                Update room settings and details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-name">Room Name</label>
                <Input
                  id="edit-name"
                  value={editingRoom?.name || ''}
                  onChange={(e) => setEditingRoom(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter room name"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-description">Description</label>
                <Input
                  id="edit-description"
                  value={editingRoom?.description || ''}
                  onChange={(e) => setEditingRoom(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Enter room description"
                />
              </div>
              <div className="grid gap-2 !hidden">
                <label htmlFor="edit-maxParticipants">Max Participants</label>
                <Input
                  id="edit-maxParticipants"
                  type="number"
                  value={editingRoom?.maxParticipants || 10}
                  onChange={(e) => setEditingRoom(prev => prev ? { ...prev, maxParticipants: parseInt(e.target.value) } : null)}
                  min="1"
                  max="50"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isPrivate"
                  checked={editingRoom?.isPrivate || false}
                  onCheckedChange={(checked: boolean) => setEditingRoom(prev => prev ? { ...prev, isPrivate: checked } : null)}
                />
                <label htmlFor="edit-isPrivate">Private Room</label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                setEditingRoom(null);
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (editingRoom) {
                  updateRoom(editingRoom._id, {
                    name: editingRoom.name,
                    description: editingRoom.description,
                    maxParticipants: editingRoom.maxParticipants,
                    isPrivate: editingRoom.isPrivate
                  });
                }
              }} disabled={!editingRoom?.name.trim()}>
                Update Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <Dialog open={!!roomToDelete} onOpenChange={(open) => { if (!open) setRoomToDelete(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('confirm')}</DialogTitle>
              <DialogDescription>{t('confirm')} {t('delete')}?</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setRoomToDelete(null)}>{t('cancel')}</Button>
              <Button className='bg-danger text-danger-foreground hover:bg-danger/80' onClick={handleDeleteRoom}>{t('delete')}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {error && (
          <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg">
            {error}
          </div>
        )}
      </Container>
    </div>
  );
}
