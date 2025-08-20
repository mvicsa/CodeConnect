export enum NotificationType {
  POST_CREATED = 'POST_CREATED',
  POST_REACTION = 'POST_REACTION',
  COMMENT_ADDED = 'COMMENT_ADDED',
  FOLLOWED_USER = 'FOLLOWED_USER',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  LOGIN = 'LOGIN',
  USER_MENTIONED = 'USER_MENTIONED',
  RATING_RECEIVED = 'RATING_RECEIVED',
  RATING_REQUESTED = 'RATING_REQUESTED',
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
    extra?: Record<string, unknown>;
    [key: string]: unknown;
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
    extra?: Record<string, unknown>;
    [key: string]: unknown;
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

// Notification Delete Payload Types
export interface BaseNotificationDeletePayload {
  notificationId?: string;
  forceRefresh?: boolean;
  type?: string;
}

export interface PostDeletePayload extends BaseNotificationDeletePayload {
  type: 'POST';
  postId: string;
  affectedTypes?: string;
}

export interface ReactionDeletePayload extends BaseNotificationDeletePayload {
  type: 'POST_REACTION' | 'COMMENT_REACTION';
  postId?: string;
  commentId?: string;
  fromUserId?: string;
  reactionType?: string;
  deleteAllReactions?: boolean;
}

export interface CommentDeletePayload extends BaseNotificationDeletePayload {
  type: 'COMMENT_ADDED';
  commentId?: string;
  postId?: string;
  deleteAllComments?: boolean;
  hasMentions?: boolean;
  mentions?: string[];
  forceBroadcast?: boolean;
}

export interface MentionDeletePayload extends BaseNotificationDeletePayload {
  type: 'USER_MENTIONED';
  postId?: string;
  commentId?: string;
  replyId?: string;
  mentionedUserId?: string;
  fromUserId?: string;
  deleteAllMentions?: boolean;
}

export interface FollowDeletePayload extends BaseNotificationDeletePayload {
  type: 'FOLLOWED_USER';
  fromUserId?: string;
  followId?: string;
}

export type NotificationDeletePayload = 
  | PostDeletePayload 
  | ReactionDeletePayload 
  | CommentDeletePayload 
  | MentionDeletePayload 
  | FollowDeletePayload 
  | BaseNotificationDeletePayload;

// Helper type guard functions for type narrowing
export const isPostDeletePayload = (payload: NotificationDeletePayload): payload is PostDeletePayload => {
  return payload.type === 'POST';
};

export const isReactionDeletePayload = (payload: NotificationDeletePayload): payload is ReactionDeletePayload => {
  return payload.type === 'POST_REACTION' || payload.type === 'COMMENT_REACTION';
};

export const isCommentDeletePayload = (payload: NotificationDeletePayload): payload is CommentDeletePayload => {
  return payload.type === 'COMMENT_ADDED';
};

export const isMentionDeletePayload = (payload: NotificationDeletePayload): payload is MentionDeletePayload => {
  return payload.type === 'USER_MENTIONED';
};

export const isFollowDeletePayload = (payload: NotificationDeletePayload): payload is FollowDeletePayload => {
  return payload.type === 'FOLLOWED_USER';
};