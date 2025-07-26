# 🔒 Block System Integration Guide

## 📋 **What's Been Created**

### ✅ **Core Files Created:**

1. **Types** (`src/types/block.ts`)
   - `Block` interface for block data
   - `BlockStatus` for relationship status
   - `BlockStats` for statistics
   - `BlockUser` for user with block info

2. **API Service** (`src/services/blockAPI.ts`)
   - Complete block service with all endpoints
   - Proper error handling and authentication
   - TypeScript support

3. **Redux Slice** (`src/store/slices/blockSlice.ts`)
   - State management for block operations
   - Async thunks for all API calls
   - Loading and error states

4. **Components** (`src/components/block/`)
   - `BlockButton.tsx` - Reusable block/unblock button
   - `BlockedUsersList.tsx` - List of blocked users
   - `BlockStatusIndicator.tsx` - Status badges
   - `index.ts` - Export file

5. **Custom Hook** (`src/hooks/useBlock.ts`)
   - Easy-to-use hook for block functionality
   - State management and actions

6. **Settings Page** (`src/app/[locale]/(mainlayout)/blocks/page.tsx`)
   - Dedicated block management page

## 🚀 **Integration Steps**

### **1. Environment Setup**
Make sure your `.env.local` file has the API URL:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### **2. Store Integration**
The block slice is already added to your Redux store in `src/store/store.ts`.

### **3. Using Block Components**

#### **Block Button Component**
```tsx
import { BlockButton } from '@/components/block';

// Basic usage
<BlockButton targetUserId="user123" targetUsername="john_doe" />

// Custom styling
<BlockButton 
  targetUserId="user123" 
  targetUsername="john_doe"
  variant="destructive"
  size="sm"
  showIcon={false}
  showText={false}
/>
```

#### **Block Status Indicator**
```tsx
import { BlockStatusIndicator } from '@/components/block';

// Show block status badge
<BlockStatusIndicator userId="user123" />

// Custom styling
<BlockStatusIndicator 
  userId="user123" 
  showTooltip={false}
  className="ml-2"
/>
```

#### **Blocked Users List**
```tsx
import { BlockedUsersList } from '@/components/block';

// Full list component
<BlockedUsersList />
```

### **4. Using the Custom Hook**
```tsx
import { useBlock } from '@/hooks/useBlock';

const MyComponent = () => {
  const { 
    blockUser, 
    unblockUser, 
    isBlocked, 
    isBlockedBy,
    blockedUsers,
    loading 
  } = useBlock();

  const handleBlock = async () => {
    const success = await blockUser('user123', 'Spam content');
    if (success) {
      console.log('User blocked successfully');
    }
  };

  return (
    <div>
      {isBlocked('user123') && <p>This user is blocked</p>}
      {isBlockedBy('user123') && <p>This user blocked you</p>}
    </div>
  );
};
```

## 🔧 **Integration Points**

### **User Profile Pages**
Add block button to user profiles:
```tsx
// In profile components
import { BlockButton } from '@/components/block';

<div className="user-actions">
  <BlockButton 
    targetUserId={user.id} 
    targetUsername={user.username}
    variant="outline"
    size="sm"
  />
</div>
```

### **User Lists/Search Results**
Add block status indicators:
```tsx
// In user list components
import { BlockStatusIndicator } from '@/components/block';

<div className="user-card">
  <h3>{user.name}</h3>
  <BlockStatusIndicator userId={user.id} />
</div>
```

### **Posts/Comments**
Hide content from blocked users:
```tsx
// In post components
import { useBlock } from '@/hooks/useBlock';

const PostComponent = ({ post }) => {
  const { isBlocked, isBlockedBy } = useBlock();
  
  // Don't show posts from blocked users
  if (isBlocked(post.author.id)) {
    return <div className="blocked-content">This content is hidden</div>;
  }
  
  // Don't show posts to users who blocked you
  if (isBlockedBy(post.author.id)) {
    return <div className="blocked-content">This content is hidden</div>;
  }
  
  return <PostContent post={post} />;
};
```

### **Chat/Messaging**
Prevent messages from blocked users:
```tsx
// In chat components
import { useBlock } from '@/hooks/useBlock';

const ChatMessage = ({ message }) => {
  const { isBlocked, isBlockedBy } = useBlock();
  
  if (isBlocked(message.sender.id) || isBlockedBy(message.sender.id)) {
    return <div className="blocked-message">Message from blocked user</div>;
  }
  
  return <MessageContent message={message} />;
};
```

## 📱 **Navigation Integration**

Add block management to your navigation:
```tsx
// In navigation components
<NavItem href="/blocks" icon={<UserX />}>
  Block Management
</NavItem>
```

## 🎨 **Styling Customization**

### **Custom Block Button Styles**
```css
/* Add to your CSS */
.block-button-custom {
  @apply bg-red-500 hover:bg-red-600 text-white;
}

.block-button-custom:disabled {
  @apply bg-gray-400 cursor-not-allowed;
}
```

### **Block Status Badge Styles**
```css
.block-status-badge {
  @apply text-xs font-medium;
}

.block-status-badge.blocked {
  @apply bg-red-100 text-red-800;
}

.block-status-badge.blocked-by {
  @apply bg-yellow-100 text-yellow-800;
}
```

## 🔍 **Testing Checklist**

- [ ] Block a user successfully
- [ ] Unblock a user successfully
- [ ] Check block status for different users
- [ ] Load blocked users list
- [ ] Show block status indicators
- [ ] Handle API errors gracefully
- [ ] Test loading states
- [ ] Verify authentication requirements
- [ ] Test confirmation dialogs
- [ ] Check mobile responsiveness

## 🚨 **Error Handling**

The system handles these common errors:
- **401 Unauthorized**: Token expired or invalid
- **403 Forbidden**: User doesn't have permission
- **404 Not Found**: User doesn't exist
- **409 Conflict**: Already blocked/unblocked
- **400 Bad Request**: Invalid data

## 📊 **API Endpoints Used**

All endpoints are relative to your `NEXT_PUBLIC_API_URL`:

- `POST /blocks` - Block a user
- `DELETE /blocks/:blockedId` - Unblock a user
- `PUT /blocks/:blockedId` - Update block
- `GET /blocks/blocked` - Get blocked users
- `GET /blocks/blocked-by` - Get users who blocked you
- `GET /blocks/check/:userId` - Check block relationship
- `GET /blocks/stats` - Get block statistics
- `GET /blocks/is-blocked/:userId` - Check if blocked
- `GET /blocks/is-blocked-by/:userId` - Check if blocked by

## 🎯 **Next Steps**

1. **Test the integration** with your backend
2. **Add block buttons** to user profiles
3. **Integrate block status** in user lists
4. **Add block management** to navigation
5. **Test all scenarios** thoroughly
6. **Add translations** for internationalization
7. **Style components** to match your design
8. **Add analytics** for block actions

## 📞 **Support**

If you encounter any issues:
1. Check the browser console for errors
2. Verify your API endpoints are working
3. Ensure authentication tokens are valid
4. Check the Redux DevTools for state issues

The block system is now fully integrated and ready to use! 🎉 