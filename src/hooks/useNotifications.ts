import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import axios from 'axios';
import { useCallback } from 'react';
import {
  setNotifications,
  deleteNotification,
  deleteByPostAndUser,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from '@/store/slices/notificationsSlice';
import { getAuthToken } from '@/lib/cookies';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount);
  
  // Get auth token for API calls
  const getAuthHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const userId = user?._id;
      
      if (userId) {
        const response = await axios.get(
          `${API_BASE_URL}/notifications/user/${userId}`,
          { headers: getAuthHeaders() }
        );
        dispatch(setNotifications(response.data));
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
    }
  }, [user?._id, dispatch, getAuthHeaders]);

  // Mark a single notification as read (API + Redux)
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      dispatch(markAsRead(notificationId));
    } catch {
      toast.error('Failed to mark notification as read'); 
      // Still update locally for better UX
      dispatch(markAsRead(notificationId));
    }
  }, [dispatch, getAuthHeaders]);

  // Mark all notifications as read (API + Redux)
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const userId = user?._id;
      if (userId) {
        await axios.patch(
          `${API_BASE_URL}/notifications/user/${userId}/read-all`,
          {},
          { headers: getAuthHeaders() }
        );
      }
      dispatch(markAllAsRead());
    } catch {
      toast.error('Failed to mark all notifications as read'); 
      // Still update locally for better UX
      dispatch(markAllAsRead());
    }
  }, [user?._id, dispatch, getAuthHeaders]);

  // Delete a single notification (API + Redux)
  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/notifications/${notificationId}`,
        { headers: getAuthHeaders() }
      );
      dispatch(deleteNotification(notificationId));
    } catch {
      toast.error('Failed to delete notification'); 
      // Still update locally for better UX
      dispatch(deleteNotification(notificationId));
    }
  }, [dispatch, getAuthHeaders]);

  // Delete all notifications (API + Redux)
  const handleDeleteAllNotifications = useCallback(async () => {
    try {
      const userId = user?._id;
      if (userId) {
        await axios.delete(
          `${API_BASE_URL}/notifications/user/${userId}`,
          { headers: getAuthHeaders() }
        );
      }
      dispatch(clearNotifications());
    } catch {
      toast.error('Failed to delete all notifications'); 
      // Still update locally for better UX
      dispatch(clearNotifications());
    }
  }, [user?._id, dispatch, getAuthHeaders]);

  // Delete reaction notification by post, type, and user (local only - used by socket events)
  const handleDeleteReactionNotification = useCallback((targetId: string, type: string, fromUserId: string, reactionType?: string) => {
    if (type === 'POST_REACTION') {
      dispatch(deleteByPostAndUser({ postId: targetId, type, fromUserId, reactionType }));
    } else if (type === 'COMMENT_REACTION') {
      dispatch(deleteByPostAndUser({ commentId: targetId, type, fromUserId, reactionType }));
    }
    
    // إعادة تحميل الإشعارات بعد فترة قصيرة للتأكد من التحديث
    setTimeout(() => {
      fetchNotifications();
    }, 500);
  }, [dispatch, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
    handleDeleteAllNotifications,
    handleDeleteReactionNotification,
    fetchNotifications,
  };
};