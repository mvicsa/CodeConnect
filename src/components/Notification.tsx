'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, Clock, Trash2, Check, MessageSquare, Heart, UserPlus, FileText, Volume2, VolumeX, Smartphone, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationFilter, Notification, NotificationType, NotificationUser } from '@/types/notification';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

// Type for notification data structure
interface NotificationData {
    postId?: string | { _id: string };
    comment?: { postId: string | { _id: string } };
    commentId?: string | { postId: string | { _id: string } };
    post?: { _id: string };
    extra?: { postId: string };
    reaction?: string;
    [key: string]: unknown;
}

import Image from 'next/image';
import { formatTime } from '@/lib/utils';
import { NavigationMenuItem, navigationMenuTriggerStyle } from './ui/navigation-menu';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';

// Helper function to get icon based on notification type
const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case NotificationType.POST_CREATED:
            return FileText;
        case NotificationType.POST_REACTION:
            return Heart;
        case NotificationType.COMMENT_ADDED:
            return MessageSquare;
        case NotificationType.FOLLOWED_USER:
            return UserPlus;
        case NotificationType.MESSAGE_RECEIVED:
            return MessageSquare;
        case NotificationType.USER_MENTIONED:
            return AtSign;
        case NotificationType.LOGIN:
            return Bell;
        default:
            return Bell;
    }
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
        case NotificationType.FOLLOWED_USER:
            return 'New Follower';
        case NotificationType.MESSAGE_RECEIVED:
            return 'New Message';
        case NotificationType.USER_MENTIONED:
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

// Map reaction types to images (same as ReactionsMenu)
const reactionImageMap = {
  like: '/reactions/like.png',
  love: '/reactions/love.png',
  wow: '/reactions/wow.png',
  happy: '/reactions/happy.png',
  funny: '/reactions/funny.png',
  dislike: '/reactions/dislike.png',
};

const NotificationPage = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<NotificationFilter>('all');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [openDeleteDialogId, setOpenDeleteDialogId] = useState<string | null>(null);

    const {
        notifications,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDeleteNotification,
        handleDeleteAllNotifications
    } = useNotifications();


    
    // Helper function to get notification link using useState
    const getNotificationLink = (notification: Notification): string | undefined => {
        let postId: string | undefined = undefined;

        if (notification.type.toLowerCase().includes('post')) {
            const extractedPostId = notification.data?.postId || notification.data?._id;
            if (typeof extractedPostId === 'string') return `/posts/${extractedPostId}`;
        } else if (notification.type.toLowerCase().includes('comment') || notification.type.toLowerCase().includes('reply')) {
            // Method 1: Direct postId in data
            if (notification.data?.postId) {
                postId = String(notification.data.postId);
            }
            // Method 2: postId in comment object
            else if (notification.data?.comment?.postId) {
                const rawPostId = notification.data.comment.postId;
                if (typeof rawPostId === 'object' && '_id' in rawPostId) {
                    postId = (rawPostId as { _id: string })._id;
                } else if (typeof rawPostId === 'string') {
                    postId = rawPostId;
                }
            }
            // Method 2.1: Check populated commentId structure  
            else if (notification.data?.commentId && typeof notification.data.commentId === 'object') {
                const commentData = notification.data.commentId as NotificationData;
                if (commentData.postId) {
                    if (typeof commentData.postId === 'object' && commentData.postId._id) {
                        postId = commentData.postId._id;
                    } else if (typeof commentData.postId === 'string') {
                        postId = commentData.postId;
                    }
                }
            }
            // Method 3: Look for post object
            else if (notification.data?.post?._id) {
                postId = notification.data.post._id;
            }
            // Method 4: Try to extract from extra data
            else if (notification.data?.extra?.postId) {
                postId = String(notification.data.extra.postId);
            }
            // Method 5: Check if there's a nested structure
            else if (notification.data && typeof notification.data === 'object') {
                const dataKeys = Object.keys(notification.data);
                for (const key of dataKeys) {
                    const value = (notification.data as NotificationData)[key];
                    if (value && typeof value === 'object' && (value as NotificationData).postId) {
                        postId = String((value as NotificationData).postId);
                        break;
                    }
                }
            }

            // Get commentId
            const commentId = notification.data?._id || notification.data?.commentId;

            if (postId && commentId) {
                return `/posts/${postId}/${commentId}`;
            } else if (postId) {
                return `/posts/${postId}`;
            } else {
                return `/profile/${notification.fromUserId?.username}`;
            }
        } else if (notification.type === NotificationType.USER_MENTIONED) {
            if (notification.content?.toLowerCase().includes('post')) {
                return `/posts/${notification.data?._id}`;
            } else if (notification.content?.toLowerCase().includes('comment') || notification.content?.toLowerCase().includes('reply')) {
                return `/posts/${notification.data?.postId}/${notification.data?._id}`;
            } else {
                return `/profile/${notification.fromUserId?.username}`;
            }
        } else {
            return `/profile/${notification.fromUserId?.username}`;
        }
    };
    
    
    // تحميل الإعدادات المحفوظة
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setSoundEnabled(localStorage.getItem('notificationSound') !== 'disabled');
            setVibrationEnabled(localStorage.getItem('notificationVibration') !== 'disabled');
        }
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read when clicked
        if (!notification.isRead) {
            handleMarkAsRead(notification._id);
        }
        setShowNotifications(false);
    };

    // REMOVE: uniqueNotifications filter
    // const uniqueNotifications = notifications.filter((notif: Notification, index: number, self: Notification[]) => 
    //     index === self.findIndex((n: Notification) => n._id === notif._id)
    // );

    const filteredNotifications = notifications.filter((notif: Notification) => {
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

    const readCount = notifications.filter((notif: Notification) => notif.isRead).length;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    const getFilterCount = (filterType: NotificationFilter): number => {
        switch (filterType) {
            case 'all':
                return notifications.length;
            case 'read':
                return readCount;
            case 'unread':
                return notifications.filter((n: Notification) => !n.isRead).length;
            default:
                return 0;
        }
    };

    const router = useRouter();

    return (
        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
            <DialogTrigger asChild>
                {/* show count of unread notifications */ }
                <NavigationMenuItem
                    className={`!h-full ${navigationMenuTriggerStyle()} relative cursor-pointer`}
                    asChild
                    >
                        <div>

                    <div className="flex justify-center items-center h-10">
                        <Bell className="h-6 w-6" />
                        {notifications.filter(n => !n.isRead).length > 0 && (
                            <Badge variant="default" className="absolute top-2.5 end-3.5 h-4 w-4 flex items-center justify-center p-0 text-xs animate-pulse">
                                {notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}
                            </Badge>
                        )}
                    </div>
                        </div>
                </NavigationMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Bell className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Notifications</DialogTitle>
                                <CardDescription>
                                    {notifications.filter(n => !n.isRead).length} unread notification{notifications.filter(n => !n.isRead).length !== 1 ? 's' : ''}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                    await handleMarkAllAsRead();
                                }}
                                disabled={notifications.filter(n => !n.isRead).length === 0}
                                className="h-8 w-8"
                                aria-label="Mark all as read"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            {notifications.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={e => e.stopPropagation()}
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            aria-label="Delete all notifications"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete All Notifications</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete all notifications? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await handleDeleteAllNotifications();
                                                }}
                                            >
                                                Delete All
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
                    <div className="space-y-4">
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
                            filteredNotifications.map((notification: Notification) => {
                                const IconComponent = getNotificationIcon(notification.type);
                                const link = getNotificationLink(notification);
                                const title = getNotificationTitle(notification);

                                // Compute reaction image directly for this notification
                                let reactionImage: React.ReactNode | null = null;
                                if (
                                    (notification.type === NotificationType.POST_REACTION || String(notification.type) === 'COMMENT_REACTION') &&
                                    typeof notification.data.reaction === 'string' &&
                                    notification.data.reaction in reactionImageMap
                                ) {
                                    reactionImage = (
                                        <Image
                                            src={reactionImageMap[notification.data.reaction as keyof typeof reactionImageMap]}
                                            alt={notification.data.reaction}
                                            width={15}
                                            height={15}
                                        />
                                    );
                                }

                                return (
                                    <div
                                        key={notification._id}
                                        className='block'
                                        style={openDeleteDialogId === notification._id ? { pointerEvents: 'none' } : {}}
                                        onClick={() => {
                                            if (link && openDeleteDialogId !== notification._id) router.push(link);
                                            if (openDeleteDialogId !== notification._id) handleNotificationClick(notification);
                                        }}
                                    >
                                        <Card
                                            className={`relative group transition-all duration-200 hover:shadow-md cursor-pointer py-7 ${!notification.isRead ? 'bg-primary/20 border-primary' : 'dark:border-transparent hover:!border-primary'}`}
                                            // onClick={() => handleNotificationClick(notification)} // Remove this, handled above
                                        >
                                            <CardContent className='px-5'>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0">
                                                        {notification.fromUserId ? (
                                                            <div className="relative">
                                                                <UserAvatar 
                                                                    user={notification.fromUserId}
                                                                    size={40}
                                                                    className="w-10 h-10 rounded-full object-cover border-2"
                                                                />
                                                                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-muted flex items-center">
                                                                { reactionImage ? reactionImage : <IconComponent className="h-3 w-3" /> }
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-2 rounded-lg bg-muted">
                                                                <IconComponent className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground absolute top-3 right-3">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {formatTime(notification.createdAt)}
                                                        </span>
                                                        </div>

                                                        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                                                            {notification.fromUserId?.firstName} {notification.fromUserId?.lastName} {notification.content}
                                                        </p>

                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1" />

                                                            {!notification.isRead && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkAsRead(notification._id);
                                                                    }}
                                                                    className="h-7 text-xs cursor-pointer"
                                                                    aria-label={`Mark as read: ${title}`}
                                                                >
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Mark as read
                                                                </Button>
                                                            )}

                                                            <AlertDialog open={openDeleteDialogId === notification._id} onOpenChange={open => setOpenDeleteDialogId(open ? notification._id : null)}>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            setOpenDeleteDialogId(notification._id);
                                                                        }}
                                                                        className="h-7 text-xs cursor-pointer"
                                                                        aria-label={`Delete notification: ${title}`}
                                                                    >
                                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                                        Delete
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete this notification?
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel onClick={e => {
                                                                            e.stopPropagation();
                                                                            setOpenDeleteDialogId(null);
                                                                        }}>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            className='bg-destructive hover:bg-destructive/90'
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                await handleDeleteNotification(notification._id);
                                                                                setOpenDeleteDialogId(null);
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
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
                                        const soundCurrent = localStorage.getItem('notificationSound') !== 'disabled';
                                        if (soundCurrent) {
                                            localStorage.setItem('notificationSound', 'disabled');
                                        } else {
                                            localStorage.removeItem('notificationSound');
                                        }
                                        setSoundEnabled(!soundCurrent);
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
                            {/* {soundEnabled && (
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
                            )} */}

                            {/* إعداد الاهتزاز */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        const vibrationCurrent = localStorage.getItem('notificationVibration') !== 'disabled';
                                        if (vibrationCurrent) {
                                            localStorage.setItem('notificationVibration', 'disabled');
                                        } else {
                                            localStorage.removeItem('notificationVibration');
                                        }
                                        setVibrationEnabled(!vibrationCurrent);
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
                            <div className={`w-2 h-2 rounded-full bg-green-500`} />
                            <span className="text-muted-foreground">
                                Connected
                            </span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NotificationPage;
