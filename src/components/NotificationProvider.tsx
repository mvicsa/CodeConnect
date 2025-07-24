import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { notifications } = useSelector((state: RootState) => state.notifications);
  const { fetchNotifications } = useNotifications();
  const previousNotificationsLength = useRef(0);
  const initialFetchDone = useRef(false);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    const loadNotifications = async () => {
      if (user && token && user._id) {
        await fetchNotifications();
        initialFetchDone.current = true;
      }
    };

    loadNotifications();
  }, [user, user?._id, token, fetchNotifications]);

  // Show toast when new notifications are added
  useEffect(() => {
    // Only check for new notifications after initial fetch is done
    if (initialFetchDone.current && notifications.length > previousNotificationsLength.current && previousNotificationsLength.current > 0) {
      // Get the latest notification (first one in array since new notifications are prepended)
      const latestNotification = notifications[0];
      
      if (latestNotification && !latestNotification.isRead) {
        showNotificationToast();
      }
    }
    
    // Update the count only after initial fetch is done
    if (initialFetchDone.current) {
      previousNotificationsLength.current = notifications.length;
    }
  }, [notifications]);

  const showNotificationToast = () => {

    // Play notification sound if enabled
    if (typeof window !== 'undefined' && localStorage.getItem('notificationSound') !== 'disabled') {
      try {
        const audio = new Audio('/sounds/notification.wav');
        audio.volume = 0.5;
        audio.play().catch(error => {
          console.warn('Failed to play notification sound:', error);
        });
      } catch (error) {
        console.warn('Failed to create notification audio:', error);
      }
    }
    
    // Vibrate if enabled and supported
    if (typeof window !== 'undefined' && 
        localStorage.getItem('notificationVibration') !== 'disabled' && 
        'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (error) {
        console.warn('Failed to vibrate:', error);
      }
    }
  };

  return <>{children}</>;
};

export default NotificationProvider; 