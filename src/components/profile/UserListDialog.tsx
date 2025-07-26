'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { BlockButton } from '@/components/block';
import { useState, useEffect } from 'react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
}

interface UserListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  users: User[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onFollowToggle: (user: User, isFollowing: boolean) => Promise<void>;
  followingIds: string[];
  currentUserId: string | undefined;
  loadingButton?: boolean;
  emptyText?: string;
}

const UserListDialog = ({
  open,
  onOpenChange,
  title,
  users,
  loading,
  hasMore,
  onLoadMore,
  onFollowToggle,
  followingIds,
  currentUserId,
  loadingButton = false,
  emptyText = 'No users found.',
}: UserListDialogProps) => {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  // Track followed/unfollowed users locally to avoid needing a full refresh
  const [localFollowingIds, setLocalFollowingIds] = useState<string[]>(followingIds);

  // Initialize local state when props change
  useEffect(() => {
    setLocalFollowingIds(followingIds);
  }, [followingIds]);

  const handleFollowToggle = async (user: User, isFollowing: boolean) => {
    setLoadingUserId(user._id);
    try {
      await onFollowToggle(user, isFollowing);
      
      // Update local state
      if (isFollowing) {
        // Remove from local following ids
        setLocalFollowingIds(prev => prev.filter(id => id !== user._id));
      } else {
        // Add to local following ids
        setLocalFollowingIds(prev => [...prev, user._id]);
      }
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <div className='max-h-80 min-h-10 overflow-y-auto flex flex-col gap-2'>
          {loading && users.length === 0 ? (
            <div className='text-center h-full flex items-center justify-center'>
              <Loader2 className='w-4 h-4 animate-spin' />
            </div>
          ) : (
            <>
              {users.length === 0 && (
                <div className='text-center text-muted-foreground h-full flex items-center justify-center'>    
                  {emptyText}
                </div>
              )}
              {users.map((u) => {
                const isSelf = u._id === currentUserId;
                const isFollowing = localFollowingIds.includes(u._id);
                const content = (
                  <div className='flex items-center gap-2 w-full'>
                    <Link href={`/profile/${u.username}`}>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={u.avatar} alt={u.username} />
                        <AvatarFallback>{u.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className='flex-1'>
                      <Link href={`/profile/${u.username}`}>
                        <div className='font-medium text-sm'>{u.firstName} {u.lastName}</div>
                      </Link>
                      <Link href={`/profile/${u.username}`}>
                        <div className='text-xs text-muted-foreground'>@{u.username}</div>
                      </Link>
                    </div>
                    {/* Hide follow/unfollow button if user is self */}
                    {!isSelf && (
                      <div className='flex gap-1 ms-auto'>
                        <Button
                          size='sm'
                          variant={isFollowing ? 'outline' : 'default'}
                          onClick={() => handleFollowToggle(u, isFollowing)}
                          disabled={loadingUserId === u._id || loadingButton}
                          className='cursor-pointer'
                        >
                          {loadingUserId === u._id ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? 'Unfollow' : 'Follow'}
                        </Button>
                        <BlockButton
                          targetUserId={u._id}
                          targetUsername={u.username}
                          variant="outline"
                          size="sm"
                          showIcon={true}
                          showText={false}
                          className="cursor-pointer"
                          onBlockStatusChange={() => {
                            // Refresh the dialog data when block status changes
                            // This will update the following status for all users in the dialog
                            window.location.reload();
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
                return (
                  <div key={u._id} className='p-2 bg-background border dark:border-transparent rounded-lg flex items-center gap-2'>
                    {content}
                  </div>
                );
              })}
              {/* Optionally, show a small spinner at the bottom if loading more */}
              {loading && users.length > 0 && (
                <div className='text-center flex items-center justify-center py-2'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                </div>
              )}
            </>
          )}
        </div>
        {hasMore && !loading && (
          <Button onClick={onLoadMore} className='w-full'>Load More</Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserListDialog; 