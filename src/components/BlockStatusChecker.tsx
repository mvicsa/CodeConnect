'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useBlock } from '@/hooks/useBlock';

const BlockStatusChecker = () => {
  const { checkBlockStatus } = useBlock();
  const posts = useSelector((state: RootState) => state.posts.posts);
  const comments = useSelector((state: RootState) => state.comments.comments);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Use stable selectors to prevent unnecessary re-renders
  const blockStatuses = useSelector((state: RootState) => state.block.blockStatuses);
  const checkedUsersRef = useRef(new Set<string>());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkBlockStatusRef = useRef(checkBlockStatus);

  // Update ref when checkBlockStatus changes
  useEffect(() => {
    checkBlockStatusRef.current = checkBlockStatus;
  }, [checkBlockStatus]);

  const debouncedCheckUsers = useCallback(() => {
    if (!user?._id) return;

    // Get all unique user IDs from posts and comments
    const postAuthorIds = posts.map(post => post.createdBy._id).filter(Boolean);
    const commentAuthorIds = comments.map(comment => comment.createdBy._id).filter(Boolean);
    
    // Get user IDs from post reactions
    const postReactionUserIds = posts.flatMap(post => 
      (post.userReactions || []).map(reaction => reaction.userId._id).filter((id): id is string => Boolean(id))
    );
    
    // Get user IDs from comment reactions
    const commentReactionUserIds = comments.flatMap(comment => 
      (comment.userReactions || []).map(reaction => reaction.userId._id).filter((id): id is string => Boolean(id))
    );
    
    // Combine and remove duplicates
    const allUserIds = [...new Set([
      ...postAuthorIds, 
      ...commentAuthorIds, 
      ...postReactionUserIds,
      ...commentReactionUserIds
    ])];
    
    // Remove current user from the list
    const otherUserIds = allUserIds.filter(id => id !== user._id);
    
    // Only check users that haven't been checked before and are not in blockStatuses
    const usersToCheck = otherUserIds.filter(userId => 
      !checkedUsersRef.current.has(userId) && 
      !blockStatuses[userId]
    ).slice(0, 10);
    
    if (usersToCheck.length > 0) {
      usersToCheck.forEach(userId => {
        if (userId) {
          checkBlockStatusRef.current(userId);
          checkedUsersRef.current.add(userId);
        }
      });
    }
  }, [user?._id, posts, comments, blockStatuses])

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout to debounce the check
    timeoutRef.current = setTimeout(debouncedCheckUsers, 500);

    // Store the ref value in a variable to avoid the warning
    const currentCheckedUsers = checkedUsersRef.current;

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      currentCheckedUsers.clear();
    };
  }, [checkBlockStatusRef, user?._id, posts, comments, debouncedCheckUsers]);

  // This component doesn't render anything
  return null;
};

export default BlockStatusChecker; 