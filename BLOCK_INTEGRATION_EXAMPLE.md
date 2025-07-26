# 🔧 Block System Integration Example

## 📝 **Example: Adding Block Button to ProfileHeader**

Here's how to integrate the block button into your existing `ProfileHeader` component:

### **1. Import the BlockButton Component**

```tsx
// In src/components/profile/ProfileHeader.tsx
import { BlockButton } from '@/components/block';
```

### **2. Add Block Button to the Actions Section**

Find the section where the Follow/Unfollow and Send Message buttons are (around line 220-240) and add the block button:

```tsx
{!isOwnProfile && user && (
  <div className='flex items-center justify-center gap-2 mt-2'>
    {/* Show follow/unfollow button (disabled for self-profile) */}
    <>
      <Button
        className='cursor-pointer self-center'
        onClick={isFollowing ? onUnfollow : onFollow}
        disabled={loading || disabled || !user}
        variant={isFollowing ? 'destructive' : 'default'}
      >
        {isFollowing ? <UserMinus className='w-4 h-4' /> : <UserPlusIcon className='w-4 h-4' />}
        {isFollowing ? 'Unfollow' : 'Follow'}
      </Button>
      
      <Button 
        variant='outline' 
        className='cursor-pointer self-center'
        onClick={handleSendMessage}
        disabled={isCreatingRoom}
      >
        <Send className='w-4 h-4' />
        {isCreatingRoom ? 'Creating...' : 'Send Message'}
      </Button>
      
      {/* Add Block Button Here */}
      <BlockButton
        targetUserId={user._id || user.id}
        targetUsername={user.username}
        variant="outline"
        size="sm"
        showIcon={true}
        showText={true}
        className="cursor-pointer self-center"
      />
    </>
  </div>
)}
```

### **3. Add Block Status Indicator**

You can also add a block status indicator near the user's name:

```tsx
<div className='flex flex-col gap-1 mt-5'>
  <div className='flex items-center justify-center gap-1'>
    <h1 className='text-2xl font-bold'>{user?.firstName || 'User'} {user?.lastName || ''}</h1>
    {user?.role === 'admin' && (
      <AdminBadge role={user?.role} size='md' />
    )}
    {/* Add Block Status Indicator */}
    {!isOwnProfile && (
      <BlockStatusIndicator 
        userId={user._id || user.id} 
        className="ml-2"
      />
    )}
  </div>
  <p className='text-lg text-muted-foreground'>@{user?.username || 'username'}</p>
  {/* ... rest of the component */}
</div>
```

### **4. Complete Updated ProfileHeader Component**

Here's the complete updated section:

```tsx
'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EllipsisVerticalIcon, UserPlusIcon, UserMinus, PencilIcon, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminBadge from '@/components/AdminBadge';
import { BlockButton, BlockStatusIndicator } from '@/components/block'; // Add this import
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import React, { useContext, useState } from 'react';
import ImageCropper from './ImageCropper';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SocketContext } from '@/store/Provider';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setRooms, setActiveRoom } from '@/store/slices/chatSlice';
import { User } from '@/types/user';

// ... existing interface and component logic ...

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
  // ... existing state and handlers ...

  return (
    <Card className='relative'>
      <CardHeader className='relative'>
        {/* ... existing cover image and dropdown logic ... */}
      </CardHeader>
      <CardContent className='text-center'>
        {/* ... existing avatar and stats section ... */}
        
        <div className='flex flex-col gap-1 mt-5'>
          <div className='flex items-center justify-center gap-1'>
            <h1 className='text-2xl font-bold'>{user?.firstName || 'User'} {user?.lastName || ''}</h1>
            {user?.role === 'admin' && (
              <AdminBadge role={user?.role} size='md' />
            )}
            {/* Add Block Status Indicator */}
            {!isOwnProfile && (
              <BlockStatusIndicator 
                userId={user._id || user.id} 
                className="ml-2"
              />
            )}
          </div>
          <p className='text-lg text-muted-foreground'>@{user?.username || 'username'}</p>

          {!isOwnProfile && user && (
            <div className='flex items-center justify-center gap-2 mt-2'>
              {/* Show follow/unfollow button (disabled for self-profile) */}
              <>
                <Button
                  className='cursor-pointer self-center'
                  onClick={isFollowing ? onUnfollow : onFollow}
                  disabled={loading || disabled || !user}
                  variant={isFollowing ? 'destructive' : 'default'}
                >
                  {isFollowing ? <UserMinus className='w-4 h-4' /> : <UserPlusIcon className='w-4 h-4' />}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
                
                <Button 
                  variant='outline' 
                  className='cursor-pointer self-center'
                  onClick={handleSendMessage}
                  disabled={isCreatingRoom}
                >
                  <Send className='w-4 h-4' />
                  {isCreatingRoom ? 'Creating...' : 'Send Message'}
                </Button>
                
                {/* Add Block Button */}
                <BlockButton
                  targetUserId={user._id || user.id}
                  targetUsername={user.username}
                  variant="outline"
                  size="sm"
                  showIcon={true}
                  showText={true}
                  className="cursor-pointer self-center"
                />
              </>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
```

## 🎯 **Key Integration Points**

### **1. User Lists/Search Results**
Add block status indicators to user cards:

```tsx
// In user list components
import { BlockStatusIndicator } from '@/components/block';

<div className="user-card">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Avatar src={user.avatar} />
      <div>
        <h3>{user.name}</h3>
        <p>@{user.username}</p>
      </div>
    </div>
    <BlockStatusIndicator userId={user.id} />
  </div>
</div>
```

### **2. Posts/Comments**
Hide content from blocked users:

```tsx
// In post components
import { useBlock } from '@/hooks/useBlock';

const PostComponent = ({ post }) => {
  const { isBlocked, isBlockedBy } = useBlock();
  
  // Don't show posts from blocked users
  if (isBlocked(post.author.id)) {
    return (
      <div className="blocked-content p-4 text-center text-gray-500">
        <p>This content is hidden because you blocked this user</p>
      </div>
    );
  }
  
  // Don't show posts to users who blocked you
  if (isBlockedBy(post.author.id)) {
    return (
      <div className="blocked-content p-4 text-center text-gray-500">
        <p>This content is hidden because this user blocked you</p>
      </div>
    );
  }
  
  return <PostContent post={post} />;
};
```

### **3. Navigation Menu**
Add block management to your navigation:

```tsx
// In navigation components
import { UserX } from 'lucide-react';

<NavItem href="/blocks" icon={<UserX />}>
  Block Management
</NavItem>
```

## 🔧 **Testing the Integration**

1. **Test Block Button**: Visit a user profile and try blocking/unblocking
2. **Test Status Indicators**: Check if block status shows correctly
3. **Test Content Filtering**: Verify blocked content is hidden
4. **Test Error Handling**: Try blocking with invalid data
5. **Test Loading States**: Check loading indicators work

## 🎨 **Customization Options**

### **Custom Block Button Styling**
```tsx
<BlockButton
  targetUserId={user.id}
  targetUsername={user.username}
  variant="destructive"  // red button
  size="sm"              // small size
  showIcon={false}       // hide icon
  showText={false}       // hide text (icon only)
  className="custom-class"
/>
```

### **Custom Status Indicator**
```tsx
<BlockStatusIndicator
  userId={user.id}
  showTooltip={false}    // hide tooltip
  className="ml-2"       // custom margin
/>
```

The block system is now fully integrated and ready to use! 🎉 