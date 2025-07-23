import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { Notification } from '@/types/notification';

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
        console.log('🔔 NotificationProvider: Loading notifications for user:', user._id);
        await fetchNotifications();
        initialFetchDone.current = true;
      }
    };

    loadNotifications();
  }, [user?._id, token, fetchNotifications]);

  // Show toast when new notifications are added
  useEffect(() => {
    // Only check for new notifications after initial fetch is done
    if (initialFetchDone.current && notifications.length > previousNotificationsLength.current && previousNotificationsLength.current > 0) {
      // Get the latest notification (first one in array since new notifications are prepended)
      const latestNotification = notifications[0];
      
      if (latestNotification && !latestNotification.isRead) {
        console.log('🎉 NotificationProvider: Showing toast for new notification:', {
          id: latestNotification._id,
          type: latestNotification.type,
          content: latestNotification.content
        });
        showNotificationToast(latestNotification);
      }
    }
    
    // Update the count only after initial fetch is done
    if (initialFetchDone.current) {
      previousNotificationsLength.current = notifications.length;
    }
  }, [notifications]);

  const showNotificationToast = (notification: Notification) => {
    // Helper functions
    const getDisplayName = (user: any) => {
      if (!user) return 'Someone';
      return user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.username || 'Someone';
    };
    
    const getNotificationTypeIcon = (type: string) => {
      switch (type) {
        case 'POST_REACTION': return '👍';
        case 'COMMENT_ADDED': return '💬';
        case 'FOLLOWED_USER': return '👥';
        case 'USER_MENTIONED': return '🏷️';
        case 'MESSAGE_RECEIVED': return '📨';
        case 'POST_CREATED': return '📝';
        default: return '🔔';
      }
    };

    const getNotificationLink = (notif: Notification): string | undefined => {
      if (notif.type.toLowerCase().includes('post')) {
        const postId = notif.data?.postId || notif.data?._id;
        return postId ? `/posts/${postId}` : undefined;
      } else if (notif.type.toLowerCase().includes('comment') || notif.type.toLowerCase().includes('reply')) {
        // Try multiple ways to get postId
        let postId: string | undefined = undefined;
        
        // Method 1: Direct postId in data
        if (notif.data?.postId) {
          postId = String(notif.data.postId);
        }
        // Method 2: postId in comment object
        else if (notif.data?.comment?.postId) {
          const rawPostId = notif.data.comment.postId;
          if (typeof rawPostId === 'object' && '_id' in rawPostId) {
            postId = (rawPostId as { _id: string })._id;
          } else if (typeof rawPostId === 'string') {
            postId = rawPostId;
          }
        }
        // Method 2.1: Check populated commentId structure
        else if (notif.data?.commentId && typeof notif.data.commentId === 'object') {
          const commentData = notif.data.commentId as any;
          if (commentData.postId) {
            if (typeof commentData.postId === 'object' && commentData.postId._id) {
              postId = commentData.postId._id;
            } else if (typeof commentData.postId === 'string') {
              postId = commentData.postId;
            }
          }
        }
        // Method 3: Look for post object
        else if (notif.data?.post?._id) {
          postId = notif.data.post._id;
        }
        
        const commentId = notif.data._id || notif.data?.commentId;
        return postId && commentId ? `/posts/${postId}/${commentId}` : 
               postId ? `/posts/${postId}` : undefined;
      } else if (notif.type === 'FOLLOWED_USER') {
        return notif.fromUserId?.username ? `/profile/${notif.fromUserId.username}` : undefined;
      }
      return undefined;
    };
    
    // const displayName = getDisplayName(notification.fromUserId);
    // const message = notification.content || 'You have a new notification';
    // const typeIcon = getNotificationTypeIcon(notification.type);
    
    // console.log('🎨 Showing notification toast:', { displayName, message, typeIcon });
    
    // Show toast with enhanced styling
    // try {
    //   toast(message, {
    //     description: `From ${displayName}`,
    //     duration: 5000,
    //     className: 'toast-notification',
    //     action: {
    //       label: 'View',
    //       onClick: () => {
    //         console.log('Toast clicked for notification:', notification._id);
    //         const link = getNotificationLink(notification);
    //         if (link && typeof window !== 'undefined') {
    //           window.location.href = link;
    //         }
    //       }
    //     },
    //     icon: notification.fromUserId?.avatar ? (
    //       <div className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
    //         <img 
    //           src={notification.fromUserId.avatar} 
    //           alt={displayName}
    //           className="w-full h-full object-cover"
    //         />
    //       </div>
    //     ) : (
    //       <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-lg">
    //         {typeIcon}
    //       </div>
    //     )
    //   });
    //   console.log('✅ Notification toast displayed successfully');
    // } catch (error) {
    //   console.error('❌ Failed to show notification toast:', error);
    // }

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