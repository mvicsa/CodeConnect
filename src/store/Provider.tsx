'use client'

import { ReactNode, useEffect, createContext, useState, useRef } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from './store'
import { fetchProfile } from './slices/authSlice'
import { RootState, AppDispatch } from './store'
import io from 'socket.io-client'
import {
  setRooms, setMessages, addMessage, setTyping, setSeen, setError,
  setConnected, deleteMessage, removeRoom, setHasMore, setUserStatus
} from './slices/chatSlice'
import { useSelector as useReduxSelector } from 'react-redux'
import { addNotification, updateNotification, deleteNotification, deleteByPostAndUser, clearNotifications, removeCommentNotifications, removeNotificationsByCriteria, removePostNotifications, removeMentionNotifications } from './slices/notificationsSlice';
import { removePost } from './slices/postsSlice';
import { Notification } from '@/types/notification';
import NotificationProvider from '@/components/NotificationProvider';
import axios from 'axios';

let socket: any = null

export const SocketContext = createContext<any>(null)

function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>()
  const { initialized, token, user } = useSelector((state: RootState) => state.auth)
  useEffect(() => {
    // Only fetch profile if we have a token but no user and not initialized
    if (!initialized && token && !user) {
      dispatch(fetchProfile())
    }
  }, [initialized, token, user, dispatch])
  return null
}

export function ReduxProvider({ children }: { children: ReactNode }) {
  const [socketInstance, setSocketInstance] = useState<any>(null);

  return (
    <Provider store={store}>
      <SocketContext.Provider value={socketInstance}>
        <AuthInitializer />
        <ChatSocketManagerWithSocket setSocket={setSocketInstance} />
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </SocketContext.Provider>
    </Provider>
  )
}

function ChatSocketManagerWithSocket({ setSocket }: { setSocket: (socket: any) => void }) {
  const dispatch = useDispatch()
  const token = useReduxSelector((state: RootState) => state.auth.token)
  const user = useReduxSelector((state: RootState) => state.auth.user)
  const activeRoomId = useReduxSelector((state: RootState) => state.chat.activeRoomId) || ''
  const notificationSocketRef = useRef<any>(null);

  useEffect(() => {
    if (!token || typeof window === 'undefined') {
      console.log('No token or not in browser environment, skipping socket connection');
      dispatch(setConnected(false));
      setSocket(null);
      return;
    }

    // Initialize chat socket connection
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Initialize notification socket connection (root)
    const notificationSocket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    notificationSocketRef.current = notificationSocket;

    console.log('🔗 Notification socket connecting to:', process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
    console.log('🔑 Auth token present:', !!token);
    console.log('👤 User ID:', user?._id);

    notificationSocket.on('connect', () => {
      console.log('✅ [SOCKET][NOTIFICATIONS] Connected!', notificationSocket.id);
      const userId = user?._id;
      if (userId) {
        notificationSocket.emit('join', userId);
        console.log('📩 [SOCKET][NOTIFICATIONS] Joined room for user:', userId);
      } else {
        console.log('⚠️ [SOCKET][NOTIFICATIONS] No user ID available, cannot join room');
      }
    });
    
    notificationSocket.on('connect_error', (error: any) => {
      console.error('❌ [SOCKET][NOTIFICATIONS] Connection error:', error);
    });
    
    notificationSocket.on('reconnect', () => {
      console.log('🔄 [SOCKET][NOTIFICATIONS] Reconnected!');
      const userId = user?._id;
      if (userId) {
        notificationSocket.emit('join', userId);
        console.log('📩 [SOCKET][NOTIFICATIONS] Re-joined room for user:', userId);
      }
    });
    
    notificationSocket.on('disconnect', (reason: any) => {
      console.log('❌ [SOCKET][NOTIFICATIONS] Disconnected! Reason:', reason);
    });
    
    notificationSocket.on('notification', (notification: Notification) => {
      console.log('📨 [SOCKET][NOTIFICATIONS] New notification received:', {
        id: notification._id,
        type: notification.type,
        content: notification.content,
        fromUser: notification.fromUserId?.username,
        isRead: notification.isRead
      });
      dispatch(addNotification(notification));
      
      // Play notification sound if enabled
      if (typeof window !== 'undefined' && localStorage.getItem('notificationSound') !== 'disabled') {
        try {
          const audio = new Audio('/sounds/notification.wav');
          audio.volume = 0.5;
          audio.play().catch(error => {
            console.warn('Failed to play notification sound:', error);
          });
        } catch (error) {
          console.warn('Failed to create notification audio:', error);
        }
      }
      
      // Vibrate if enabled and supported
      if (typeof window !== 'undefined' && 
          localStorage.getItem('notificationVibration') !== 'disabled' && 
          'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch (error) {
          console.warn('Failed to vibrate:', error);
        }
      }
    });
    notificationSocket.on('notification:update', (notification: Notification) => {
      dispatch(updateNotification(notification));
    });

    // استقبال موحد لحذف الإشعارات من الباك إند
    notificationSocket.on('notification:delete', (payload: any) => {
      console.log('🗑️ [SOCKET] Received notification:delete:', payload);
      
      // حذف مباشر بالـ id
      if (payload?.notificationId) {
        console.log('🗑️ [SOCKET] Deleting notification by ID:', payload.notificationId);
        dispatch(deleteNotification(payload.notificationId));
        return;
      }
      
      // 🔥 حذف كل إشعارات البوست (البوست، التعليقات، الردود، reactions، المنشن)
      if (payload?.type === 'POST' && payload?.postId) {
        console.log('🗑️ [SOCKET] Deleting ALL post-related notifications:', {
          postId: payload.postId,
          affectedTypes: payload.affectedTypes || 'all',
          willDeletePost: true,
          willDeleteComments: true,
          willDeleteReplies: true,
          willDeleteMentions: true,
          willDeleteReactions: true
        });
        
        // 🔥 حذف البوست من UI
        dispatch(removePost(payload.postId));
        
        // حذف كل أنواع الإشعارات المرتبطة بالمنشور
        dispatch(removeNotificationsByCriteria({
          type: 'POST',
          postId: payload.postId,
        }));
        
        dispatch(removeNotificationsByCriteria({
          type: 'POST_REACTION',
          postId: payload.postId,
        }));
        
        dispatch(removeNotificationsByCriteria({
          type: 'COMMENT_ADDED',
          postId: payload.postId,
        }));
        
        dispatch(removeNotificationsByCriteria({
          type: 'COMMENT_REACTION',
          postId: payload.postId,
        }));
        
        dispatch(removeNotificationsByCriteria({
          type: 'USER_MENTIONED',
          postId: payload.postId,
        }));
        
        // إعادة تحميل الإشعارات للتأكد من التحديث
        if (payload.forceRefresh && user?._id) {
          setTimeout(() => {
            console.log('🔄 [SOCKET] Force refreshing notifications after post deletion');
            const token = localStorage.getItem('token');
            if (token) {
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              .then(response => {
                dispatch(require('./slices/notificationsSlice').setNotifications(response.data));
                console.log('✅ [SOCKET] Notifications refreshed successfully after post deletion');
              })
              .catch(error => {
                console.error('❌ [SOCKET] Failed to refresh notifications after post deletion:', error);
              });
            }
          }, 1000);
        }
        
        return;
      }
      
      // حذف تفاعل (reaction) بناءً على postId/commentId/replyId/fromUserId
      if (
        (payload?.type === 'POST_REACTION' || payload?.type === 'COMMENT_REACTION') &&
        (payload?.postId || payload?.commentId)
      ) {
        console.log('🗑️ [SOCKET] Deleting reaction notifications with NEW method:', payload);
        
        // إذا كانت العلامة deleteAllReactions موجودة، احذف كل التفاعلات
        if (payload.deleteAllReactions) {
          console.log('🗑️ [SOCKET] Deleting ALL reactions for:', {
            type: payload.type,
            postId: payload.postId,
            commentId: payload.commentId
          });
          
          dispatch(removeNotificationsByCriteria({
            type: payload.type,
            postId: payload.postId,
            commentId: payload.commentId
            // لا نحدد fromUserId أو reactionType لحذف كل التفاعلات
          }));
        } else {
          // حذف تفاعل محدد
          dispatch(removeNotificationsByCriteria({
            type: payload.type,
            postId: payload.postId,
            commentId: payload.commentId,
            fromUserId: payload.fromUserId,
            reactionType: payload.reactionType
          }));
        }
        
        // إعادة تحميل الإشعارات بعد فترة قصيرة للتأكد من التحديث
        if (payload.forceRefresh) {
          setTimeout(() => {
            // إعادة تحميل الإشعارات من السيرفر
            if (user?._id) {
              console.log('🔄 [SOCKET] Refreshing notifications after reaction deletion');
              const token = localStorage.getItem('token');
              if (token) {
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                .then(response => {
                  dispatch(require('./slices/notificationsSlice').setNotifications(response.data));
                  console.log('✅ [SOCKET] Notifications refreshed successfully after reaction deletion');
                })
                .catch(error => {
                  console.error('❌ [SOCKET] Failed to refresh notifications after reaction deletion:', error);
                });
              }
            }
          }, 500);
        }
        
        return;
      }
      
      // حذف إشعار كومنت وجميع الردود المرتبطة به - الطريقة الجديدة! 🔥
      if (payload?.type === 'COMMENT_ADDED' && (payload?.commentId || payload?.deleteAllComments)) {
        console.log('🗑️ [SOCKET] Deleting comment and all related notifications using NEW method:', {
          commentId: payload.commentId,
          type: payload.type,
          willAlsoDeleteReplies: true,
          willAlsoDeleteMentions: true,
          willAlsoDeleteReactions: true,
          hasMentions: payload.hasMentions,
          mentions: payload.mentions,
          forceBroadcast: payload.forceBroadcast,
          deleteAllComments: payload.deleteAllComments
        });
        
        if (payload.deleteAllComments && payload.postId) {
          // حذف جميع إشعارات التعليقات والردود المرتبطة بالمنشور
          console.log('🗑️ [SOCKET] Deleting ALL comment notifications for post:', payload.postId);
          dispatch(removeNotificationsByCriteria({
            type: 'COMMENT_ADDED',
            postId: payload.postId
            // لا نحدد commentId لحذف كل التعليقات
          }));
        } else if (payload.commentId) {
          // حذف تعليق محدد وجميع الردود المرتبطة به
          console.log('🗑️ [SOCKET] Deleting comment and ALL its replies:', payload.commentId);
          
          // حذف إشعار التعليق نفسه
          dispatch(removeNotificationsByCriteria({
            type: 'COMMENT_ADDED',
            commentId: payload.commentId,
          }));
          
          // حذف إشعارات التفاعلات على التعليق
          dispatch(removeNotificationsByCriteria({
            type: 'COMMENT_REACTION',
            commentId: payload.commentId,
          }));
          
          // حذف إشعارات المنشنات في التعليق
          dispatch(removeNotificationsByCriteria({
            type: 'USER_MENTIONED',
            commentId: payload.commentId,
          }));
          
          // أيضاً استدعاء الدالة القديمة للتوافق
          dispatch(removeCommentNotifications({
            commentId: payload.commentId,
            includeReplies: true,     // حذف إشعارات الردود
            includeMentions: true,    // حذف إشعارات المنشن
            includeReactions: true,   // حذف إشعارات الـ reactions
            mentions: payload.mentions || [], // إضافة قائمة المستخدمين المذكورين
            forceBroadcast: payload.forceBroadcast // إضافة علامة البث الإجباري
          }));
        }
        
        // تأكيد حذف الإشعارات وتحديث الحالة المحلية
        console.log('✅ [SOCKET] Notifications deleted successfully for comment:', payload.commentId);
        
        // إضافة تأخير قصير ثم إعادة تحميل الإشعارات (لضمان التحديث)
        setTimeout(() => {
          // إعادة تحميل الإشعارات من السيرفر
          if (user?._id) {
            console.log('🔄 [SOCKET] Refreshing notifications after deletion');
            const token = localStorage.getItem('token');
            if (token) {
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              .then(response => {
                dispatch(require('./slices/notificationsSlice').setNotifications(response.data));
                console.log('✅ [SOCKET] Notifications refreshed successfully');
              })
              .catch(error => {
                console.error('❌ [SOCKET] Failed to refresh notifications:', error);
              });
            }
          }
        }, 500);
        
        return;
      }
      
      // حذف إشعار رد منفرد
      if (payload?.type === 'COMMENT_ADDED' && payload?.commentId) {
        console.log('🗑️ [SOCKET] Deleting individual reply notification with NEW method:', payload);
        dispatch(removeNotificationsByCriteria({
          type: payload.type,
          commentId: payload.commentId,
        }));
        return;
      }
      
      // 🔥 حذف إشعارات المنشن (شامل: بوست/تعليق/رد) - الطريقة المحسنة!
      if (payload?.type === 'USER_MENTIONED') {
        console.log('🗑️ [SOCKET] Deleting mention notifications with ENHANCED method:', {
          postId: payload.postId,
          commentId: payload.commentId,
          replyId: payload.replyId,
          mentionedUserId: payload.mentionedUserId,
          fromUserId: payload.fromUserId,
          deleteAllMentions: payload.deleteAllMentions
        });
        
        if (payload.deleteAllMentions && payload.postId) {
          // حذف جميع إشعارات المنشن المرتبطة بالمنشور
          console.log('🗑️ [SOCKET] Deleting ALL mention notifications for post:', payload.postId);
          dispatch(removeNotificationsByCriteria({
            type: 'USER_MENTIONED',
            postId: payload.postId
            // لا نحدد fromUserId أو toUserId لحذف كل المنشنات
          }));
        } else {
          // حذف منشن محدد
          dispatch(removeMentionNotifications({
            postId: payload.postId,
            commentId: payload.commentId,
            fromUserId: payload.fromUserId,
            toUserId: payload.mentionedUserId,
          }));
        }
        
        // تأكيد حذف الإشعارات وتحديث الحالة المحلية
        console.log('✅ [SOCKET] Mention notifications deleted successfully');
        
        // إضافة تأخير قصير ثم إعادة تحميل الإشعارات (لضمان التحديث)
        setTimeout(() => {
          // إعادة تحميل الإشعارات من السيرفر
          if (user?._id) {
            console.log('🔄 [SOCKET] Refreshing notifications after mention deletion');
            const token = localStorage.getItem('token');
            if (token) {
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              .then(response => {
                dispatch(require('./slices/notificationsSlice').setNotifications(response.data));
                console.log('✅ [SOCKET] Notifications refreshed successfully after mention deletion');
              })
              .catch(error => {
                console.error('❌ [SOCKET] Failed to refresh notifications after mention deletion:', error);
              });
            }
          }
        }, 500);
        
        return;
      }
      
      // حذف إشعارات المتابعة
      if (payload?.type === 'FOLLOWED_USER' && (payload?.fromUserId || payload?.followId)) {
        console.log('🗑️ [SOCKET] Deleting follow notifications with NEW method:', payload);
        dispatch(removeNotificationsByCriteria({
          type: payload.type,
          fromUserId: payload.fromUserId || payload.followId || '',
        }));
        return;
      }
      
      console.log('⚠️ [SOCKET] Unhandled notification:delete payload:', payload);
    });



    // استقبال حذف كل الإشعارات
    notificationSocket.on('notification:delete_all', () => {
      console.log('notification:delete_all received');
      dispatch(clearNotifications());
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket.IO connected!', newSocket.id);
      dispatch(setConnected(true));
    });
  
    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected!');
      dispatch(setConnected(false));
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Socket.IO connection error:', error);
      dispatch(setError('Failed to connect to chat server'));
      dispatch(setConnected(false));
    });

    // Initial data
    newSocket.on('connected', ({ rooms }: { rooms: any[] }) => {
      console.log('[SOCKET] Connected event received with rooms:', rooms);
      dispatch(setRooms(rooms));

      // Join all room channels for real-time updates
      rooms.forEach(room => {
        console.log(`[SOCKET] Joining room channel: ${room._id}`);
        newSocket.emit('chat:join_room', { roomId: room._id }, (error: any) => {
          if (error) {
            console.error(`[SOCKET] Error joining room ${room._id}:`, error);
          } else {
            console.log(`[SOCKET] Successfully joined room ${room._id}`);
          }
        });
      });
    });

    // Listen for join_room event from server (when re-added to a room)
    newSocket.on('chat:join_room', ({ roomId }: { roomId: string }) => {
      console.log('[SOCKET] Received chat:join_room for room:', roomId);
      newSocket.emit('chat:join_room', { roomId }, (error: any) => {
        if (error) {
          console.error(`[SOCKET] Error joining room ${roomId}:`, error);
        } else {
          console.log(`[SOCKET] Successfully joined room ${roomId}`);
        }
      });
    });

    // Message events
    newSocket.on('chat:messages', ({ roomId, messages, hasMore }: { roomId: string; messages: any[]; hasMore: boolean }) => {
      console.log('[SOCKET] Received messages for room:', roomId, 'Count:', messages.length, 'Has more:', hasMore);
      
      // Get existing messages for this room
      const existingMessages = store.getState().chat.messages[roomId] || [];
      console.log('[SOCKET] Existing messages:', existingMessages.length);
      
      // Merge messages, avoiding duplicates
      const mergedMessages = [...existingMessages];
      messages.forEach(msg => {
        if (!mergedMessages.some(m => m._id === msg._id)) {
          mergedMessages.push(msg);
        }
      });
      
      // Sort messages by _id (which is a timestamp-based ObjectId)
      mergedMessages.sort((a, b) => {
        // Convert string _id to timestamp for comparison
        const aTime = parseInt(a._id.substring(0, 8), 16) * 1000;
        const bTime = parseInt(b._id.substring(0, 8), 16) * 1000;
        return aTime - bTime;
      });
      
      console.log('[SOCKET] Merged messages:', mergedMessages.length);
      dispatch(setMessages({ roomId, messages: mergedMessages }));
      dispatch(setHasMore({ roomId, hasMore }));
    });

    newSocket.on('chat:message_error', (error: any) => {
      console.error('Message error from server:', error);
      dispatch(setError(error.message || 'Failed to send message'));
    });

    newSocket.on('chat:message_sent', (msg: any) => {
      console.log('Message sent confirmation from server:', msg);
      // Add the message to the local state
      dispatch(addMessage({ roomId: msg.chatRoom, message: msg }));
    });

    newSocket.on('chat:new_message', (msg: any) => {
      console.log('Received new message:', {
        _id: msg._id,
        chatRoom: msg.chatRoom,
        sender: msg.sender,
        // Log the full message to see its structure
        fullMessage: msg
      });
      dispatch(addMessage({ roomId: msg.chatRoom, message: msg }));
    });

    newSocket.on('chat:typing', ({ roomId, userId, isTyping }: { roomId: string; userId: string; isTyping: boolean }) => {
      if (!roomId) {
        console.warn('Received chat:typing with undefined roomId', { roomId, userId, isTyping });
        return;
      }
      dispatch(setTyping({ roomId, typing: [{ userId, isTyping }] }));
    });

    newSocket.on('chat:seen', ({ roomId, messageIds, userId }: { roomId: string; messageIds: string[]; userId: string }) => {
      dispatch(setSeen({ roomId, seen: messageIds, userId }));
    });

    newSocket.on('chat:delete_message', ({ roomId, messageId, forAll, userId }: { roomId: string; messageId: string; forAll: boolean; userId: string }) => {
      dispatch(deleteMessage({ roomId, messageId, forAll, userId }));
    });

    // Listen for user:status events (online/offline)
    newSocket.on('user:status', ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      dispatch(setUserStatus({ userId, status }));
    });

    // Listen for user:status:all events (all currently online users)
    newSocket.on('user:status:all', ({ online }: { online: string[] }) => {
      online.forEach(userId => {
        dispatch(setUserStatus({ userId, status: 'online' }));
      });
    });

    // Listen for post reaction updates (realtime)
    newSocket.on('post:reaction_updated', (data: { postId: string; reactions: any; userReactions: any }) => {
      const { postId, reactions, userReactions } = data;
      console.log('[SOCKET] post:reaction_updated', { postId, reactions, userReactions });
      dispatch(require('./slices/reactionsSlice').updatePostReactions({ postId, reactions, userReactions }));
    });

    // Listen for comment reaction updates (realtime)
    newSocket.on('comment:reaction_updated', (data: { commentId: string; reactions: any; userReactions: any }) => {
      const { commentId, reactions, userReactions } = data;
      console.log('[SOCKET] comment:reaction_updated', { commentId, reactions, userReactions });
      dispatch(require('./slices/reactionsSlice').updateCommentReactions({ commentId, reactions, userReactions }));
    });

    // Set the socket instance
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        // Leave all room channels
        newSocket.emit('chat:leave_all_rooms');
        
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.off('connected');
        newSocket.off('chat:messages');
        newSocket.off('chat:new_message');
        newSocket.off('chat:message_sent');
        newSocket.off('chat:message_error');
        newSocket.off('chat:typing');
        newSocket.off('chat:seen');
        newSocket.off('chat:delete_message');
        newSocket.off('user:status'); // Added this line to remove the listener
        newSocket.off('user:status:all'); // Added this line to remove the listener
        newSocket.off('chat:join_room'); // Added this line to remove the listener
        newSocket.off('post:reaction_updated'); // Added this line to remove the listener
        newSocket.off('comment:reaction_updated'); // Added this line to remove the listener
        newSocket.off('notification');
        newSocket.off('notification:update');
        newSocket.off('notification:delete');
        newSocket.off('notification:delete_all');

        newSocket.off('reconnect'); // Added this line to remove the listener
        newSocket.disconnect();
        setSocket(null);
      }
      if (notificationSocketRef.current) {
        notificationSocketRef.current.off('connect');
        notificationSocketRef.current.off('disconnect');
        notificationSocketRef.current.off('notification');
        notificationSocketRef.current.off('notification:update');
        notificationSocketRef.current.off('notification:delete');
        notificationSocketRef.current.off('notification:delete_all');
        notificationSocketRef.current.off('reconnect'); // Added this line to remove the listener
        notificationSocketRef.current.disconnect();
        notificationSocketRef.current = null;
      }
    };
  }, [token, dispatch, setSocket, user]);

  // Separate effect to join notification room when user becomes available
  useEffect(() => {
    if (notificationSocketRef.current && user?._id) {
      const notificationSocket = notificationSocketRef.current;
      if (notificationSocket.connected) {
        console.log('🔄 [SOCKET][NOTIFICATIONS] User loaded, joining room for:', user._id);
        notificationSocket.emit('join', user._id);
      }
    }
  }, [user?._id]);

  return null;
}

export default ReduxProvider;