import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { fetchNotifications } = useNotifications();

  // Fetch notifications when user is authenticated
  useEffect(() => {
    const loadNotifications = async () => {
      if (user && token && user._id) {
        await fetchNotifications();
      }
    };
    loadNotifications();
  }, [user, user?._id, token, fetchNotifications]);

  return <>{children}</>;
};

export default NotificationProvider; 