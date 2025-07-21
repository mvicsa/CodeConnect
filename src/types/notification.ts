import { LucideIcon } from 'lucide-react';

export enum NotificationType {
  POST_CREATED = 'POST_CREATED',
  POST_REACTION = 'POST_REACTION',
  COMMENT_ADDED = 'COMMENT_ADDED',
  REPLY_ADDED = 'REPLY_ADDED',
  FOLLOWED_USER = 'FOLLOWED_USER',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  LOGIN = 'LOGIN',
  MENTION = 'MENTION',
}

export interface NotificationUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface NotificationPost {
  _id: string;
  text?: string;
  code?: string;
  codeLang?: string;
  image?: string;
  video?: string;
  tags: string[];
  reactions: {
    like: number;
    love: number;
    wow: number;
    funny: number;
    dislike: number;
    happy: number;
  };
  createdBy: NotificationUser;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationComment {
  _id: string;
  text: string;
  code?: string;
  codeLang?: string;
  createdBy: NotificationUser;
  postId: string;
  parentCommentId?: string;
  reactions: {
    like: number;
    love: number;
    wow: number;
    funny: number;
    dislike: number;
    happy: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  toUserId: NotificationUser;
  fromUserId?: NotificationUser;
  content: string;
  type: NotificationType;
  isRead: boolean;
  data: {
    postId?: string;
    commentId?: string;
    replyId?: string;
    messageId?: string;
    postTitle?: string;
    commentText?: string;
    replyText?: string;
    post?: NotificationPost;
    comment?: NotificationComment;
    extra?: Record<string, any>;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoadMoreResponse {
  notifications: Notification[];
  hasMore: boolean;
  totalCount: number;
}

export type NotificationFilter = 'all' | 'read' | 'unread';

export interface NotificationSocketData {
  _id: string;
  toUserId: string;
  fromUserId?: string;
  fromUser?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  type: NotificationType;
  isRead: boolean;
  data: {
    postId?: string;
    commentId?: string;
    replyId?: string;
    messageId?: string;
    postTitle?: string;
    commentText?: string;
    replyText?: string;
    extra?: Record<string, any>;
    [key: string]: any;
  };
  createdAt: string;
}

// Legacy interface for backward compatibility
export interface LegacyNotification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  type: 'post' | 'comment' | 'reply' | 'follow' | 'like' | 'mention';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  postId?: string;
  commentId?: string;
  replyId?: string;
  metadata?: {
    postTitle?: string;
    commentText?: string;
    replyText?: string;
  };
}