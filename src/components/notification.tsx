'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Clock, Trash2, Check, ExternalLink, MessageSquare, Heart, UserPlus, ThumbsUp, FileText, Reply, Volume2, VolumeX, Smartphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationsSimple } from '@/hooks/useNotifications';
import { formatNotificationTime } from '@/services/notificaionAPI';
import { NotificationFilter, Notification, NotificationType, NotificationUser, NotificationPost, NotificationComment } from '@/types/notification';
import { socketService } from '@/services/socketService';

// Helper function to get icon based on notification type
const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case NotificationType.POST_CREATED:
            return FileText;
        case NotificationType.POST_REACTION:
            return Heart;
        case NotificationType.COMMENT_ADDED:
            return MessageSquare;
        case NotificationType.REPLY_ADDED:
            return Reply;
        case NotificationType.FOLLOWED_USER:
            return UserPlus;
        case NotificationType.MESSAGE_RECEIVED:
            return MessageSquare;
        case NotificationType.MENTION:
            return ThumbsUp;
        case NotificationType.LOGIN:
            return Bell;
        default:
            return Bell;
    }
};

// Helper function to get notification link
const getNotificationLink = (notification: Notification): string | undefined => {
    console.log('🔗 Getting notification link for:', {
        type: notification.type,
        dataId: notification.data._id,
        fromUserId: notification.fromUserId
    });

    // استخدام البيانات الجديدة
    if (notification.data._id) {
        const link = `/posts/${notification.data._id}`;
        console.log('🔗 Generated link with data._id:', link);
        return link;
    }
    
    if (notification.fromUserId) {
        const link = `/profile/${notification.fromUserId.username}`;
        console.log('🔗 Generated link for profile:', link);
        return link;
    }
    
    console.log('🔗 No link generated');
    return undefined;
};

// Helper function to get notification title
const getNotificationTitle = (notification: Notification): string => {
    switch (notification.type) {
        case NotificationType.POST_CREATED:
            return 'New Post';
        case NotificationType.POST_REACTION:
            return 'New Reaction';
        case NotificationType.COMMENT_ADDED:
            return 'New Comment';
        case NotificationType.REPLY_ADDED:
            return 'New Reply';
        case NotificationType.FOLLOWED_USER:
            return 'New Follower';
        case NotificationType.MESSAGE_RECEIVED:
            return 'New Message';
        case NotificationType.MENTION:
            return 'You were mentioned';
        case NotificationType.LOGIN:
            return 'Login Alert';
        default:
            return 'Notification';
    }
};

// Helper function to get user display name
const getUserDisplayName = (user: NotificationUser): string => {
    return `${user.firstName} ${user.lastName}`;
};

// Helper function to get notification content with user info
const getNotificationContent = (notification: Notification): string => {
    if (notification.fromUserId) {
        const fromUser = notification.fromUserId;
        const fullName = getUserDisplayName(fromUser);
        
        switch (notification.type) {
            case NotificationType.POST_REACTION:
                if (notification.data.post) {
                    const postContent = notification.data.post.text || notification.data.post.code || 'منشورك';
                    return `${fullName} reacted to your post: "${postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent}"`;
                }
                return `${fullName} reacted to your post`;
                
            case NotificationType.COMMENT_ADDED:
                if (notification.data.comment) {
                    const commentContent = notification.data.comment.text || notification.data.comment.code || 'تعليق';
                    return `${fullName} commented: "${commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent}"`;
                }
                return `${fullName} commented on your post`;
                
            case NotificationType.REPLY_ADDED:
                if (notification.data.comment) {
                    const replyContent = notification.data.comment.text || notification.data.comment.code || 'رد';
                    return `${fullName} replied: "${replyContent.length > 50 ? replyContent.substring(0, 50) + '...' : replyContent}"`;
                }
                return `${fullName} replied to your comment`;
                
            case NotificationType.FOLLOWED_USER:
                return `${fullName} started following you`;
                
            case NotificationType.MESSAGE_RECEIVED:
                return `${fullName} sent you a message`;
                
            case NotificationType.MENTION:
                return `${fullName} mentioned you`;
                
            default:
                return notification.content;
        }
    }
    
    return notification.content;
};

// Helper function to render post preview
const renderPostPreview = (post: NotificationPost) => {
    const postContent = post.text || post.code || 'منشور بدون نص';
    const truncatedContent = postContent.length > 100 
        ? `${postContent.substring(0, 100)}...` 
        : postContent;
    
    return (
        <div className="mt-2 p-3 bg-muted/30 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start gap-2">
                <img
                    src={post.createdBy.avatar || '/user.png'}
                    alt={getUserDisplayName(post.createdBy)}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/user.png';
                    }}
                />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                        {getUserDisplayName(post.createdBy)}
                    </p>
                    <p className="text-sm text-foreground truncate">
                        {truncatedContent}
                    </p>
                    {post.image && (
                        <div className="mt-1">
                            <img 
                                src={post.image} 
                                alt="صورة البوست"
                                className="w-16 h-16 object-cover rounded"
                            />
                        </div>
                    )}
                    {post.code && (
                        <div className="mt-1">
                            <div className="text-xs text-muted-foreground">
                                كود {post.codeLang || 'text'}
                            </div>
                            <pre className="text-xs bg-muted p-1 rounded overflow-hidden">
                                {post.code.length > 50 
                                    ? `${post.code.substring(0, 50)}...` 
                                    : post.code
                                }
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper function to render comment preview
const renderCommentPreview = (comment: NotificationComment) => {
    const commentContent = comment.text || comment.code || 'تعليق بدون نص';
    const truncatedContent = commentContent.length > 100 
        ? `${commentContent.substring(0, 100)}...` 
        : commentContent;
    
    return (
        <div className="mt-2 p-3 bg-muted/30 rounded-lg border-l-4 border-green-500">
            <div className="flex items-start gap-2">
                <img
                    src={comment.createdBy.avatar || '/user.png'}
                    alt={getUserDisplayName(comment.createdBy)}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/user.png';
                    }}
                />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                        {getUserDisplayName(comment.createdBy)}
                    </p>
                    <p className="text-sm text-foreground truncate">
                        {truncatedContent}
                    </p>
                    {comment.code && (
                        <div className="mt-1">
                            <div className="text-xs text-muted-foreground">
                                كود {comment.codeLang || 'text'}
                            </div>
                            <pre className="text-xs bg-muted p-1 rounded overflow-hidden">
                                {comment.code.length > 50 
                                    ? `${comment.code.substring(0, 50)}...` 
                                    : comment.code
                                }
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const NotificationPage = () => {
    const router = useRouter();
    console.log('🔧 Router initialized:', !!router);
    console.log('🔧 NotificationType enum:', NotificationType);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<NotificationFilter>('all');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

    const {
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        refreshNotifications,
        isConnected,
        socketId
    } = useNotificationsSimple();

    // تحميل الإعدادات المحفوظة
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setSoundEnabled(socketService.isSoundEnabled());
            setVibrationEnabled(socketService.isVibrationEnabled());
        }
    }, []);

    // تحديث الإشعارات المحلية عند تغيير الإشعارات من Hook
    useEffect(() => {
        setLocalNotifications(notifications);
    }, [notifications]);

    // Debug: طباعة حالة الاتصال
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    console.log('🔌 Socket Status:', { 
        isConnected, 
        socketId, 
        userId,
        hasToken: !!token,
        tokenLength: token?.length
    });

    const handleNotificationClick = async (notification: Notification) => {
        console.log('🔧 Router available:', !!router, 'Router.push available:', !!router?.push);
        console.log('🔍 Notification clicked:', {
            type: notification.type,
            data: notification.data,
            dataId: notification.data._id,
            fromUserId: notification.fromUserId
        });
        console.log('🔍 NotificationType.POST_REACTION value:', NotificationType.POST_REACTION);
        console.log('🔍 Type comparison:', notification.type === NotificationType.POST_REACTION);

        // Mark as read when clicked
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        // Close notifications dialog
        setShowNotifications(false);

        // Navigate based on notification type and data
        console.log('🔍 Notification type:', notification.type);
        console.log('🔍 About to enter switch statement...');
        switch (notification.type) {
            case NotificationType.POST_CREATED:
                console.log('🎯 POST_CREATED case triggered');
            case NotificationType.POST_REACTION:
                console.log('🎯 POST_REACTION case triggered');
                // التنقل للمنشور
                if (notification.data._id) {
                    const url = `/posts/${notification.data._id}`;
                    console.log('📍 Navigating to post with data._id:', url);
                    console.log('🔧 About to call router.push...');
                    router.push(url);
                    console.log('✅ Router.push called successfully');
                } else {
                    console.warn('⚠️ No post ID found for POST_REACTION');
                    console.log('🔍 Available data:', {
                        data: notification.data
                    });
                }
                break;
                
            case NotificationType.COMMENT_ADDED:
                console.log('🎯 COMMENT_ADDED case triggered');
            case NotificationType.REPLY_ADDED:
                console.log('🎯 REPLY_ADDED case triggered');
                // التنقل للمنشور مع التركيز على التعليق
                if (notification.data._id) {
                    const url = `/posts/${notification.data._id}`;
                    console.log('📍 Navigating to comment with data._id:', url);
                    try {
                        router.push(url);
                    } catch (error) {
                        window.location.href = url;
                    }
                }
                break;
                
            case NotificationType.MESSAGE_RECEIVED:
                console.log('🎯 MESSAGE_RECEIVED case triggered');
                if (notification.data._id) {
                    const url = `/chat/${notification.data._id}`;
                    try {
                        router.push(url);
                    } catch (error) {
                        window.location.href = url;
                    }
                }
                break;
                
            case NotificationType.FOLLOWED_USER:
                console.log('🎯 FOLLOWED_USER case triggered');
                if (notification.fromUserId) {
                    const url = `/profile/${notification.fromUserId.username}`;
                    try {
                        router.push(url);
                    } catch (error) {
                        window.location.href = url;
                    }
                }
                break;
                
            default:
                console.log('🔍 Falling back to default case for type:', notification.type);
                console.log('🔍 This means the switch case did not match POST_REACTION');
                // fallback للتنقل العام
                const link = getNotificationLink(notification);
                if (link) {
                    console.log('📍 Navigating with fallback link:', link);
                    try {
                        router.push(link);
                        console.log('✅ Router.push called successfully');
                    } catch (error) {
                        console.error('❌ Router.push failed:', error);
                        // fallback إلى window.location
                        window.location.href = link;
                    }
                } else {
                    console.warn('⚠️ No navigation link found for notification type:', notification.type);
                }
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            // فحص وجود token
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('❌ No authentication token found. Please log in again.');
                    return;
                }
            }
            
            console.log('🔍 Starting mark as read for:', notificationId);
            await markAsRead(notificationId);
            console.log('✅ Mark as read completed for:', notificationId);
            
            // تحديث الإشعار المحلي فوراً
            setLocalNotifications(prev => {
                const updated = prev.map(notif => 
                    notif._id === notificationId ? { ...notif, isRead: true } : notif
                );
                console.log('📝 Updated local notifications, unread count:', updated.filter(n => !n.isRead).length);
                return updated;
            });
        } catch (error) {
            console.error('❌ Failed to mark notification as read:', error);
        }
    };

    // إزالة الإشعارات المكررة وإضافة key فريد
    const uniqueNotifications = localNotifications.filter((notif: Notification, index: number, self: Notification[]) => 
        index === self.findIndex((n: Notification) => n._id === notif._id)
    );

    const filteredNotifications = uniqueNotifications.filter((notif: Notification) => {
        // Apply search filter
        const matchesSearch = notif.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getNotificationTitle(notif).toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.fromUserId?.username.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply status filter
        const matchesFilter = filter === 'all' ||
            (filter === 'read' && notif.isRead) ||
            (filter === 'unread' && !notif.isRead);

        return matchesSearch && matchesFilter;
    });

    const readCount = localNotifications.filter((notif: Notification) => notif.isRead).length;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    const getFilterCount = (filterType: NotificationFilter): number => {
        switch (filterType) {
            case 'all':
                return localNotifications.length;
            case 'read':
                return readCount;
            case 'unread':
                return localNotifications.filter((n: Notification) => !n.isRead).length;
            default:
                return 0;
        }
    };

    return (
        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative shadow-lg hover:bg-accent/80 transition-colors"
                    aria-label="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {localNotifications.filter(n => !n.isRead).length > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                        >
                            {localNotifications.filter(n => !n.isRead).length > 9 ? '9+' : localNotifications.filter(n => !n.isRead).length}
                        </Badge>
                    )}
                    {!isConnected && (
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" title="Socket disconnected" />
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Bell className="h-6 w-6" />
                                {localNotifications.filter(n => !n.isRead).length > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs animate-pulse"
                                    >
                                        {localNotifications.filter(n => !n.isRead).length > 9 ? '9+' : localNotifications.filter(n => !n.isRead).length}
                                    </Badge>
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Notifications</DialogTitle>
                                <CardDescription>
                                    {localNotifications.filter(n => !n.isRead).length} unread notification{localNotifications.filter(n => !n.isRead).length !== 1 ? 's' : ''}
                                    {!isConnected && (
                                        <span className="ml-2 text-yellow-600">• Offline</span>
                                    )}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={refreshNotifications}
                                disabled={isLoading}
                                className="h-8 w-8"
                                aria-label="Refresh notifications"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                    await markAllAsRead();
                                    // تحديث جميع الإشعارات المحلية
                                    setLocalNotifications(prev => 
                                        prev.map(notif => ({ ...notif, isRead: true }))
                                    );
                                }}
                                disabled={localNotifications.filter(n => !n.isRead).length === 0}
                                className="h-8 w-8"
                                aria-label="Mark all as read"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            {localNotifications.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                        if (window.confirm('Are you sure you want to delete all notifications?')) {
                                            await deleteAllNotifications();
                                            setLocalNotifications([]);
                                        }
                                    }}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    aria-label="Delete all notifications"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 pb-4 space-y-4 border-b">
                    {/* Filter Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                            className="flex items-center gap-2"
                        >
                            All
                            <Badge variant="secondary" className="text-xs">
                                {getFilterCount('all')}
                            </Badge>
                        </Button>
                        <Button
                            variant={filter === 'unread' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('unread')}
                            className="flex items-center gap-2"
                        >
                            Unread
                            <Badge variant="secondary" className="text-xs">
                                {getFilterCount('unread')}
                            </Badge>
                        </Button>
                        <Button
                            variant={filter === 'read' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('read')}
                            className="flex items-center gap-2"
                        >
                            Read
                            <Badge variant="secondary" className="text-xs">
                                {getFilterCount('read')}
                            </Badge>
                        </Button>
                    </div>

                    {/* Search Input */}
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
                                        filter === 'all' ? 'You have no notifications' :
                                            `You have no ${filter} notifications`}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification: Notification, index: number) => {
                                const IconComponent = getNotificationIcon(notification.type);
                                const link = getNotificationLink(notification);
                                const title = getNotificationTitle(notification);
                                
                                return (
                                    <Card
                                        key={`${notification._id}-${index}-${notification.createdAt}`}
                                        className={`group transition-all duration-200 hover:shadow-md cursor-pointer ${!notification.isRead ? 'bg-muted/50 border-muted' : ''
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0">
                                                    {notification.fromUserId ? (
                                                        <div className="relative">
                                                            <img
                                                                src={notification.fromUserId.avatar || '/user.png'}
                                                                alt={getUserDisplayName(notification.fromUserId)}
                                                                className="w-10 h-10 rounded-full object-cover border-2 border-muted"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = '/user.png';
                                                                }}
                                                            />
                                                            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-muted">
                                                                <IconComponent className="h-3 w-3" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-2 rounded-lg bg-muted">
                                                            <IconComponent className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-sm truncate">
                                                                {notification.fromUserId ? getUserDisplayName(notification.fromUserId) : title}
                                                            </h3>
                                                            {notification.fromUserId && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    @{notification.fromUserId.username}
                                                                </span>
                                                            )}
                                                            {link && (
                                                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                            )}
                                                            {!notification.isRead && (
                                                                <span className="sr-only">Unread</span>
                                                            )}
                                                            {!notification.isRead && (
                                                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatNotificationTime(notification.createdAt)}</span>
                                                        </div>
                                                    </div>

                                                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                                                        {getNotificationContent(notification)}
                                                    </p>

                                                    {/* معاينة البوست */}
                                                    {notification.data.post && renderPostPreview(notification.data.post)}
                                                    
                                                    {/* معاينة التعليق */}
                                                    {notification.data.comment && renderCommentPreview(notification.data.comment)}

                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1" />

                                                        {!notification.isRead && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkAsRead(notification._id);
                                                                }}
                                                                className="h-7 text-xs"
                                                                aria-label={`Mark as read: ${title}`}
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Mark as read
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification._id);
                                                            }}
                                                            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                                            aria-label={`Delete notification: ${title}`}
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

                {/* إعدادات الإشعارات */}
                <div className="p-6 pt-4 border-t bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* إعداد الصوت */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        const current = socketService.isSoundEnabled();
                                        socketService.setSoundEnabled(!current);
                                        setSoundEnabled(!current);
                                    }
                                }}
                                className="flex items-center gap-2"
                            >
                                {soundEnabled ? (
                                    <Volume2 className="h-4 w-4" />
                                ) : (
                                    <VolumeX className="h-4 w-4" />
                                )}
                                <span className="text-xs">Sound</span>
                            </Button>

                            {/* اختبار الصوت */}
                            {soundEnabled && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        try {
                                            const audio = new Audio('/sounds/notification.wav');
                                            audio.volume = 0.5;
                                            audio.play().catch(error => {
                                                console.warn('Failed to play test sound:', error);
                                            });
                                        } catch (error) {
                                            console.warn('Failed to create test audio:', error);
                                        }
                                    }}
                                    className="flex items-center gap-2"
                                    title="Test notification sound"
                                >
                                    <Volume2 className="h-4 w-4" />
                                    <span className="text-xs">Test</span>
                                </Button>
                            )}

                            {/* إعداد الاهتزاز */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        const current = socketService.isVibrationEnabled();
                                        socketService.setVibrationEnabled(!current);
                                        setVibrationEnabled(!current);
                                    }
                                }}
                                className="flex items-center gap-2"
                            >
                                <Smartphone className={`h-4 w-4 ${vibrationEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="text-xs">Vibration</span>
                            </Button>


                        </div>

                        {/* حالة الاتصال */}
                        <div className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-muted-foreground">
                                {isConnected ? 'Connected' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>

                {filteredNotifications.length > 0 && hasMore && (
                    <div className="p-6 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={loadMore}
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
    );
};

export default NotificationPage;