'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { blockUser, unblockUser, checkBlockStatus } from '@/store/slices/blockSlice';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { fetchBlockedUsers, fetchBlockStats } from '@/store/slices/blockSlice';
import { removeNotificationsByCriteria } from '@/store/slices/notificationsSlice';

interface BlockButtonProps {
  targetUserId: string;
  targetUsername?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  showText?: boolean;
  onBlockStatusChange?: () => void;
  externalDialogControl?: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
}

export const BlockButton: React.FC<BlockButtonProps> = ({
  targetUserId,
  targetUsername,
  className = '',
  variant = 'outline',
  size = 'default',
  showIcon = true,
  showText = true,
  onBlockStatusChange,
  externalDialogControl,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading } = useSelector((state: RootState) => state.block);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  
  // Use a stable selector for blockStatuses
  const blockStatuses = useSelector((state: RootState) => state.block.blockStatuses);
  
  // Get block status for this specific user
  const blockStatus = blockStatuses[targetUserId];
  const isBlocked = blockStatus?.isBlocked || false;
  const isBlockedBy = blockStatus?.isBlockedBy || false;
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmReason, setConfirmReason] = useState('');

  const handleBlock = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    // Validate targetUserId before making the API call
    if (!targetUserId || targetUserId.trim() === '') {
      toast.error('Invalid user ID');
      return;
    }

    try {
      console.log('Blocking user with ID:', targetUserId);
      await dispatch(blockUser({ blockedId: targetUserId, reason: confirmReason })).unwrap();
      toast.success(`Successfully blocked ${targetUsername || 'user'}`);
      setShowConfirm(false);
      setConfirmReason('');
      
      // Call callback to update followers/following counts
      if (onBlockStatusChange) {
        onBlockStatusChange();
      }
      
      // Dispatch these sequentially to prevent race conditions
      await dispatch(fetchBlockedUsers());
      await dispatch(fetchBlockStats());
      
      // Remove notifications after block is confirmed
      dispatch(removeNotificationsByCriteria({
        fromUserId: targetUserId
      }));
      
      // Also remove notifications sent to the blocked user
      dispatch(removeNotificationsByCriteria({
        toUserId: targetUserId
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to block user');
    }
  };

  const handleUnblock = async () => {
    // Validate targetUserId before making the API call
    if (!targetUserId || targetUserId.trim() === '') {
      toast.error('Invalid user ID');
      return;
    }

    try {
      console.log('Unblocking user with ID:', targetUserId);
      await dispatch(unblockUser(targetUserId)).unwrap();
      toast.success(`Successfully unblocked ${targetUsername || 'user'}`);
      
      // Call callback to update followers/following counts
      if (onBlockStatusChange) {
        onBlockStatusChange();
      }
      
      // Dispatch these sequentially to prevent race conditions
      await dispatch(fetchBlockedUsers());
      await dispatch(fetchBlockStats());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to unblock user');
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setConfirmReason('');
    if (externalDialogControl) {
      externalDialogControl.onOpenChange(false);
    }
  };

  // Check block status on mount - MUST be before any early returns
  useEffect(() => {
    if (
      targetUserId && 
      targetUserId.trim() !== '' && 
      currentUser?._id !== targetUserId &&
      // Only check if block status doesn't already exist
      !blockStatuses[targetUserId]
    ) {
      dispatch(checkBlockStatus(targetUserId));
    }
  }, [targetUserId, currentUser?._id, dispatch]);

  // Don't show block button if targetUserId is invalid, if current user is blocked by target, or if trying to block yourself
  if (!targetUserId || targetUserId.trim() === '' || currentUser?._id === targetUserId) {
    return null;
  }

  // Determine if the current user has blocked the target user
  const isCurrentUserBlockedTarget = blockStatuses[targetUserId]?.isBlocked || false;
  
  // If the current user has blocked the target, show Unblock button
  if (isCurrentUserBlockedTarget) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleUnblock}
        disabled={actionLoading}
        className={className}
      >
        {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {showIcon && <UserCheck className="h-4 w-4" />}
        {showText && 'Unblock'}
      </Button>
    );
  }

  // Default to Block button
  return (
    <AlertDialog 
      open={externalDialogControl ? externalDialogControl.open : showConfirm} 
      onOpenChange={externalDialogControl ? externalDialogControl.onOpenChange : setShowConfirm}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={actionLoading}
          className={className}
        >
          {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {showIcon && <UserX className="h-4 w-4" />}
          {showText && 'Block'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to block {targetUsername || 'this user'}? 
            You won't see their posts or receive messages from them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="block-reason" className="text-sm font-medium mb-2">
              Reason (optional)
            </Label>
            <Textarea
              id="block-reason"
              value={confirmReason}
              onChange={(e) => setConfirmReason(e.target.value)}
              placeholder="Why are you blocking this user?"
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleBlock} className="bg-red-600 hover:bg-red-700">
            Block User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 