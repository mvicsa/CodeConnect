'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

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
  userLink?: boolean;
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
  userLink = false,
}: UserListDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogTitle>{title}</DialogTitle>
      <div className='max-h-80 min-h-10 overflow-y-auto flex flex-col gap-2'>
        {users.length === 0 && !loading && (
          <div className='text-center text-muted-foreground h-full flex items-center justify-center'>    
            {emptyText}
          </div>
        )}
        {users.map((u) => {
          const isSelf = u._id === currentUserId;
          const isFollowing = followingIds.includes(u._id);
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
              {!isSelf && (
                <Button
                  size='sm'
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={async () => onFollowToggle(u, isFollowing)}
                  disabled={loadingButton}
                  className='cursor-pointer ms-auto'
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
          );
          return (
            <div key={u._id} className='p-2 bg-background border dark:border-transparent flex items-center gap-2'>
              {content}
            </div>
          );
        })}
        {loading && (
          <div className='text-center h-full flex items-center justify-center'>
            <Loader2 className='w-4 h-4 animate-spin' />
          </div>
        )}
      </div>
      {hasMore && !loading && (
        <Button onClick={onLoadMore} className='w-full'>Load More</Button>
      )}
    </DialogContent>
  </Dialog>
);

export default UserListDialog; 