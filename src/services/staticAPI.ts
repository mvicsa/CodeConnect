import {
    MessageSquare,
    Check,
    Clock,
    Calendar,
    Package,
    CreditCard,
    Shield,
    Trash2,
    type LucideIcon
} from 'lucide-react';

import { Notification, LoadMoreResponse } from '@/types/notification';

export const initialNotifications: Notification[] = [
    {
        id: 1,
        title: 'Payment Successful',
        message: 'Your payment of $299.99 has been processed successfully.',
        time: '2 minutes ago',
        read: false,
        icon: CreditCard
    },
    {
        id: 2,
        title: 'New Message',
        message: 'Sarah Johnson sent you a message about the upcoming project meeting.',
        time: '5 minutes ago',
        read: false,
        icon: MessageSquare
    },
    {
        id: 3,
        title: 'Security Alert',
        message: 'New login detected from Chrome on Windows. Was this you?',
        time: '1 hour ago',
        read: true,
        icon: Shield
    },
    {
        id: 4,
        title: 'Calendar Reminder',
        message: 'Team standup meeting starts in 30 minutes.',
        time: '2 hours ago',
        read: false,
        icon: Calendar
    },
    {
        id: 5,
        title: 'Order Delivered',
        message: 'Your order #12345 has been delivered successfully.',
        time: '3 hours ago',
        read: true,
        icon: Package
    },
    {
        id: 6,
        title: 'Failed to Save',
        message: 'Your document could not be saved. Please try again.',
        time: '4 hours ago',
        read: false,
        icon: Trash2
    }
];

export const generateTimeText = (hours: number): string => {
    if (hours < 1) return 'Less than an hour ago';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;

    const weeks = Math.floor(days / 7);
    if (weeks === 1) return '1 week ago';
    return `${weeks} weeks ago`;
};

export const loadMoreNotificationsAPI = async (
    currentNotifications: Notification[],
    loadCount: number
): Promise<LoadMoreResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lastId = Math.max(...currentNotifications.map(n => n.id), 0);
    const timeIncrements = [3, 4, 6, 8, 12, 24, 48, 72, 168];
    const hours = timeIncrements[Math.min(loadCount - 1, timeIncrements.length - 1)];

    const newNotifications: Notification[] = Array.from({ length: 3 }, (_, i) => ({
        id: lastId + i + 1,
        title: ['New Message', 'Task Completed', 'Reminder'][i % 3],
        message: [
            'You have a new message from the support team.',
            'Your recent task has been marked as completed.',
            'Don\'t forget about your upcoming appointment.'
        ][i % 3],
        time: generateTimeText(hours + i),
        read: true,
        icon: [MessageSquare, Check, Clock][i % 3],
    }));

    return {
        notifications: newNotifications,
        hasMore: loadCount < 5
    };
};

export const markNotificationAsReadAPI = async (notificationId: number): Promise<{ success: boolean; id: number }> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, id: notificationId };
};

export const markAllNotificationsAsReadAPI = async (): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
};

export const deleteNotificationAPI = async (notificationId: number): Promise<{ success: boolean; id: number }> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, id: notificationId };
};