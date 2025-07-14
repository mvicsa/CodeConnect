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

type NotificationType = 'success' | 'info' | 'warning' | 'error';
type NotificationColor = 'text-success' | 'text-info' | 'text-warning' | 'text-danger';

export interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: LucideIcon;
    color: NotificationColor;
}

interface LoadMoreResponse {
    notifications: Notification[];
    hasMore: boolean;
}

type FilterOption = 'all' | 'unread' | 'read' | NotificationType;

export const initialNotifications: Notification[] = [
    {
        id: 1,
        type: 'success',
        title: 'Payment Successful',
        message: 'Your payment of $299.99 has been processed successfully.',
        time: '2 minutes ago',
        read: false,
        icon: CreditCard,
        color: 'text-success'
    },
    {
        id: 2,
        type: 'info',
        title: 'New Message',
        message: 'Sarah Johnson sent you a message about the upcoming project meeting.',
        time: '5 minutes ago',
        read: false,
        icon: MessageSquare,
        color: 'text-info'
    },
    {
        id: 3,
        type: 'warning',
        title: 'Security Alert',
        message: 'New login detected from Chrome on Windows. Was this you?',
        time: '1 hour ago',
        read: true,
        icon: Shield,
        color: 'text-warning'
    },
    {
        id: 4,
        type: 'info',
        title: 'Calendar Reminder',
        message: 'Team standup meeting starts in 30 minutes.',
        time: '2 hours ago',
        read: false,
        icon: Calendar,
        color: 'text-info'
    },
    {
        id: 5,
        type: 'success',
        title: 'Order Delivered',
        message: 'Your order #12345 has been delivered successfully.',
        time: '3 hours ago',
        read: true,
        icon: Package,
        color: 'text-success'
    },
    {
        id: 6,
        type: 'error',
        title: 'Failed to Save',
        message: 'Your document could not be saved. Please try again.',
        time: '4 hours ago',
        read: false,
        icon: Trash2,
        color: 'text-danger'
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
        type: ['info', 'success', 'warning'][i % 3] as NotificationType,
        title: ['New Message', 'Task Completed', 'Reminder'][i % 3],
        message: [
            'You have a new message from the support team.',
            'Your recent task has been marked as completed.',
            'Don\'t forget about your upcoming appointment.'
        ][i % 3],
        time: generateTimeText(hours + i),
        read: true,
        icon: [MessageSquare, Check, Clock][i % 3],
        color: ['text-info', 'text-success', 'text-warning'][i % 3] as NotificationColor
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

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export const getBadgeVariant = (type: NotificationType): BadgeVariant => {
    switch (type) {
        case 'success': return 'default';
        case 'info': return 'secondary';
        case 'warning': return 'outline';
        case 'error': return 'destructive';
        default: return 'default';
    }
};

export const getNotificationBackground = (notification: Notification): string => {
    if (notification.read) return '';

    switch (notification.type) {
        case 'success': return 'bg-success/5 border-success/20';
        case 'info': return 'bg-info/5 border-info/20';
        case 'warning': return 'bg-warning/5 border-warning/20';
        case 'error': return 'bg-danger/5 border-danger/20';
        default: return 'bg-primary/5 border-primary/20';
    }
};

export const filterOptions: FilterOption[] = ['all', 'unread', 'read', 'success', 'info', 'warning', 'error'];