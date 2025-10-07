'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EllipsisVerticalIcon, UserPlusIcon, UserMinus, PencilIcon, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminBadge from '@/components/AdminBadge';
import { BlockButton, BlockStatusIndicator } from '@/components/block';
import { useBlock } from '@/hooks/useBlock';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import React, { useContext, useState, useEffect, useRef } from 'react';
import ImageCropper from './ImageCropper';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SocketContext } from '@/store/Provider';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setRooms, setActiveRoom } from '@/store/slices/chatSlice';
import { User } from '@/types/user';
import { getAuthToken } from '@/lib/cookies';
import { toast } from 'sonner';

interface ProfileHeaderProps {
  user: User;
  followersCount: number;
  followingCount: number;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  loading: boolean;
  disabled?: boolean;
  isOwnProfile?: boolean;
  onUpdateAvatar?: (url: string) => void;
  onUpdateCover?: (url: string) => void;
  onEditProfile?: () => void;
  onBlockStatusChange?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  followersCount,
  followingCount,
  onFollowersClick,
  onFollowingClick,
  isFollowing,
  onFollow,
  onUnfollow,
  loading,
  disabled,
  isOwnProfile = false,
  onUpdateAvatar,
  onUpdateCover,
  onEditProfile,
  onBlockStatusChange,
}) => {
  const [editingImage, setEditingImage] = useState<'avatar' | 'cover' | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  
  const socket = useContext(SocketContext);
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userStatuses = useSelector((state: RootState) => state.chat.userStatuses || {});
  const status = user ? userStatuses[user._id?.toString() || ''] || 'offline' : 'offline';
  const { isBlocked, isBlockedBy, checkBlockStatus } = useBlock();
  const checkBlockStatusRef = useRef(checkBlockStatus);

  // Update ref when checkBlockStatus changes
  useEffect(() => {
    checkBlockStatusRef.current = checkBlockStatus;
  }, [checkBlockStatus]);
  
  // Check block status when profile loads
  useEffect(() => {
    if (user?._id && currentUser?._id && !isOwnProfile) {
      checkBlockStatusRef.current(user._id);
    }
  }, [user?._id, currentUser?._id, isOwnProfile])
  
  // Early return if no user
  if (!user) {
    return null;
  }
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
      setEditingImage(type);
    }
  };
  
  const handleSaveImage = (url: string) => {
    if (editingImage === 'avatar' && onUpdateAvatar) {
      onUpdateAvatar(url);
    } else if (editingImage === 'cover' && onUpdateCover) {
      onUpdateCover(url);
    }
    setEditingImage(null);
    setSelectedImage(null);
  };
  
  const handleCancelEdit = () => {
    setEditingImage(null);
    setSelectedImage(null);
  };

  const handleSendMessage = async () => {
    if (!socket || !currentUser || !user || isCreatingRoom) {
      return;
    }

    setIsCreatingRoom(true);
    
    try {
      // Use a timeout to handle cases where the server doesn't respond
      const timeout = setTimeout(() => {
        setIsCreatingRoom(false);
      }, 5000);

      // Emit the createPrivateRoom event with acknowledgment
      socket.emit('createPrivateRoom', { receiverId: user._id }, async (response: unknown) => {
        clearTimeout(timeout);
        const roomResponse = response as { roomId?: string; error?: string };
        if (roomResponse && roomResponse.roomId) {
          // Fetch latest rooms from backend to get full data
          const token = getAuthToken();
          const res = await fetch('/api/chat/rooms', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.rooms) {
            dispatch(setRooms(data.rooms));
          }
          dispatch(setActiveRoom(roomResponse.roomId));
          router.push(`/chat`);
        } else {
          toast.error('Failed to create private room');
        }
        setIsCreatingRoom(false);
      });
    } catch {
      toast.error('Failed to create private room'); 
      setIsCreatingRoom(false);
    }
  };

  return (
    <>
      <Card className='pt-0 relative gap-0 dark:border-0 shadow-none'>
        <CardHeader className='p-0 gap-0'>
          <div className="relative w-full h-48 lg:h-[300px]">
            <Image 
              src={user?.cover || "https://images.unsplash.com/photo-1503264116251-35a269479413"} 
              alt="Cover" 
              className='w-full h-full object-cover rounded-t-xl' 
              width={1000} 
              height={1000} 
            />
            {isOwnProfile && (
              <div className="absolute right-4 bottom-4">
                <label htmlFor="cover-upload" className="cursor-pointer">
                  <div className="bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-background/90 transition-colors">
                    <PencilIcon className="w-5 h-5" />
                  </div>
                  <input 
                    id="cover-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleFileSelect(e, 'cover')} 
                  />
                </label>
              </div>
            )}
            
            {/* Dropdown menu for profile actions */}
            {isOwnProfile && (
              <div className="absolute top-3 right-3 z-10">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className='cursor-pointer bg-accent p-1 rounded-sm'>
                      <EllipsisVerticalIcon className='w-5 h-5' />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={onEditProfile} className='cursor-pointer'>
                    <PencilIcon className="w-4 h-4" />
                    Edit Profile
                  </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className='text-center'>
          <div className='flex items-end justify-center gap-4 -mt-15'>
            <div className='flex flex-col items-center justify-center order-1'>
              <span className='text-2xl font-bold'>{followersCount || 0}</span>
              <span className='text-sm text-muted-foreground cursor-pointer hover:underline' onClick={onFollowersClick}>Followers</span>
            </div>
            <div className='flex flex-col items-center justify-center order-3'>
              <span className='text-2xl font-bold'>{followingCount || 0}</span>
              <span className='text-sm text-muted-foreground cursor-pointer hover:underline' onClick={onFollowingClick}>Following</span>
            </div>
            <div className='order-2 relative'>
              <Avatar className='w-35 h-35 border-6 border-card'>
                <AvatarImage src={user?.avatar || "/user.png"} />
                <AvatarFallback>{user?.firstName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              {/* Online/offline dot - hidden for blocked users */}
                {!isBlocked(user?._id || '') && !isBlockedBy(user?._id || '') && (
                  <span
                    className={
                      `absolute bottom-2 left-5 w-5 h-5 rounded-full border-3 border-card ` +
                      (status === 'online' ? 'bg-primary' : 'bg-gray-400')
                    }
                    title={status.charAt(0).toUpperCase() + status.slice(1)}
                  />
                )}
              {isOwnProfile && (
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="bg-background/80 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:bg-background/90 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </div>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleFileSelect(e, 'avatar')} 
                  />
                </label>
              )}
            </div>
          </div>
          <div className='flex flex-col gap-1 mt-5'>
            <div className='flex items-center justify-center gap-1'>
              <h1 className='text-2xl font-bold'>{user?.firstName || 'User'} {user?.lastName || ''}</h1>
              {user?.role === 'admin' && (
                <AdminBadge role={user?.role} size='md' />
              )}
              {/* Add Block Status Indicator */}
              {!isOwnProfile && user._id && (
                <BlockStatusIndicator 
                  userId={user._id} 
                  className="ms-2"
                />
              )}
            </div>
            <p className='text-lg text-muted-foreground'>@{user?.username || 'username'}</p>

            {!isOwnProfile && user && (
              <div className='flex items-center justify-center gap-2 mt-2'>
                {/* Show follow/unfollow button (disabled for self-profile) */}
                { !isBlocked(user?._id || '') && !isBlockedBy(user?._id || '') && (
                  <Button
                    className='cursor-pointer self-center'
                    onClick={isFollowing ? onUnfollow : onFollow}
                    disabled={loading || disabled || !user}
                    variant={isFollowing ? 'destructive' : 'default'}
                  >
                    {isFollowing ? <UserMinus className='w-4 h-4' /> : <UserPlusIcon className='w-4 h-4' />}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
                { !isBlocked(user?._id || '') && !isBlockedBy(user?._id || '') && (
                  <Button 
                    variant='outline' 
                    className='cursor-pointer self-center'
                    onClick={handleSendMessage}
                    disabled={isCreatingRoom}
                  >
                    <Send className='w-4 h-4' />
                    {isCreatingRoom ? 'Creating...' : 'Send Message'}
                  </Button>
                )}
                  
                  {/* Add Block Button */}
                  {user._id && currentUser?._id && user._id !== currentUser._id && (
                    <BlockButton
                      targetUserId={user._id}
                      targetUsername={user.username}
                      variant="outline"
                      showIcon={true}
                      showText={true}
                      className="cursor-pointer self-center"
                      onBlockStatusChange={onBlockStatusChange}
                    />
                  )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={editingImage !== null} onOpenChange={() => editingImage && setEditingImage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle className="text-xl font-semibold mb-4">
            {editingImage === 'avatar' ? 'Edit Profile Picture' : 'Edit Cover Photo'}
          </DialogTitle>
          {selectedImage && (
            <ImageCropper
              image={selectedImage}
              type={editingImage as 'avatar' | 'cover'}
              onSave={handleSaveImage}
              onCancel={handleCancelEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileHeader; 