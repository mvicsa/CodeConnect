'use client'

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EllipsisVerticalIcon, UserPlusIcon, UserMinus, PencilIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminBadge from '@/components/AdminBadge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import React from 'react';
import ImageCropper from './ImageCropper';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ProfileHeaderProps {
  user: any;
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
}) => {
  const [editingImage, setEditingImage] = useState<'avatar' | 'cover' | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
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

  return (
    <>
      <Card className='pt-0 relative gap-0 dark:border-0 shadow-none'>
        <CardHeader className='p-0 gap-0'>
          <div className="relative w-full h-[300px]">
            <Image 
              src={user?.cover || "https://images.unsplash.com/photo-1503264116251-35a269479413"} 
              alt="Cover" 
              className='w-full h-[300px] object-cover rounded-t-xl' 
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
                    <PencilIcon className="w-4 h-4 mr-2" />
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
            </div>
            <p className='text-lg text-muted-foreground'>@{user?.username || 'username'}</p>
            {/* Show follow/unfollow button (disabled for self-profile) */}
            {!isOwnProfile && user && (
              <Button
                className='cursor-pointer self-center !px-6'
                onClick={isFollowing ? onUnfollow : onFollow}
                disabled={loading || disabled || !user}
                variant={isFollowing ? 'destructive' : 'default'}
              >
                {isFollowing ? <UserMinus className='w-4 h-4 mr-2' /> : <UserPlusIcon className='w-4 h-4 mr-2' />}
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
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