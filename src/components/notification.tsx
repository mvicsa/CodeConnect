'use client';

import React, { useState } from 'react';
import { Bell, Search, Clock, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
    initialNotifications, loadMoreNotificationsAPI, markNotificationAsReadAPI, markAllNotificationsAsReadAPI,
    deleteNotificationAPI,
    getBadgeVariant,
    getNotificationBackground,
    filterOptions
} from '@/services/staticAPI';

type NotificationType = 'success' | 'info' | 'warning' | 'error';
type FilterType = 'all' | 'unread' | 'read' | NotificationType;

const NotificationPage = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loadCount, setLoadCount] = useState<number>(0);

    const markAsRead = async (id: number): Promise<void> => {
        try {
            await markNotificationAsReadAPI(id);
            setNotifications(notifications.map(notif =>
                notif.id === id ? { ...notif, read: true } : notif
            ));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async (): Promise<void> => {
        try {
            await markAllNotificationsAsReadAPI();
            setNotifications(notifications.map(notif => ({ ...notif, read: true })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const deleteNotification = async (id: number): Promise<void> => {
        try {
            await deleteNotificationAPI(id);
            setNotifications(notifications.filter(notif => notif.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const loadMoreNotifications = async (): Promise<void> => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const newLoadCount = loadCount + 1;
            const result = await loadMoreNotificationsAPI(notifications, newLoadCount);

            setNotifications(prev => [...prev, ...result.notifications]);
            setHasMore(result.hasMore);
            setLoadCount(newLoadCount);
        } catch (error) {
            console.error('Failed to load more notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredNotifications = notifications.filter(notif => {
        const matchesFilter = filter === 'all' ||
            (filter === 'unread' && !notif.read) ||
            (filter === 'read' && notif.read) ||
            notif.type === filter;

        const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.message.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const unreadCount = notifications.filter(notif => !notif.read).length;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (filterType: FilterType): void => {
        setFilter(filterType);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="fixed top-4 right-4 z-50">
                <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="relative shadow-lg hover:bg-accent/80 transition-colors"
                            aria-label="Notifications"
                        >
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-4 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Bell className="h-6 w-6" />
                                        {unreadCount > 0 && (
                                            <Badge
                                                variant="destructive"
                                                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs animate-pulse"
                                            >
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl">Notifications</DialogTitle>
                                        <CardDescription>
                                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={markAllAsRead}
                                        disabled={unreadCount === 0}
                                        className="h-8 w-8"
                                        aria-label="Mark all as read"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="px-6 pb-4 space-y-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search notifications..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="pl-10"
                                    aria-label="Search notifications"
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {filterOptions.map((filterType) => (
                                    <Button
                                        key={filterType}
                                        variant={filter === filterType ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange(filterType)}
                                        className="capitalize whitespace-nowrap"
                                    >
                                        {filterType === 'all' ? 'All' : filterType}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <ScrollArea className="flex-1 px-6 overflow-y-auto">
                            <div className="space-y-4 pb-4">
                                {filteredNotifications.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium mb-2">
                                            No notifications found
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            {searchTerm.trim() ?
                                                'No notifications match your search' :
                                                'You have no notifications in this category'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredNotifications.map((notification) => {
                                        const IconComponent = notification.icon;
                                        return (
                                            <Card
                                                key={notification.id}
                                                className={`group transition-all duration-200 hover:shadow-md ${getNotificationBackground(notification)}`}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg ${notification.color} bg-current/10 flex-shrink-0`}>
                                                            <IconComponent className={`h-5 w-5 ${notification.color}`} />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-semibold text-sm truncate">
                                                                        {notification.title}
                                                                    </h3>
                                                                    {!notification.read && (
                                                                        <span className="sr-only">Unread</span>
                                                                    )}
                                                                    {!notification.read && (
                                                                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>{notification.time}</span>
                                                                </div>
                                                            </div>

                                                            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                                                                {notification.message}
                                                            </p>

                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={getBadgeVariant(notification.type)} className="text-xs">
                                                                    {notification.type}
                                                                </Badge>

                                                                <div className="flex-1" />

                                                                {!notification.read && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => markAsRead(notification.id)}
                                                                        className="h-7 text-xs"
                                                                        aria-label={`Mark as read: ${notification.title}`}
                                                                    >
                                                                        <Check className="h-3 w-3 mr-1" />
                                                                        Mark as read
                                                                    </Button>
                                                                )}

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deleteNotification(notification.id)}
                                                                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                                                    aria-label={`Delete notification: ${notification.title}`}
                                                                >
                                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>

                        {filteredNotifications.length > 0 && hasMore && (
                            <div className="p-6 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={loadMoreNotifications}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Loading...
                                        </div>
                                    ) : (
                                        'Load More Notifications'
                                    )}
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default NotificationPage;