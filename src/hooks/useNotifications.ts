import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationType } from '@/types/notification';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllUserNotifications,
    getUnreadNotificationsCount,
    formatNotificationTime
} from '@/services/notificaionAPI';
import { socketService } from '@/services/socketService';

interface UseNotificationsOptions {
    userId: string;
    autoConnect?: boolean;
    limit?: number;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    deleteAllNotifications: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
    isConnected: boolean;
    socketId: string | null;
}

export const useNotifications = (options: UseNotificationsOptions): UseNotificationsReturn => {
    const { userId, autoConnect = true, limit = 20 } = options;
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [currentSkip, setCurrentSkip] = useState<number>(0);

    // تحميل الإشعارات الأولية
    const loadInitialNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // فحص وجود token
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.warn('⚠️ No token found, skipping notifications load');
                    setNotifications([]);
                    setUnreadCount(0);
                    return;
                }
            }
            
            const result = await getUserNotifications(userId, { limit });
            
            // فحص وتصحيح التواريخ
            const validatedNotifications = result.notifications.map(notification => {
                if (!notification.createdAt) {
                    console.warn('⚠️ Notification missing createdAt:', notification._id);
                    return { ...notification, createdAt: new Date().toISOString() };
                }
                
                const notificationTime = new Date(notification.createdAt).getTime();
                if (isNaN(notificationTime)) {
                    console.warn('⚠️ Invalid createdAt date:', notification.createdAt, 'for notification:', notification._id);
                    return { ...notification, createdAt: new Date().toISOString() };
                }
                
                return notification;
            });
            
            console.log('📥 Loaded notifications:', validatedNotifications.length);
            setNotifications(validatedNotifications);
            setHasMore(result.hasMore);
            setCurrentSkip(limit);
            
            // حساب عدد الإشعارات غير المقروءة من البيانات المحملة
            const unreadFromLoaded = validatedNotifications.filter(n => !n.isRead).length;
            console.log('📊 Unread count from loaded data:', unreadFromLoaded);
            
            // تحديث عدد الإشعارات غير المقروءة من الباك إند (فقط للتحقق)
            try {
                const count = await getUnreadNotificationsCount(userId);
                console.log('📊 Unread count from backend:', count);
                
                // إذا كان هناك فرق كبير، استخدم الرقم من الباك إند
                if (Math.abs(unreadFromLoaded - count) > 2) {
                    console.warn('⚠️ Large difference between local and backend unread count, using backend count');
                    setUnreadCount(count);
                } else {
                    // استخدام الرقم المحلي (أكثر دقة)
                    setUnreadCount(unreadFromLoaded);
                }
            } catch (error) {
                console.warn('Failed to get unread count from backend, using local count:', error);
                setUnreadCount(unreadFromLoaded);
            }
        } catch (error) {
            console.error('Failed to load initial notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, limit]);

    // تحميل المزيد من الإشعارات
    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        try {
            setIsLoading(true);
            const result = await getUserNotifications(userId, { 
                limit, 
                skip: currentSkip 
            });
            
            // إزالة الإشعارات المكررة
            setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n._id));
                const newNotifications = result.notifications.filter(n => !existingIds.has(n._id));
                return [...prev, ...newNotifications];
            });
            
            setHasMore(result.hasMore);
            setCurrentSkip(prev => prev + limit);
        } catch (error) {
            console.error('Failed to load more notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, userId, limit, currentSkip]);

    // تحديد إشعار كمقروء
    const markAsRead = useCallback(async (id: string) => {
        try {
            console.log('📝 Marking notification as read:', id);
            await markNotificationAsRead(id);
            
            // تحديث الإشعار المحلي
            setNotifications(prev => 
                prev.map(notif => 
                    notif._id === id ? { ...notif, isRead: true } : notif
                )
            );
            
            console.log('✅ Notification marked as read successfully');
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // حتى لو فشل الباك إند، نحدث المحلي
            setNotifications(prev => 
                prev.map(notif => 
                    notif._id === id ? { ...notif, isRead: true } : notif
                )
            );
        }
    }, []);

    // تحديد جميع الإشعارات كمقروءة
    const markAllAsRead = useCallback(async () => {
        try {
            console.log('📝 Marking all notifications as read');
            await markAllNotificationsAsRead(userId);
            
            // تحديث الإشعارات المحلية
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, isRead: true }))
            );
            
            console.log('✅ All notifications marked as read successfully');
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            // حتى لو فشل الباك إند، نحدث المحلي
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, isRead: true }))
            );
        }
    }, [userId]);

    // حذف إشعار
    const deleteNotificationHandler = useCallback(async (id: string) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(notif => notif._id !== id));
            
            // تحديث عدد الإشعارات غير المقروءة إذا كان الإشعار المحذوف غير مقروء
            const deletedNotification = notifications.find(n => n._id === id);
            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    }, [notifications]);

    // حذف جميع الإشعارات
    const deleteAllNotificationsHandler = useCallback(async () => {
        try {
            await deleteAllUserNotifications(userId);
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
        }
    }, [userId]);

    // تحديث عدد الإشعارات غير المقروءة من البيانات المحلية
    const updateUnreadCountFromLocal = useCallback(() => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        console.log('📊 Updating unread count from local data:', unreadCount);
        setUnreadCount(unreadCount);
    }, [notifications]);

    // تحديث الإشعارات
    const refreshNotifications = useCallback(async () => {
        await loadInitialNotifications();
    }, [loadInitialNotifications]);

    // معالجة الإشعارات الجديدة من Socket.IO
    const handleNewNotification = useCallback((notification: Notification) => {
        console.log('📨 New notification received in hook:', notification);
        
        // فحص إذا كان التاريخ صحيح
        if (!notification.createdAt) {
            console.warn('⚠️ Notification missing createdAt:', notification._id);
            notification.createdAt = new Date().toISOString();
        } else {
            // فحص إذا كان التاريخ صحيح
            const notificationTime = new Date(notification.createdAt).getTime();
            if (isNaN(notificationTime)) {
                console.warn('⚠️ Invalid createdAt date:', notification.createdAt, 'for notification:', notification._id);
                notification.createdAt = new Date().toISOString();
            }
        }
        
        // فحص إذا كان الإشعار قديم (أكثر من دقيقة)
        const now = Date.now();
        const notificationTime = new Date(notification.createdAt).getTime();
        if (now - notificationTime > 60000) {
            console.log('🚫 Skipping old notification from socket:', notification._id);
            return;
        }
        
        // فحص إذا كان الإشعار موجود بالفعل
        setNotifications(prev => {
            const exists = prev.some(n => n._id === notification._id);
            if (exists) {
                console.log('⚠️ Notification already exists, skipping:', notification._id);
                return prev;
            }
            
            // إضافة الإشعار الجديد في بداية القائمة
            return [notification, ...prev];
        });
        
        // زيادة عدد الإشعارات غير المقروءة
        setUnreadCount(prev => prev + 1);
    }, []);

    // تحديث عدد الإشعارات غير المقروءة عند تغيير الإشعارات
    useEffect(() => {
        updateUnreadCountFromLocal();
    }, [notifications, updateUnreadCountFromLocal]);

    // تحميل الإشعارات الأولية عند تغيير المستخدم
    useEffect(() => {
        if (userId) {
            loadInitialNotifications();
        }
    }, [userId, loadInitialNotifications]);

    // الاتصال بـ Socket.IO عند تسجيل الدخول
    useEffect(() => {
        if (userId && autoConnect) {
            const token = localStorage.getItem('token');
            
            // الاتصال بـ Socket.IO بشكل async
            const connectSocket = async () => {
                try {
                    await socketService.connect(userId, token || undefined);
                    console.log('✅ Socket connected successfully');
                } catch (error) {
                    console.error('❌ Failed to connect socket:', error);
                }
            };
            
            connectSocket();
            
            // إضافة مستمع للإشعارات الجديدة
            const removeListener = socketService.onNotification(handleNewNotification);
            
            return () => {
                removeListener();
                socketService.disconnect();
            };
        }
    }, [userId, autoConnect, handleNewNotification]);

    return {
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification: deleteNotificationHandler,
        deleteAllNotifications: deleteAllNotificationsHandler,
        refreshNotifications,
        isConnected: socketService.isConnected(),
        socketId: socketService.getSocketId()
    };
};

// Hook مبسط للاستخدام السريع (backward compatibility)
export const useNotificationsSimple = () => {
    let userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    console.log('🔍 Checking userId:', userId);
    
    // إذا مفيش userId، جرب تجيبه من أماكن أخرى
    if (!userId) {
        // جرب تجيبه من user data
        const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (userData) {
            try {
                const user = JSON.parse(userData);
                userId = user._id || user.id;
                console.log('✅ Found userId from user data:', userId);
            } catch (error) {
                console.error('❌ Error parsing user data:', error);
            }
        }
        
        // إذا لسه مفيش، جرب تجيبه من token (JWT decode)
        if (!userId) {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (token) {
                try {
                    // JWT decode بسيط (بدون signature verification)
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    userId = payload.userId || payload.sub || payload.id;
                    console.log('✅ Found userId from token:', userId);
                } catch (error) {
                    console.error('❌ Error decoding token:', error);
                }
            }
        }
        
        // حفظ userId في localStorage إذا وجدناه
        if (userId && typeof window !== 'undefined') {
            localStorage.setItem('userId', userId);
            console.log('💾 Saved userId to localStorage');
        }
    }
    
    if (!userId) {
        console.log('❌ No userId found anywhere');
        return {
            notifications: [],
            unreadCount: 0,
            isLoading: false,
            hasMore: false,
            loadMore: async () => {},
            markAsRead: async () => {},
            markAllAsRead: async () => {},
            deleteNotification: async () => {},
            deleteAllNotifications: async () => {},
            refreshNotifications: async () => {},
            isConnected: false,
            socketId: null
        };
    }

    return useNotifications({ userId });
}; 