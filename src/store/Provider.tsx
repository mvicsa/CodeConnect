'use client'

import { ReactNode, useEffect, createContext, useState, useRef } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from './store'
import { fetchProfile } from './slices/authSlice'
import { RootState, AppDispatch } from './store'
import io from 'socket.io-client'
import {
  setRooms, setMessages, addMessage, setTyping, setSeen, setError,
  setConnected, deleteMessage, setHasMore, setUserStatus
} from './slices/chatSlice'
import { useSelector as useReduxSelector } from 'react-redux'
import { addNotification, updateNotification, deleteNotification, clearNotifications, removeCommentNotifications, removeNotificationsByCriteria, removeMentionNotifications, setNotifications } from './slices/notificationsSlice';
import { removePost } from './slices/postsSlice';
import { Notification, NotificationDeletePayload, isPostDeletePayload, isReactionDeletePayload, isCommentDeletePayload, isMentionDeletePayload, isFollowDeletePayload } from '@/types/notification';
import NotificationProvider from '@/components/NotificationProvider';
import axios from 'axios';
import { Reactions } from '@/types/comments'
// import { SocketType } from '@/types/socket' // No longer needed
import { ChatRoom, Message } from '@/types/chat'
import { updateCommentReactions, updatePostReactions, UserReaction } from './slices/reactionsSlice'

export const SocketContext = createContext<ReturnType<typeof io> | null>(null)

function hasId(obj: unknown): obj is { _id: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_id' in obj &&
    typeof (obj as { _id: unknown })._id === 'string'
  );
}

function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>()
  const { initialized, token, user } = useSelector((state: RootState) => state.auth)
  const blockStatuses = useSelector((state: RootState) => state.block.blockStatuses)
  const notifications = useSelector((state: RootState) => state.notifications.notifications)
  
  useEffect(() => {
    // Only fetch profile if we have a token but no user and not initialized
    if (!initialized && token && !user) {
      dispatch(fetchProfile())
    }
  }, [initialized, token, user, dispatch])
  
  // فلترة الإشعارات للمستخدمين المحظورين
  useEffect(() => {
    if (!user) return;
    
    // فلترة الإشعارات
    const filteredNotifications = notifications.filter(notification => {
      const fromUserId = notification.fromUserId?._id || notification.fromUserId;
      const toUserId = notification.toUserId?._id || notification.toUserId;
      
      // تحقق من حالة الحظر
      const fromUserBlockStatus = blockStatuses[String(fromUserId)] || {};
      const toUserBlockStatus = blockStatuses[String(toUserId)] || {};

      // لا تعرض إشعار إذا:
      // 1. أنت حظرت المرسل
      // 2. أو المرسل حظرك
      // 3. أو أنت حظرت المستلم
      // 4. أو المستلم حظرك
      if (
        fromUserBlockStatus.isBlocked ||  // أنت حظرت المرسل
        fromUserBlockStatus.isBlockedBy || // المرسل حظرك
        toUserBlockStatus.isBlocked ||     // أنت حظرت المستلم
        toUserBlockStatus.isBlockedBy      // المستلم حظرك
      ) {
        return false;
      }
      return true;
    });

    // إذا تم حذف إشعارات، حدث القائمة
    if (filteredNotifications.length !== notifications.length) {
      dispatch(setNotifications(filteredNotifications));
    }
  }, [blockStatuses, notifications, user, dispatch]);
  
  // 🔥 middleware لحذف إشعارات المستخدم المحظور عند عمل بلوك
  useEffect(() => {
    if (user && blockStatuses) {
      // تحقق من المستخدمين المحظورين حديثاً
      Object.entries(blockStatuses).forEach(([userId, status]) => {
        if (status.isBlocked && user._id) {
          // حذف جميع إشعارات المستخدم المحظور
          dispatch(removeNotificationsByCriteria({
            fromUserId: userId
          }));
        }
      });
    }
  }, [blockStatuses, user, dispatch])
  
  return null
}

export function ReduxProvider({ children }: { children: ReactNode }) {
  const [socketInstance, setSocketInstance] = useState<ReturnType<typeof io> | null>(null);

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

function ChatSocketManagerWithSocket({ setSocket }: { setSocket: (socket: ReturnType<typeof io> | null) => void }) {
  const dispatch = useDispatch()
  const token = useReduxSelector((state: RootState) => state.auth.token)
  const user = useReduxSelector((state: RootState) => state.auth.user)
  const notificationSocketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    if (!token || typeof window === 'undefined') {
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
    }) as ReturnType<typeof io>;

    // Initialize notification socket connection (root)
    const notificationSocket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    }) as ReturnType<typeof io>;
    notificationSocketRef.current = notificationSocket;

    notificationSocket.on('connect', () => {
      const userId = user?._id;
      if (userId) {
        notificationSocket.emit('join', userId);
        console.log('📩 [SOCKET][NOTIFICATIONS] Joined room for user:', userId);
      } else {
        console.log('⚠️ [SOCKET][NOTIFICATIONS] No user ID available, cannot join room');
      }
    });
    
    notificationSocket.on('connect_error', (error: Error) => {
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
    
    notificationSocket.on('disconnect', (reason: string) => {
      console.log('❌ [SOCKET][NOTIFICATIONS] Disconnected! Reason:', reason);
    });
    
    notificationSocket.on('notification', (notification: Notification) => {
      // 🔥 فلترة الإشعارات للمستخدمين المحظورين
      const currentUser = user;
      const fromUserId = notification.fromUserId?._id || notification.fromUserId;
      const toUserId = notification.toUserId?._id || notification.toUserId;
      
      // تحقق من حالة الحظر
      let shouldShowNotification = true;
      
      if (currentUser && fromUserId && toUserId) {
        const blockStatuses = store.getState().block.blockStatuses;

        // لا تظهر الإشعار إذا:
        // 1. أنت حظرت المرسل
        // 2. أو المرسل حظرك
        const fromUserBlockStatus = blockStatuses[String(fromUserId)] || {};
        const toUserBlockStatus = blockStatuses[String(toUserId)] || {};

        if (
          fromUserBlockStatus.isBlocked ||  // أنت حظرت المرسل
          fromUserBlockStatus.isBlockedBy || // المرسل حظرك
          toUserBlockStatus.isBlocked ||     // أنت حظرت المستلم
          toUserBlockStatus.isBlockedBy      // المستلم حظرك
        ) {
          shouldShowNotification = false;
          console.log('🔒 [NOTIFICATION] Blocked notification', fromUserId, 'to', toUserId);
        }
      }
      
      // إضافة الإشعار فقط إذا لم يكن محظور
      if (shouldShowNotification) {
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
      }
    });
    notificationSocket.on('notification:update', (notification: Notification) => {
      dispatch(updateNotification(notification));
    });

    // استقبال موحد لحذف الإشعارات من الباك إند
    notificationSocket.on('notification:delete', (payload: NotificationDeletePayload) => {
      
      // حذف مباشر بالـ id
      if (payload?.notificationId) {
        dispatch(deleteNotification(payload.notificationId));
        return;
      }
      
      // 🔥 حذف كل إشعارات البوست (البوست، التعليقات، الردود، reactions، المنشن)
      if (isPostDeletePayload(payload) && payload.postId) {
        
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
            const token = localStorage.getItem('token');
            if (token) {
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              .then(response => {
                dispatch(setNotifications(response.data));
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
        isReactionDeletePayload(payload) &&
        (payload?.postId || payload?.commentId)
      ) {
        
        // إذا كانت العلامة deleteAllReactions موجودة، احذف كل التفاعلات
        if (payload.deleteAllReactions) {
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
              const token = localStorage.getItem('token');
              if (token) {
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                .then(response => {
                  dispatch(setNotifications(response.data));
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
      if (isCommentDeletePayload(payload) && (payload?.commentId || payload?.deleteAllComments)) {
        
        if (payload.deleteAllComments && payload.postId) {
          // حذف جميع إشعارات التعليقات والردود المرتبطة بالمنشور
          dispatch(removeNotificationsByCriteria({
            type: 'COMMENT_ADDED',
            postId: payload.postId
            // لا نحدد commentId لحذف كل التعليقات
          }));
        } else if (payload.commentId) {
          // حذف تعليق محدد وجميع الردود المرتبطة به
          
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
        
        // إضافة تأخير قصير ثم إعادة تحميل الإشعارات (لضمان التحديث)
        setTimeout(() => {
          // إعادة تحميل الإشعارات من السيرفر
          if (user?._id) {
            const token = localStorage.getItem('token');
            if (token) {
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              .then(response => {
                dispatch(setNotifications(response.data));
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
      if (isCommentDeletePayload(payload) && payload?.commentId) {
        dispatch(removeNotificationsByCriteria({
          type: payload.type,
          commentId: payload.commentId,
        }));
        return;
      }
      
      // 🔥 حذف إشعارات المنشن (شامل: بوست/تعليق/رد) - الطريقة المحسنة!
      if (isMentionDeletePayload(payload)) {
        
        if (payload.deleteAllMentions && payload.postId) {
          // حذف جميع إشعارات المنشن المرتبطة بالمنشور
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
        
        // إضافة تأخير قصير ثم إعادة تحميل الإشعارات (لضمان التحديث)
        setTimeout(() => {
          // إعادة تحميل الإشعارات من السيرفر
          if (user?._id) {
            const token = localStorage.getItem('token');
            if (token) {
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              .then(response => {
                dispatch(setNotifications(response.data));
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
      if (isFollowDeletePayload(payload) && (payload?.fromUserId || payload?.followId)) {
        dispatch(removeNotificationsByCriteria({
          type: payload.type,
          fromUserId: payload.fromUserId || payload.followId || '',
        }));
        return;
      }
      
    });



    // استقبال حذف كل الإشعارات
    notificationSocket.on('notification:delete_all', () => {
      dispatch(clearNotifications());
    });

    // Connection events
    newSocket.on('connect', () => {
      dispatch(setConnected(true));
    });
  
    newSocket.on('disconnect', () => {
      dispatch(setConnected(false));
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Socket.IO connection error:', error);
      dispatch(setError('Failed to connect to chat server'));
      dispatch(setConnected(false));
    });

    // Initial data
    newSocket.on('connected', ({ rooms }: { rooms: ChatRoom[] }) => {
      dispatch(setRooms(rooms));

      // Join all room channels for real-time updates
      rooms.forEach(room => {
        newSocket.emit('chat:join_room', { roomId: room._id }, (error: Error) => {
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
      newSocket.emit('chat:join_room', { roomId }, (error: Error) => {
        if (error) {
        } else {
        }
      });
    });

    // Message events
    newSocket.on('chat:messages', ({ roomId, messages, hasMore }: { roomId: string; messages: Message[]; hasMore: boolean }) => {
      
      // Get existing messages for this room
      const existingMessages = store.getState().chat.messages[roomId] || [];
      
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
      
      dispatch(setMessages({ roomId, messages: mergedMessages }));
      dispatch(setHasMore({ roomId, hasMore }));
    });

    newSocket.on('chat:message_error', (error: Error) => {
      dispatch(setError(error.message || 'Failed to send message'));
    });

    newSocket.on('chat:message_sent', (msg: Message) => {
      // Add the message to the local state
      dispatch(addMessage({ roomId: msg.chatRoom, message: msg }));
    });

    newSocket.on('chat:new_message', (msg: Message) => {
      dispatch(addMessage({ roomId: msg.chatRoom, message: msg }));
    });

    newSocket.on('chat:typing', ({ roomId, userId, isTyping }: { roomId: string; userId: string; isTyping: boolean }) => {
      if (!roomId) {
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
    newSocket.on('post:reaction_updated', (data: { postId: string; reactions: Reactions; userReactions: UserReaction[] }) => {
      const { postId, reactions, userReactions } = data;
      dispatch(updatePostReactions({
        postId,
        reactions,
        userReactions: userReactions
          .map(ur => ({
            ...ur,
            userId: hasId(ur.userId) ? ur.userId._id : ur.userId || ''
          }))
          .filter((ur): ur is UserReaction => typeof ur.userId === 'string' && ur.userId !== '')
      }));
    });

    // Listen for comment reaction updates (realtime)
    newSocket.on('comment:reaction_updated', (data: { commentId: string; reactions: Reactions; userReactions: UserReaction[] }) => {
      const { commentId, reactions, userReactions } = data;
      dispatch(updateCommentReactions({
        commentId,
        reactions,
        userReactions: userReactions
          .map(ur => ({
            ...ur,
            userId: hasId(ur.userId) ? ur.userId._id : ur.userId || ''
          }))
          .filter((ur): ur is UserReaction => typeof ur.userId === 'string' && ur.userId !== '')
      }));
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
        notificationSocket.emit('join', user._id);
      }
    }
  }, [user?._id]);

  return null;
}

export default ReduxProvider;