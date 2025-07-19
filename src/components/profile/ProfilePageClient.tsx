'use client'

import AdminBadge from '@/components/AdminBadge';
import PostsProfile from '@/components/post/PostsProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { RootState } from '@/store/store';
import { EllipsisVerticalIcon, Loader2, ShieldCheck, UserPlusIcon } from 'lucide-react';
import Image from 'next/image';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { fetchFollowers, fetchFollowing, followUser, unfollowUser, resetFollowers, resetFollowing, fetchSuggestedUsers, resetSuggested } from '@/store/slices/followSlice';
import { useEffect, useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { fetchProfile } from '@/store/slices/authSlice';
import Link from 'next/link';
import SuggestedUsers from '@/components/SuggestedUsers';
import ProfileHeader from './ProfileHeader';
import UserListDialog from './UserListDialog';

const ProfilePageClient = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { followers, following } = useSelector((state: RootState) => state.follow);
  const { suggested } = useSelector((state: RootState) => state.follow);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  // Fetch followers/following on mount (for the current user)
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchFollowers(user._id));
      dispatch(fetchFollowing(user._id));
    }
  }, [dispatch, user?._id]);

  // Fetch suggestions on mount
  useEffect(() => {
    dispatch(resetSuggested());
    dispatch(fetchSuggestedUsers({ limit: 5, skip: 0 }));
  }, [dispatch]);

  // Check if current user is following (for now, assume self-profile, so always false)
  // For other profiles, compare user._id with followers/following
  const isFollowing = false; // Extend this for other profiles

  // Helper: get current user ID
  const currentUserId = user?._id;
  // Helper: get following IDs for current user
  const followingIds = useMemo(() => (user?.following ?? []), [user?.following]);

  // Follow/unfollow handlers
  const handleFollow = useCallback(() => {
    if (user?._id) {
      dispatch(followUser(user._id)); // For now, self-follow (replace with profileId)
    }
  }, [dispatch, user?._id]);

  const handleUnfollow = useCallback(() => {
    if (user?._id) {
      dispatch(unfollowUser(user._id)); // For now, self-unfollow (replace with profileId)
    }
  }, [dispatch, user?._id]);

  // Open followers dialog and fetch first page
  const handleOpenFollowers = () => {
    setFollowersOpen(true);
    if (user?._id) {
      dispatch(resetFollowers());
      dispatch(fetchFollowers({ userId: user._id, limit: 20, skip: 0 }));
    }
  };

  // Open following dialog and fetch first page
  const handleOpenFollowing = () => {
    setFollowingOpen(true);
    if (user?._id) {
      dispatch(resetFollowing());
      dispatch(fetchFollowing({ userId: user._id, limit: 20, skip: 0 }));
    }
  };

  // Load more followers
  const handleLoadMoreFollowers = () => {
    if (user?._id && followers.hasMore && !followers.loading) {
      dispatch(fetchFollowers({ userId: user._id, limit: followers.limit, skip: followers.skip }));
    }
  };

  // Load more following
  const handleLoadMoreFollowing = () => {
    if (user?._id && following.hasMore && !following.loading) {
      dispatch(fetchFollowing({ userId: user._id, limit: following.limit, skip: following.skip }));
    }
  };

  // Load more suggestions
  const handleLoadMoreSuggestions = () => {
    if (suggested.hasMore && !suggested.loading) {
      dispatch(fetchSuggestedUsers({ limit: suggested.limit, skip: suggested.skip }));
    }
  };

  // Close dialogs
  const handleCloseFollowers = () => {
    setFollowersOpen(false);
    dispatch(resetFollowers());
  };
  const handleCloseFollowing = () => {
    setFollowingOpen(false);
    dispatch(resetFollowing());
  };

  // DRY follow/unfollow handler for dialogs
  const handleDialogFollowToggle = async (userObj: any, isFollowing: boolean) => {
    await dispatch(isFollowing ? unfollowUser(userObj._id) : followUser(userObj._id));
    dispatch(fetchProfile());
  };

  return (
    <div className='max-w-screen-lg mx-auto px-4'>
      <div className='space-y-4 w-full'>
        <ProfileHeader
          user={user}
          followersCount={user?.followers?.length ?? 0}
          followingCount={user?.following?.length ?? 0}
          onFollowersClick={handleOpenFollowers}
          onFollowingClick={handleOpenFollowing}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          loading={followers.loading || false}
        />
        {/* Followers Dialog */}
        <UserListDialog
          open={followersOpen}
          onOpenChange={setFollowersOpen}
          title='Followers'
          users={followers.items}
          loading={followers.loading}
          hasMore={followers.hasMore}
          onLoadMore={handleLoadMoreFollowers}
          onFollowToggle={handleDialogFollowToggle}
          followingIds={followingIds}
          currentUserId={currentUserId}
          loadingButton={followers.loading}
          emptyText='No followers yet.'
        />
        {/* Following Dialog */}
        <UserListDialog
          open={followingOpen}
          onOpenChange={setFollowingOpen}
          title='Following'
          users={following.items}
          loading={following.loading}
          hasMore={following.hasMore}
          onLoadMore={handleLoadMoreFollowing}
          onFollowToggle={handleDialogFollowToggle}
          followingIds={followingIds}
          currentUserId={currentUserId}
          loadingButton={following.loading}
          emptyText='Not following anyone yet.'
          userLink
        />
        <div className='grid grid-cols-12 gap-4'>
          <div className='hidden md:block col-span-3'>
            <Card className='w-full dark:border-0 shadow-none'>
              <CardHeader>
                <CardTitle  className='text-xl font-bold mb-3' >About me</CardTitle>
                  <p className='text-sm'>
                    Hi! My name is MOHAMED! I have a Twitch channel where I stream, play and review all the newest games.
                  </p>
                <div className='flex flex-row gap-8 mt-4'>
                    <span className='text-sm text-muted-foreground'>Location</span>
                    <span className='text-sm'>
                      Mansoura
                    </span>
                </div>
                <div className='flex flex-row gap-9'>
                    <span className='text-sm text-muted-foreground'>Country</span>
                    <span className='text-sm'>Egypt</span>
                </div>
                <div className='flex flex-row gap-16'>
                    <span className='text-sm text-muted-foreground'>Age</span>
                    <span className='text-sm'>
                      28
                    </span>
                </div>
              </CardHeader>
            </Card>
            <h4 className='mt-10  mb-4 text-2xl font-bold'>Skills</h4>
            <div>
              <div className='flex flex-wrap gap-2'>
                {/* loop through user skills */}
                {user?.skills?.map((skill: string, index: number) => (
                  <span key={index} className='bg-card border dark:border-0 px-3 py-1 rounded-full text-sm'>{skill}</span>
                ))}
              </div>
            </div>
          </div>
          <div className='col-span-12 md:col-span-9'>
            <PostsProfile />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePageClient; 