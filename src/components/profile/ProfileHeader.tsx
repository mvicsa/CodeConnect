'use client'

import { Card, CardHeader, CardAction, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EllipsisVerticalIcon, UserPlusIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminBadge from '@/components/AdminBadge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import React from 'react';

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
}) => (
  <Card className='pt-0 relative gap-0 dark:border-0 shadow-none'>
    <CardHeader className='p-0 gap-0'>
      <Image src={user?.cover || "https://images.unsplash.com/photo-1503264116251-35a269479413"} alt="Test" className='w-full h-[300px] object-cover rounded-t-xl' width={1000} height={1000} />
      <CardAction>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className='absolute top-3 right-3 cursor-pointer bg-accent p-1 rounded-sm'>
            <EllipsisVerticalIcon className='w-5 h-5' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardAction>
    </CardHeader>
    <CardContent className='text-center'>
      <div className='flex items-end justify-center gap-4 -mt-15'>
        <div className='flex flex-col items-center justify-center order-1'>
          <span className='text-2xl font-bold'>{followersCount}</span>
          <span className='text-sm text-muted-foreground cursor-pointer hover:underline' onClick={onFollowersClick}>Followers</span>
        </div>
        <div className='flex flex-col items-center justify-center order-3'>
          <span className='text-2xl font-bold'>{followingCount}</span>
          <span className='text-sm text-muted-foreground cursor-pointer hover:underline' onClick={onFollowingClick}>Following</span>
        </div>
        <div className='order-2'>
          <Avatar className='w-35 h-35 border-6 border-card'>
            <AvatarImage src={user?.avatar || "/user.png"} />
            <AvatarFallback>{user?.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className='flex flex-col gap-1 mt-5'>
        <div className='flex items-center justify-center gap-1'>
          <h1 className='text-2xl font-bold'>{user?.firstName} {user?.lastName}</h1>
          {user?.role === 'admin' && (
            <AdminBadge role={user?.role} size='md' />
          )}
        </div>
        <p className='text-lg text-muted-foreground'>@{user?.username}</p>
        {/* Show follow/unfollow button (disabled for self-profile) */}
        <Button className='cursor-pointer self-center !px-6' onClick={isFollowing ? onUnfollow : onFollow} disabled={loading}>
          <UserPlusIcon className='w-4 h-4' />
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default ProfileHeader; 