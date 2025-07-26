import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useRef, useEffect } from 'react';
import { AppDispatch, RootState } from '@/store/store';
import { 
  blockUser, 
  unblockUser, 
  checkBlockStatus, 
  fetchBlockedUsers, 
  fetchBlockStats,
  clearError 
} from '@/store/slices/blockSlice';
import { toast } from 'sonner';

export const useBlock = () => {
  const dispatch = useDispatch<AppDispatch>();
  const dispatchRef = useRef(dispatch);
  
  // Update ref when dispatch changes
  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);
  
  const { 
    blockedUsers, 
    blockedByUsers, 
    stats, 
    loading, 
    actionLoading, 
    error 
  } = useSelector((state: RootState) => state.block);
  
  // Use a more stable selector for blockStatuses
  const blockStatuses = useSelector((state: RootState) => state.block.blockStatuses);

  const blockUserHandler = useCallback(async (blockedId: string, reason?: string) => {
    try {
      await dispatchRef.current(blockUser({ blockedId, reason })).unwrap();
      toast.success('User blocked successfully');
      return true;
    } catch (error) {
      toast.error(error as string || 'Failed to block user');
      return false;
    }
  }, []);

  const unblockUserHandler = useCallback(async (blockedId: string) => {
    try {
      await dispatchRef.current(unblockUser(blockedId)).unwrap();
      toast.success('User unblocked successfully');
      return true;
    } catch (error) {
      toast.error(error as string || 'Failed to unblock user');
      return false;
    }
  }, []);

  const checkBlockStatusHandler = useCallback(async (userId: string) => {
    // Don't check if we already have the status
    if (blockStatuses[userId]) {
      return true;
    }
    
    try {
      await dispatchRef.current(checkBlockStatus(userId)).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to check block status:', error);
      return false;
    }
  }, [blockStatuses]);

  const loadBlockedUsers = useCallback(async () => {
    try {
      await dispatchRef.current(fetchBlockedUsers()).unwrap();
      return true;
    } catch (error) {
      toast.error(error as string || 'Failed to load blocked users');
      return false;
    }
  }, []);

  const loadBlockStats = useCallback(async () => {
    try {
      await dispatchRef.current(fetchBlockStats()).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to load block stats:', error);
      return false;
    }
  }, []);

  const getBlockStatus = useCallback((userId: string) => {
    return blockStatuses[userId] || { isBlocked: false, isBlockedBy: false };
  }, [blockStatuses]);

  const isBlocked = useCallback((userId: string) => {
    if (!userId) return false;
    const status = blockStatuses[userId];
    return status?.isBlocked || false;
  }, [blockStatuses]);

  const isBlockedBy = useCallback((userId: string) => {
    if (!userId) return false;
    const status = blockStatuses[userId];
    return status?.isBlockedBy || false;
  }, [blockStatuses]);

  const clearErrorHandler = useCallback(() => {
    dispatchRef.current(clearError());
  }, []);

  return {
    // State
    blockedUsers,
    blockedByUsers,
    stats,
    loading,
    actionLoading,
    error,
    
    // Actions
    blockUser: blockUserHandler,
    unblockUser: unblockUserHandler,
    checkBlockStatus: checkBlockStatusHandler,
    loadBlockedUsers,
    loadBlockStats,
    clearError: clearErrorHandler,
    
    // Utilities
    getBlockStatus,
    isBlocked,
    isBlockedBy,
  };
}; 