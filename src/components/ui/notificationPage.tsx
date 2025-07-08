'use client';

import React, { useState, useEffect } from 'react';
import {
    Bell, Check, CheckCircle, XCircle, Settings,
    Search, Clock, User, MessageSquare, Heart,
    Calendar, Package, CreditCard, Shield, Trash2, X
} from 'lucide-react';

// Type definitions
type IconComponent = React.ComponentType<{ className?: string }>;

interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: IconComponent;
    color: string;
}

type NotificationType = 'success' | 'info' | 'warning' | 'error';
type FilterType = 'all' | 'unread' | 'read' | NotificationType;

const NotificationPage = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    // Load notifications from localStorage if available
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('notifications');
            return saved ? JSON.parse(saved) : [
                // Default notification data
                {
                    id: 1,
                    type: 'success',
                    title: 'Payment Successful',
                    message: 'Your payment of $299.99 has been processed successfully.',
                    time: '2 minutes ago',
                    read: false,
                    icon: CreditCard,
                    color: 'text-green-500'
                },
                {
                    id: 2,
                    type: 'info',
                    title: 'New Message',
                    message: 'Sarah Johnson sent you a message about the upcoming project meeting.',
                    time: '5 minutes ago',
                    read: false,
                    icon: MessageSquare,
                    color: 'text-blue-500'
                },
                {
                    id: 3,
                    type: 'warning',
                    title: 'Security Alert',
                    message: 'New login detected from Chrome on Windows. Was this you?',
                    time: '1 hour ago',
                    read: true,
                    icon: Shield,
                    color: 'text-yellow-500'
                },
                {
                    id: 4,
                    type: 'info',
                    title: 'Calendar Reminder',
                    message: 'Team standup meeting starts in 30 minutes.',
                    time: '2 hours ago',
                    read: false,
                    icon: Calendar,
                    color: 'text-purple-500'
                },
                {
                    id: 5,
                    type: 'success',
                    title: 'Order Delivered',
                    message: 'Your order #12345 has been delivered successfully.',
                    time: '3 hours ago',
                    read: true,
                    icon: Package,
                    color: 'text-green-500'
                }
            ];
        }
        return [];
    });

    const [filter, setFilter] = useState<FilterType>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Save notifications to localStorage when they change
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    const markAsRead = (id: number): void => {
        setNotifications(notifications.map((notif: Notification) =>
            notif.id === id ? { ...notif, read: true } : notif
        ));
    };

    const markAllAsRead = (): void => {
        setNotifications(notifications.map((notif: Notification) => ({ ...notif, read: true })));
    };

    const deleteNotification = (id: number): void => {
        setNotifications(notifications.filter((notif: Notification) => notif.id !== id));
    };

    const filteredNotifications: Notification[] = notifications.filter((notif: Notification) => {
        const matchesFilter: boolean = filter === 'all' ||
            (filter === 'unread' && !notif.read) ||
            (filter === 'read' && notif.read) ||
            notif.type === filter;

        const matchesSearch: boolean = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.message.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const unreadCount: number = notifications.filter((notif: Notification) => !notif.read).length;
    const filterOptions: FilterType[] = ['all', 'unread', 'read', 'success', 'info', 'warning', 'error'];

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (filterType: FilterType): void => {
        setFilter(filterType);
    };

    const loadMoreNotifications = async (): Promise<void> => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setNotifications((prev: any) => [
            ...prev,
            {
                id: prev.length + 1,
                type: 'info',
                title: 'New Notification',
                message: 'This is a newly loaded notification.',
                time: 'Just now',
                read: false,
                icon: Bell,
                color: 'text-blue-500'
            }
        ]);

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen">
            {/* Notification Bell Button */}
            <div className="fixed top-4 right-4 z-50">
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200 dark:border-slate-700"
                >
                    <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Notifications Panel */}
            {showNotifications && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotifications(false)}>
                    <div
                        className="absolute top-4 right-4 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                                        disabled={unreadCount === 0}
                                        title="Mark all as read"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        title="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {filterOptions.map((filterType) => (
                                    <button
                                        key={filterType}
                                        onClick={() => handleFilterChange(filterType)}
                                        className={`px-3 py-1 text-sm rounded-lg font-medium transition-all duration-200 capitalize whitespace-nowrap ${filter === filterType
                                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                            }`}
                                        type="button"
                                    >
                                        {filterType}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filteredNotifications.length === 0 ? (
                                <div className="text-center py-8">
                                    <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                                        No notifications found
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        Try adjusting your search or filter criteria
                                    </p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => {
                                    const IconComponent = notification.icon;
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`group relative bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 ${!notification.read ? 'ring-1 ring-blue-100 dark:ring-blue-900 bg-blue-50/30 dark:bg-blue-900/10' : ''
                                                }`}
                                        >
                                            {/* Unread indicator */}
                                            {!notification.read && (
                                                <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                            )}

                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${notification.color} bg-current/10`}>
                                                    <IconComponent className={`w-5 h-5 ${notification.color}`} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                                            {notification.title}
                                                        </h3>
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <Clock className="w-3 h-3 text-slate-400" />
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                                {notification.time}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-2">
                                                        {notification.message}
                                                    </p>

                                                    <div className="flex items-center gap-2">
                                                        {!notification.read && (
                                                            <button
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors duration-200 flex items-center gap-1"
                                                                type="button"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                                Mark as read
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => deleteNotification(notification.id)}
                                                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors duration-200 flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                                            type="button"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Load More Button */}
                        {filteredNotifications.length > 0 && (
                            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
                                <button
                                    onClick={loadMoreNotifications}
                                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 font-medium disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Loading...' : 'Load More Notifications'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPage;