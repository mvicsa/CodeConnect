'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { useBlock } from '@/hooks/useBlock';

const BlockStatusChecker = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { checkBlockStatus } = useBlock();
  const posts = useSelector((state: RootState) => state.posts.posts);
  const comments = useSelector((state: RootState) => state.comments.comments);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Use stable selectors to prevent unnecessary re-renders
  const blockStatuses = useSelector((state: RootState) => state.block.blockStatuses);
  const checkedUsersRef = useRef(new Set<string>());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCheckUsers = useCallback(() => {
    if (!user?._id) return;

    // Get all unique user IDs from posts and comments
    const postAuthorIds = posts.map(post => post.createdBy._id).filter(Boolean);
    const commentAuthorIds = comments.map(comment => comment.createdBy._id).filter(Boolean);
    
    // Combine and remove duplicates
    const allUserIds = [...new Set([...postAuthorIds, ...commentAuthorIds])];
    
    // Remove current user from the list
    const otherUserIds = allUserIds.filter(id => id !== user._id);
    
    // Only check users that haven't been checked before and are not in blockStatuses
    const usersToCheck = otherUserIds.filter(userId => 
      !checkedUsersRef.current.has(userId) && 
      !blockStatuses[userId]
    ).slice(0, 10);
    
    if (usersToCheck.length > 0) {
      console.log('Checking block status for users:', usersToCheck);
      usersToCheck.forEach(userId => {
        if (userId) {
          checkBlockStatus(userId);
          checkedUsersRef.current.add(userId);
        }
      });
    }
  }, [user?._id, posts, comments]);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout to debounce the check
    timeoutRef.current = setTimeout(debouncedCheckUsers, 500);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      checkedUsersRef.current.clear();
    };
  }, [debouncedCheckUsers]);

  // This component doesn't render anything
  return null;
};

export default BlockStatusChecker; 