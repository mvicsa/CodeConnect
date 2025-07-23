import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationType } from '@/types/notification';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      const newId = action.payload._id;
      if (!state.notifications.some(n => n._id === newId)) {
        state.notifications = [action.payload, ...state.notifications];
        if (!action.payload.isRead) state.unreadCount++;
      }
    },
    updateNotification(state, action: PayloadAction<Notification>) {
      const idx = state.notifications.findIndex(n => n._id === action.payload._id);
      if (idx !== -1) {
        state.notifications[idx] = action.payload;
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      }
    },
    deleteNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(n => n._id !== action.payload);
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
    },
    deleteByPostAndUser(state, action: PayloadAction<{ postId?: string, commentId?: string, replyId?: string, type: string, fromUserId: string }>) {
      state.notifications = state.notifications.filter(n => {
        const notifFromUserId = String(n.fromUserId?._id || n.fromUserId);
        const notifPostId = String(n.data?.postId || (n as any).postId || '');
        const notifCommentId = String(n.data?.commentId || n.data?._id || (n as any).commentId || n._id || '');
        const notifReplyId = String(n.data?.replyId || (n as any).replyId || '');
        // حذف إشعار تفاعل أو إشعار كومنت/ريپلاي بناءً على id/type/fromUserId
        const matchReaction =
          notifFromUserId === String(action.payload.fromUserId) &&
          n.type.endsWith('REACTION') &&
          (
            notifPostId === String(action.payload.postId || '') ||
            notifCommentId === String(action.payload.commentId || '') ||
            notifReplyId === String(action.payload.replyId || '')
          );
        const matchComment =
          n.type === action.payload.type &&
          action.payload.commentId &&
          notifCommentId === String(action.payload.commentId);

        const matchMention =
        n.type === NotificationType.USER_MENTIONED &&
          (
            notifCommentId === String(action.payload.commentId) ||
            notifCommentId === String(action.payload.replyId) ||
            (n.data?.parentCommentId && n.data.parentCommentId === action.payload.commentId)
          );

        const matchFollow =
          n.type === NotificationType.FOLLOWED_USER &&
          (
            notifFromUserId === String(action.payload.fromUserId) ||
            notifFromUserId === String((action.payload as any).followId)
          );

        console.log('matchComment', matchComment, action.payload.commentId, notifCommentId);

        if (matchReaction || matchComment || matchMention || matchFollow) {
          console.log('Deleting notification:', {
            notifPostId, notifCommentId, notifReplyId, notifFromUserId, type: n.type,
            payload: action.payload,
            notification: n
          });
        }
        return !(matchReaction || matchComment || matchMention || matchFollow);
      });
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
    },
    markAsRead(state, action: PayloadAction<string>) {
      const idx = state.notifications.findIndex(n => n._id === action.payload);
      if (idx !== -1) {
        state.notifications[idx].isRead = true;
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      }
    },
    markAllAsRead(state) {
      state.notifications.forEach(n => (n.isRead = true));
      state.unreadCount = 0;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  updateNotification,
  deleteNotification,
  deleteByPostAndUser,
  markAsRead,
  markAllAsRead,
  setLoading,
  setError,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer; 