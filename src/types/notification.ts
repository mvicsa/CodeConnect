
import { LucideIcon } from 'lucide-react';


export interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: LucideIcon;
}

export interface LoadMoreResponse {
    notifications: Notification[];
    hasMore: boolean;
}
