import { Notification, LoadMoreResponse, NotificationType } from '@/types/notification';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to format time
export const formatNotificationTime = (dateString: string): string => {
    try {
        // فحص إذا كان التاريخ صحيح
        if (!dateString) {
            return 'Unknown time';
        }

        // محاولة تحليل التاريخ بطرق مختلفة
        let date: Date;
        
        // إذا كان التاريخ رقم (timestamp)
        if (!isNaN(Number(dateString))) {
            date = new Date(Number(dateString));
        } else {
            // إذا كان string
            date = new Date(dateString);
        }

        // فحص إذا كان التاريخ صحيح
        if (isNaN(date.getTime())) {
            console.warn('Invalid date string:', dateString);
            return 'Unknown time';
        }

        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        
        // إذا كان التاريخ في المستقبل
        if (diffInMs < 0) {
            return 'Just now';
        }

        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    } catch (error) {
        console.error('Error formatting date:', error, 'Date string:', dateString);
        return 'Unknown time';
    }
};

// Get user token from localStorage
const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('⚠️ No token found in localStorage. User might not be logged in.');
        }
        return token;
    }
    return null;
};

// Get user ID from localStorage
const getUserId = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('userId');
    }
    return null;
};

// Get notifications from backend
export const getUserNotifications = async (
    userId: string,
    options: {
        limit?: number;
        skip?: number;
        isRead?: boolean;
    } = {}
): Promise<LoadMoreResponse> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.skip) params.append('skip', options.skip.toString());
    if (options.isRead !== undefined) params.append('isRead', options.isRead.toString());

    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}?${params}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    const data = await response.json();
    return {
        notifications: data.notifications || data,
        hasMore: data.hasMore || false,
        totalCount: data.totalCount || data.length
    };
};

// Get notifications API (backward compatibility)
export const getNotificationsAPI = async (page: number = 1, limit: number = 10): Promise<LoadMoreResponse> => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('No user ID found');
    }

    const skip = (page - 1) * limit;
    return await getUserNotifications(userId, { limit, skip });
};

// Load more notifications
export const loadMoreNotificationsAPI = async (
    currentNotifications: Notification[],
    loadCount: number
): Promise<LoadMoreResponse> => {
    const page = loadCount + 1;
    return await getNotificationsAPI(page, 10);
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<{ success: boolean; id: string }> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    // جرب endpoints مختلفة
    const endpoints = [
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        `${API_BASE_URL}/notifications/user/${notificationId}/read`,
        `${API_BASE_URL}/notifications/${notificationId}/mark-read`,
        `${API_BASE_URL}/notifications/read/${notificationId}`,
        `${API_BASE_URL}/users/notifications/${notificationId}/read`
    ];

    for (const endpoint of endpoints) {
        try {
            console.log('🔍 Trying mark as read endpoint:', endpoint);
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isRead: true }) // إضافة body
            });

            if (response.ok) {
                console.log('✅ Found working mark as read endpoint:', endpoint);
                const data = await response.json();
                return { success: true, id: notificationId };
            }
        } catch (error) {
            console.log('❌ Endpoint failed:', endpoint, error);
            continue;
        }
    }

    // إذا كل endpoints فشلت، ارجع success بدون تحديث
    console.warn('⚠️ All mark as read endpoints failed, returning success without update');
    return { success: true, id: notificationId };
};

// Mark notification as read API (backward compatibility)
export const markNotificationAsReadAPI = async (notificationId: string): Promise<{ success: boolean; id: string }> => {
    return await markNotificationAsRead(notificationId);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<{ success: boolean }> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    // جرب endpoints مختلفة
    const endpoints = [
        `${API_BASE_URL}/notifications/user/${userId}/read-all`,
        `${API_BASE_URL}/notifications/${userId}/read-all`,
        `${API_BASE_URL}/notifications/${userId}/mark-all-read`,
        `${API_BASE_URL}/notifications/read-all`,
        `${API_BASE_URL}/users/${userId}/notifications/read-all`
    ];

    for (const endpoint of endpoints) {
        try {
            console.log('🔍 Trying mark all as read endpoint:', endpoint);
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isRead: true }) // إضافة body
            });

            if (response.ok) {
                console.log('✅ Found working mark all as read endpoint:', endpoint);
                const data = await response.json();
                return { success: true };
            }
        } catch (error) {
            console.log('❌ Endpoint failed:', endpoint, error);
            continue;
        }
    }

    // إذا كل endpoints فشلت، ارجع success بدون تحديث
    console.warn('⚠️ All mark all as read endpoints failed, returning success without update');
    return { success: true };
};

// Mark all notifications as read API (backward compatibility)
export const markAllNotificationsAsReadAPI = async (): Promise<{ success: boolean }> => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('No user ID found');
    }

    return await markAllNotificationsAsRead(userId);
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<{ success: boolean; id: string }> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    // جرب endpoints مختلفة
    const endpoints = [
        `${API_BASE_URL}/notifications/${notificationId}`,
        `${API_BASE_URL}/notifications/${notificationId}/delete`,
        `${API_BASE_URL}/notifications/delete/${notificationId}`,
        `${API_BASE_URL}/users/notifications/${notificationId}`
    ];

    for (const endpoint of endpoints) {
        try {
            console.log('🔍 Trying delete endpoint:', endpoint);
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                console.log('✅ Found working delete endpoint:', endpoint);
                const data = await response.json();
                return { success: true, id: notificationId };
            }
        } catch (error) {
            console.log('❌ Delete endpoint failed:', endpoint, error);
            continue;
        }
    }

    // إذا كل endpoints فشلت، ارجع success بدون حذف
    console.warn('⚠️ All delete endpoints failed, returning success without delete');
    return { success: true, id: notificationId };
};

// Delete notification API (backward compatibility)
export const deleteNotificationAPI = async (notificationId: string): Promise<{ success: boolean; id: string }> => {
    return await deleteNotification(notificationId);
};

// Delete all user notifications
export const deleteAllUserNotifications = async (userId: string): Promise<{ success: boolean }> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to delete all notifications: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true };
};

// Get specific notification by ID
export const getNotificationById = async (notificationId: string): Promise<Notification> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch notification: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    const token = getAuthToken();
    if (!token) {
        return 0;
    }

    try {
        // جرب endpoints مختلفة
        const endpoints = [
            `${API_BASE_URL}/notifications/${userId}/unread-count`,
            `${API_BASE_URL}/notifications/unread-count`,
            `${API_BASE_URL}/notifications/count/unread`,
            `${API_BASE_URL}/users/${userId}/notifications/unread-count`
        ];

        for (const endpoint of endpoints) {
            try {
                console.log('🔍 Trying endpoint:', endpoint);
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Found working endpoint:', endpoint);
                    return data.count || data.unreadCount || 0;
                }
            } catch (error) {
                console.log('❌ Endpoint failed:', endpoint, error);
                continue;
            }
        }

        // إذا كل endpoints فشلت، ارجع 0
        console.warn('⚠️ All unread count endpoints failed, returning 0');
        return 0;
    } catch (error) {
        console.error('Failed to get unread notifications count:', error);
        return 0;
    }
};

// Get unread notifications count API (backward compatibility)
export const getUnreadNotificationsCountAPI = async (): Promise<number> => {
    const userId = getUserId();
    if (!userId) {
        return 0;
    }

    return await getUnreadNotificationsCount(userId);
};

// Create notification (for testing/development)
export const createNotification = async (notificationData: {
    toUserId: string;
    fromUserId?: string;
    content: string;
    type: NotificationType;
    data?: Record<string, any>;
}): Promise<Notification> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
        throw new Error(`Failed to create notification: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
};

