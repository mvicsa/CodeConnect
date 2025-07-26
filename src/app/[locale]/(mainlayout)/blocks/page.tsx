'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchBlockedUsers, fetchBlockedByUsers, fetchBlockStats } from '@/store/slices/blockSlice';
import { BlockedUsersList } from '@/components/block';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Shield, UserX } from 'lucide-react';
import { User } from '@/types/user';

export default function BlocksPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { blockedUsers, blockedByUsers } = useSelector((state: RootState) => state.block);

  useEffect(() => {
    dispatch(fetchBlockedUsers());
    dispatch(fetchBlockedByUsers());
    dispatch(fetchBlockStats());
  }, [dispatch]);

  // Debug: Log blockedByUsers data
  useEffect(() => {
    console.log('blockedByUsers data:', blockedByUsers);
  }, [blockedByUsers]);

  // Helper function to get display name
  const getDisplayName = (user: User) => {
    console.log('getDisplayName called with:', user);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Block Management</h1>
        <p className="text-muted-foreground">
          Manage your blocked users and view users who have blocked you.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className='shadow-none dark:border-transparent'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Users you have blocked
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-none dark:border-transparent'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked By</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedByUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Users who blocked you
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-none dark:border-transparent'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedUsers.length + blockedByUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Total block relationships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blocked Users Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Users You&apos;ve Blocked
          </h2>
          <BlockedUsersList />
        </div>

        {/* Blocked By Users Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Users Who Blocked You
          </h2>
          {blockedByUsers.length === 0 ? (
            <Card className='shadow-none dark:border-transparent'>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users have blocked you</h3>
                  <p className="text-muted-foreground">You&apos;re in good standing with the community!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className='shadow-none dark:border-transparent'>
              <CardContent>
                <div className="space-y-4">
                  {blockedByUsers.map((user) => {
                    // Debug: Log each user object
                    console.log('Processing blockedBy user:', user);
                    
                    // في حالة "Users Who Blocked You"، المستخدم الذي حظرك هو blockerId
                    // لأن blockerId هو من قام بالحظر، وblockedId هو من تم حظره (أنت)
                    const actualUser = user.blockerId || user.blockedId || user;
                    console.log('actualUser extracted:', actualUser);
                    
                    return (
                      <div key={user._id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getAvatar(actualUser)} alt={getDisplayName(actualUser)} />
                            <AvatarFallback>
                              {getAvatarFallback(actualUser)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{getDisplayName(actualUser)}</h4>
                              <Badge variant="outline">@{getUsername(actualUser)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              This user has blocked you
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 