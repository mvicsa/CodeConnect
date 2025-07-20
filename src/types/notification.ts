import { LucideIcon } from 'lucide-react';

export interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: LucideIcon;
    link?: string; 
}

export interface LoadMoreResponse {
    notifications: Notification[];
    hasMore: boolean;
}

export type NotificationFilter = 'all' | 'read' | 'unread';