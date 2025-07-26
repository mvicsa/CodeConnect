'use client'

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSuggestedUsers, followUser, unfollowUser, resetSuggested } from '@/store/slices/followSlice';
import { fetchProfile } from '@/store/slices/authSlice';
import { RootState, AppDispatch } from '@/store/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useBlock } from '@/hooks/useBlock';

interface SuggestedUsersProps {
  limit?: number;
  cardTitle?: string;
  className?: string;
}

const SuggestedUsers = ({ limit = 3, cardTitle = 'Suggested Users', className = '' }: SuggestedUsersProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { suggested } = useSelector((state: RootState) => state.follow);
  const { user } = useSelector((state: RootState) => state.auth);
  const followingIds = user?.following ?? [];
  const currentUserId = user?._id;
  const { checkBlockStatus, isBlocked, isBlockedBy, loading: blockLoading } = useBlock();

  useEffect(() => {
    dispatch(resetSuggested());
    dispatch(fetchSuggestedUsers({ limit, skip: 0 }));
  }, [dispatch, limit]);

  // Check block status for suggested users when they are loaded
  useEffect(() => {
    if (suggested.items.length > 0) {
      suggested.items.forEach(user => {
        if (user._id && user._id !== currentUserId) {
          checkBlockStatus(user._id);
        }
      });
    }
  }, [suggested.items, currentUserId, checkBlockStatus]);

  const handleLoadMoreSuggestions = () => {
    if (suggested.hasMore && !suggested.loading) {
      dispatch(fetchSuggestedUsers({ limit: suggested.limit, skip: suggested.skip }))
        .then(() => {
          // Check block status for newly loaded users
          const newUsers = suggested.items.slice(-suggested.limit);
          newUsers.forEach(user => {
            if (user._id && user._id !== currentUserId) {
              checkBlockStatus(user._id);
            }
          });
        });
    }
  };

  return (
    <Card className={`w-full dark:border-0 shadow-none p-4 gap-2 ${className}`}>
      <CardHeader className='p-0'>
        <CardTitle className='text-xl font-bold'>{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='flex flex-col gap-3'>
          {suggested.items.length === 0 && !suggested.loading && !blockLoading && (
            <div className='text-center text-muted-foreground'>No suggestions found.</div>
          )}
          {suggested.items
            .filter((u) => {
              // Don't show blocked users or users who blocked you
              if (!u._id) return false;
              // If block status is still loading, don't show the user yet
              if (blockLoading) return false;
              return !isBlocked(u._id) && !isBlockedBy(u._id);
            })
            .map((u) => {
            const isSelf = u._id === currentUserId;
            const isFollowing = followingIds && Array.isArray(followingIds) && followingIds.includes(u._id as string);
            return (
              <div key={u._id} className='flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition'>
                <Link href={`/profile/${u.username}`}>
                  <Avatar className='h-8 w-8'><AvatarImage src={u.avatar} alt={u.username} />
                    <AvatarFallback>{u.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className='flex-1 overflow-hidden'>
                  <Link href={`/profile/${u.username}`}> 
                    <div className='font-medium text-sm truncate'>{u.firstName} {u.lastName}</div> 
                    <div className='text-xs text-muted-foreground'>@{u.username}</div> 
                  </Link>
                </div>
                {!isSelf && (
                  <div className='flex gap-1'>
                    <Button
                      size='sm'
                      variant={isFollowing ? 'outline' : 'default'}
                      onClick={async () => { await dispatch(isFollowing ? unfollowUser(u._id || '') : followUser(u._id || '')); dispatch(fetchProfile()); dispatch(resetSuggested()); dispatch(fetchSuggestedUsers({ limit: suggested.limit, skip: 0 })); }}
                      disabled={suggested.loading}
                      className='cursor-pointer'
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {(suggested.loading || blockLoading) && (
            <div className='text-center h-full flex items-center justify-center'>
              <Loader2 className='w-4 h-4 animate-spin' />
            </div>
          )}
          {suggested.hasMore && !suggested.loading && !blockLoading && (
            <Button onClick={handleLoadMoreSuggestions} className='w-full mt-2'>Load More</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestedUsers; 