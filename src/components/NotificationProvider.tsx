import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { fetchNotifications } = useNotifications();
  const fetchNotificationsRef = useRef(fetchNotifications);

  // Update ref when fetchNotifications changes
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    const loadNotifications = async () => {
      if (user && token && user._id) {
        await fetchNotificationsRef.current();
      }
    };
    loadNotifications();
  }, [user, user?._id, token]);

  return <>{children}</>;
};

export default NotificationProvider; 