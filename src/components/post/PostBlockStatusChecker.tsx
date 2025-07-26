'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useBlock } from '@/hooks/useBlock';
import { PostType, UserReaction } from '@/types/post';

interface PostBlockStatusCheckerProps {
  post: PostType;
}

const PostBlockStatusChecker = ({ post }: PostBlockStatusCheckerProps) => {
  const { checkBlockStatus } = useBlock();
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

  const checkPostUsers = useCallback(() => {
    if (!user?._id || !post) return;

    // Get all unique user IDs from this specific post
    const userIds = new Set<string>();
    
    // Add post author
    if (post.createdBy?._id) {
      userIds.add(post.createdBy._id);
    }
    
    // Add users who reacted to the post
    if (post.userReactions) {
      post.userReactions.forEach((reaction: UserReaction) => {
        if (reaction.userId._id) {
          userIds.add(reaction.userId._id);
        }
      });
    }
    
    // Remove current user from the list
    const otherUserIds = Array.from(userIds).filter(id => id !== user._id);
    
    // Only check users that haven't been checked before and are not in blockStatuses
    const usersToCheck = otherUserIds.filter(userId => 
      !checkedUsersRef.current.has(userId) && 
      !blockStatuses[userId]
    );
    
    if (usersToCheck.length > 0) {
      usersToCheck.forEach(userId => {
        if (userId) {
          checkBlockStatusRef.current(userId);
          checkedUsersRef.current.add(userId);
        }
      });
    }
  }, [user?._id, post, blockStatuses]);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout to debounce the check
    timeoutRef.current = setTimeout(checkPostUsers, 100);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [post._id, user?._id, checkPostUsers]);

  // This component doesn't render anything
  return null;
};

export default PostBlockStatusChecker; 