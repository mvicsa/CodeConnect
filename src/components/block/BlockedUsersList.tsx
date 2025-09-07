'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchBlockedUsers, unblockUser } from '@/store/slices/blockSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserX, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatTime } from '@/lib/utils';
import { fetchBlockStats } from '@/store/slices/blockSlice';
import { User } from '@/types/user';

export const BlockedUsersList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { blockedUsers, loading, actionLoading } = useSelector((state: RootState) => state.block);

  useEffect(() => {
    dispatch(fetchBlockedUsers());
  }, [dispatch]);

  const handleUnblock = async (userId: string, username: string) => {
    try {
      await dispatch(unblockUser(userId)).unwrap();
      toast.success(`Successfully unblocked ${username}`);
      
      // Refresh the blocked users list after unblocking
      dispatch(fetchBlockedUsers());
      
      // Also refresh stats to update the counts
      dispatch(fetchBlockStats());
    } catch (error) {
      toast.error(error as string || 'Failed to unblock user');
    }
  };

  // Helper function to get display name
  const getDisplayName = (user: User) => {
    if (user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user && user.name) {
      return user.name;
    }
    if (user && user.username) {
      return user.username;
    }
    return 'Unknown User';
  };

  // Helper function to get avatar fallback
  const getAvatarFallback = (user: User) => {
    if (user && user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user && user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Helper function to safely get username
  const getUsername = (user: User) => {
    return (user && user.username) || 'unknown';
  };

  // Helper function to safely get avatar
  const getAvatar = (user: User) => { 
    return (user && user.avatar) || '';
  };

  // Helper function to format block date
  const formatBlockDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      return formatTime(dateString);
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <Card className='shadow-none dark:border-transparent'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Blocked Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading blocked users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <Card className='shadow-none dark:border-transparent'>
        <CardContent>
          <div className="text-center py-8">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No blocked users</h3>
            <p className="text-muted-foreground">You haven&apos;t blocked any users yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='shadow-none dark:border-transparent'>
      <CardContent>
        <div className="space-y-4">
          {blockedUsers.map((user) => {
            const actualUser = user.blockedId || user.blockerId || user;
            const reason = user.reason || (user.block && user.block.reason) || '';
            const createdAt = user.createdAt || (user.block && user.block.createdAt) || '';
            return (
              <div key={user._id} className="flex items-center justify-between flex-wrap gap-4 p-4 bg-background/50 rounded-lg">
                <div className="flex gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={getAvatar(actualUser)} alt={getDisplayName(actualUser)} />
                    <AvatarFallback>
                      {getAvatarFallback(actualUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h4 className="font-medium">{getDisplayName(actualUser)}</h4>
                      <Badge variant="outline">@{getUsername(actualUser)}</Badge>
                    </div>
                    {reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Reason: {reason}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Blocked {formatBlockDate(createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(actualUser._id || '', getDisplayName(actualUser))}
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Unblock
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}; 