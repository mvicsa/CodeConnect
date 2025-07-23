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
      console.log('📋 Redux: Set notifications count:', state.notifications.length, 'unread:', state.unreadCount);
    },
    addNotification(state, action: PayloadAction<Notification>) {
      const newId = action.payload._id;
      console.log('➕ Redux: Adding notification:', { 
        id: newId, 
        type: action.payload.type, 
        content: action.payload.content,
        isRead: action.payload.isRead
      });
      
      if (!state.notifications.some(n => n._id === newId)) {
        state.notifications = [action.payload, ...state.notifications];
        if (!action.payload.isRead) state.unreadCount++;
        console.log('✅ Redux: Notification added. Total:', state.notifications.length, 'unread:', state.unreadCount);
      } else {
        console.log('⚠️ Redux: Notification already exists, skipping');
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
      // Force state update to trigger re-render
      state.notifications = [...state.notifications];
    },
    deleteByPostAndUser(state, action: PayloadAction<{ 
      postId?: string, 
      commentId?: string, 
      replyId?: string, 
      type: string, 
      fromUserId: string, 
      isReply?: boolean,
      reactionType?: string 
    }>) {
      console.log('🔥 deleteByPostAndUser called with:', action.payload);
      const beforeCount = state.notifications.length;
      
      state.notifications = state.notifications.filter(n => {
        const notifFromUserId = String(n.fromUserId?._id || n.fromUserId);
        const notifPostId = String(n.data?.postId || (n as any).postId || '');
        const notifCommentId = String(n.data?.commentId || n.data?._id || (n as any).commentId || n._id || '');
        const notifReplyId = String(n.data?.replyId || (n as any).replyId || '');
        const notifParentCommentId = String(
          n.data?.parentCommentId || 
          (n as any).parentCommentId || 
          n.data?.comment?.parentCommentId ||
          ''
        );
        
        // استخراج نوع التفاعل من الإشعار
        const notifReactionType = n.data?.reactionType || n.data?.reaction;
        
        // حذف إشعار تفاعل أو إشعار كومنت/ريپلاي بناءً على id/type/fromUserId
        const matchReaction =
        notifFromUserId === String(action.payload.fromUserId) &&
        n.type.endsWith('REACTION') &&
        (
          notifPostId === String(action.payload.postId || '') ||
          notifCommentId === String(action.payload.commentId || '') ||
          notifReplyId === String(action.payload.replyId || '')
        ) &&
        // التحقق من نوع التفاعل إذا كان محددًا
        (!action.payload.reactionType || notifReactionType === action.payload.reactionType);
          
        const matchComment =
          n.type === action.payload.type &&
          action.payload.commentId &&
          notifCommentId === String(action.payload.commentId);

        // When a comment is deleted, also remove all reply notifications to that comment
        const matchRepliesOfDeletedComment =
          (action.payload.type === 'COMMENT_ADDED' || action.payload.type === 'REPLY_CLEANUP' || action.payload.type === 'COMMENT_ADDED') &&
          action.payload.commentId &&
          n.type === NotificationType.COMMENT_ADDED &&
          (
            notifParentCommentId === String(action.payload.commentId) ||
            (n.data?.comment && String(n.data.comment.parentCommentId) === String(action.payload.commentId)) ||
            (n.data?.commentId && String(n.data.commentId) === String(action.payload.commentId))
          );

        // When a comment is deleted, also remove all notifications that reference this comment as their target
        const matchAllNotificationsForDeletedComment =
          action.payload.type === 'COMMENT_ADDED' &&
          action.payload.commentId &&
          (
            // Direct notifications on this comment
            notifCommentId === String(action.payload.commentId) ||
            // Replies to this comment (parentCommentId points to the deleted comment)
            (n.type === NotificationType.COMMENT_ADDED && notifParentCommentId === String(action.payload.commentId)) ||
            // Mentions in this comment or replies to this comment
            (n.type === NotificationType.USER_MENTIONED && 
             (notifCommentId === String(action.payload.commentId) || notifParentCommentId === String(action.payload.commentId))) ||
            // Reactions on this comment
            (n.type.endsWith('REACTION') && notifCommentId === String(action.payload.commentId))
          );
        
        // Enhanced cleanup for comments with replies - also check comment data structure
        const matchEnhancedCommentCleanup =
          action.payload.type === 'COMMENT_ADDED' &&
          action.payload.commentId &&
          (
            // Check if notification's comment data has the deleted comment as parent
            (n.data?.comment?.parentCommentId === String(action.payload.commentId)) ||
            // Check if notification is about a reply where parentCommentId matches
            (n.type === NotificationType.COMMENT_ADDED && 
             (n.data?.parentCommentId === String(action.payload.commentId) ||
              String(n.data?.comment?.parentCommentId) === String(action.payload.commentId))) ||
            // Check for mentions in replies to the deleted comment
            (n.type === NotificationType.USER_MENTIONED &&
             (n.data?.parentCommentId === String(action.payload.commentId) ||
              String(n.data?.comment?.parentCommentId) === String(action.payload.commentId)))
          );

        const matchMention =
        n.type === NotificationType.USER_MENTIONED &&
          (
            notifCommentId === String(action.payload.commentId) ||
            notifCommentId === String(action.payload.replyId) ||
            (n.data?.parentCommentId && n.data.parentCommentId === action.payload.commentId) ||
            // 🔥 فحص إضافي شامل للمنشن
            (action.payload.commentId && n.data?.comment?._id === String(action.payload.commentId)) ||
            (action.payload.commentId && String(n.data?._id) === String(action.payload.commentId))
          );

        const matchFollow =
          n.type === NotificationType.FOLLOWED_USER &&
          (
            notifFromUserId === String(action.payload.fromUserId) ||
            notifFromUserId === String((action.payload as any).followId)
          );

        // 🔥 تسجيل تفصيلي لتصحيح مشاكل المنشن
        if (n.type === NotificationType.USER_MENTIONED) {
          console.log('🔍 deleteByPostAndUser - Checking MENTION notification:', {
            notificationId: n._id,
            notificationType: n.type,
            matchMention, 
            payloadCommentId: action.payload.commentId, 
            notifCommentId,
            notifParentCommentId,
            notificationData: n.data,
            fullPayload: action.payload
          });
        }

        const shouldDelete = matchReaction || matchComment || matchRepliesOfDeletedComment || 
                          matchAllNotificationsForDeletedComment || matchEnhancedCommentCleanup || 
                          matchMention || matchFollow;
        
        if (shouldDelete && n.type === NotificationType.USER_MENTIONED) {
          console.log('🗑️ deleteByPostAndUser - DELETING MENTION notification:', {
            notificationId: n._id,
            reason: matchMention ? 'direct mention match' : 'other match',
            notification: n
          });
        }
        
        return !shouldDelete;
      });
      
      const afterCount = state.notifications.length;
      const deletedCount = beforeCount - afterCount;
      
      console.log(`🗑️ Deleted ${deletedCount} notifications (${beforeCount} -> ${afterCount})`);
      if (deletedCount > 0) {
        console.log('🔍 Deleted notification types:', action.payload.type);
      }
      
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      // Force state update to trigger re-render
      state.notifications = [...state.notifications];
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
    
    // 🔥 إضافة reducer جديد لحذف إشعارات التعليقات والردود
    removeCommentNotifications: (state, action: PayloadAction<{
      commentId: string;
      includeReplies?: boolean;
      includeMentions?: boolean;
      includeReactions?: boolean;
      mentions?: string[];
      forceBroadcast?: boolean;
    }>) => {
      const { 
        commentId, 
        includeReplies = true, 
        includeMentions = true, 
        includeReactions = true,
        mentions = [],
        forceBroadcast = false
      } = action.payload;
      
      const initialCount = state.notifications.length;
      
      console.log('🔥 removeCommentNotifications called with:', {
        commentId,
        includeReplies,
        includeMentions,
        includeReactions,
        mentions,
        forceBroadcast,
        totalNotifications: initialCount
      });
      
      state.notifications = state.notifications.filter(notification => {
        let shouldRemove = false;
        
        const notifCommentId = String(notification.data?.commentId || notification.data?._id || notification._id || '');
        const notifParentCommentId = String(
          notification.data?.parentCommentId || 
          notification.data?.comment?.parentCommentId ||
          ''
        );
        
        // حذف إشعار التعليق الأساسي
        if (notification.type === NotificationType.COMMENT_ADDED && 
            notifCommentId === commentId) {
          shouldRemove = true;
        }
        
        // حذف إشعارات الردود إذا كان مطلوب (COMMENT_ADDED with parentCommentId)
        if (includeReplies && 
            notification.type === NotificationType.COMMENT_ADDED && 
            notifParentCommentId === commentId) {
          shouldRemove = true;
        }
        
        // 🔥 تحسين حذف إشعارات المنشن بطريقة أكثر شمولية
        if (includeMentions && notification.type === NotificationType.USER_MENTIONED) {
          // فحص إذا كان الإشعار مرتبط بالتعليق المحذوف
          const directMatch = notifCommentId === commentId || notifParentCommentId === commentId;
          
          // فحص إضافي في بيانات الإشعار
          let dataMatch = false;
          const dataStr = JSON.stringify(notification.data || {});
          if (dataStr.includes(commentId)) {
            dataMatch = true;
          }
          
          // فحص إذا كان المستخدم المذكور في قائمة المنشنات
          let mentionMatch = false;
          if (mentions.length > 0) {
            const notifToUsername = notification.toUserId?.username || '';
            if (mentions.includes(notifToUsername)) {
              mentionMatch = true;
              console.log('🔍 Found mention match by username:', notifToUsername);
            }
          }
          
          if (directMatch || dataMatch || mentionMatch) {
            shouldRemove = true;
            console.log('🗑️ Removing mention notification:', {
              id: notification._id,
              reason: directMatch ? 'direct match' : (dataMatch ? 'data match' : 'mention match'),
              toUser: notification.toUserId?.username
            });
          }
        }
        
        // حذف إشعارات Reactions إذا كان مطلوب (ANY reaction type)
        if (includeReactions && notification.type.endsWith('REACTION') && 
            notifCommentId === commentId) {
          shouldRemove = true;
        }
        
        return !shouldRemove;
      });
      
      const deletedCount = initialCount - state.notifications.length;
      console.log(`🗑️ removeCommentNotifications: Removed ${deletedCount} comment-related notifications for commentId: ${commentId}`);
      
      // تحديث العداد
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      
      // 🔥 Force state immutability to trigger re-renders
      state.notifications = [...state.notifications];
      
      console.log('✅ Comment notifications update completed. New state:', {
        totalNotifications: state.notifications.length,
        unreadCount: state.unreadCount,
        stateUpdateTimestamp: new Date().toISOString()
      });
    },

    // تحديث removeNotificationsByCriteria للتعامل مع الردود بشكل أفضل
    removeNotificationsByCriteria: (state, action: PayloadAction<{
      type?: string;
      postId?: string;
      commentId?: string;
      fromUserId?: string;
      parentCommentId?: string;
      reactionType?: string; // إضافة نوع التفاعل
      affectedTypes?: string[]; // 🔥 جديد لحذف أنواع متعددة
    }>) => {
      const { type, postId, commentId, fromUserId, parentCommentId, reactionType, affectedTypes } = action.payload;
      
      const initialCount = state.notifications.length;
      
      console.log('🔍 removeNotificationsByCriteria called with:', {
        type, postId, commentId, fromUserId, parentCommentId, reactionType, affectedTypes,
        totalNotifications: initialCount
      });
      
      // 🔥 عرض عينة من الإشعارات الحالية للتصحيح
      console.log('🔍 Sample notifications in store:', state.notifications.slice(0, 3).map(n => ({
        id: n._id,
        type: n.type,
        content: n.content.substring(0, 30) + '...',
        dataKeys: Object.keys(n.data || {}),
        data: n.data
      })));
      
      if (type === 'POST' && postId) {
        console.log(`🔍 Looking for ALL notifications related to POST: ${postId} (including comments, replies, reactions, mentions)`);
        
        // عرض كل الإشعارات المرتبطة بالبوست
        const relatedNotifications = state.notifications.filter(n => {
          const dataStr = JSON.stringify(n);
          return dataStr.includes(`"postId":"${postId}"`) || 
                 dataStr.includes(`"post":"${postId}"`) ||
                 String(n.data?.postId || '') === postId;
        });
        
        console.log(`🔍 Found ${relatedNotifications.length} potentially related notifications:`, 
          relatedNotifications.map(n => ({
            id: n._id,
            type: n.type,
            content: n.content.substring(0, 30) + '...'
          }))
        );
      }
      
      state.notifications = state.notifications.filter(notification => {
        let shouldRemove = false;
        
        const notifFromUserId = String(notification.fromUserId?._id || notification.fromUserId);
        
        // 🔥 محاولة العثور على postId في عدة أماكن ممكنة
        const notifPostId = String(
          notification.data?.postId || 
          notification.data?.post?._id ||
          (notification.data?.post && typeof notification.data.post === 'string' ? notification.data.post : '') ||
          ''
        );
        
        const notifCommentId = String(notification.data?.commentId || notification.data?._id || notification._id || '');
        const notifParentCommentId = String(
          notification.data?.parentCommentId || 
          notification.data?.comment?.parentCommentId ||
          ''
        );
        
        // استخراج نوع التفاعل من الإشعار
        const notifReactionType = notification.data?.reactionType || notification.data?.reaction;
        
        // تحسين معالجة إشعارات التفاعلات
        if (type && type.endsWith('_REACTION')) {
          // للتفاعلات على المنشورات
          if (type === 'POST_REACTION' && String(notification.type) === 'POST_REACTION') {
            if (postId && notifPostId === postId) {
              // إذا لم يتم تحديد fromUserId أو reactionType، احذف كل التفاعلات على المنشور
              if (!fromUserId && !reactionType) {
                shouldRemove = true;
                console.log('🗑️ Removing ALL POST_REACTION notifications for post:', {
                  id: notification._id,
                  fromUser: notifFromUserId,
                  postId: notifPostId,
                  reactionType: notifReactionType
                });
              } else if (!fromUserId || notifFromUserId === fromUserId) {
                if (!reactionType || notifReactionType === reactionType) {
                  shouldRemove = true;
                  console.log('🗑️ Removing POST_REACTION notification:', {
                    id: notification._id,
                    fromUser: notifFromUserId,
                    postId: notifPostId,
                    reactionType: notifReactionType
                  });
                }
              }
            }
          }
          
          // للتفاعلات على التعليقات
          if (type === 'COMMENT_REACTION' && String(notification.type) === 'COMMENT_REACTION') {
            const matchCommentId = commentId && notifCommentId === commentId;
            const matchPostId = postId && notifPostId === postId;
            
            if (matchCommentId || matchPostId) {
              // إذا لم يتم تحديد fromUserId أو reactionType، احذف كل التفاعلات على التعليق
              if (!fromUserId && !reactionType) {
                shouldRemove = true;
                console.log('🗑️ Removing ALL COMMENT_REACTION notifications for comment/post:', {
                  id: notification._id,
                  fromUser: notifFromUserId,
                  commentId: notifCommentId,
                  postId: notifPostId,
                  reactionType: notifReactionType
                });
              } else if (!fromUserId || notifFromUserId === fromUserId) {
                if (!reactionType || notifReactionType === reactionType) {
                  shouldRemove = true;
                  console.log('🗑️ Removing COMMENT_REACTION notification:', {
                    id: notification._id,
                    fromUser: notifFromUserId,
                    commentId: notifCommentId,
                    postId: notifPostId,
                    reactionType: notifReactionType
                  });
                }
              }
            }
          }
        }
        
        // 🔥 تسجيل تفصيلي للتصحيح
        if (type === 'POST' && postId) {
          const matches = notifPostId === postId;
          console.log('🔍 Checking notification for POST deletion:', {
            notificationId: notification._id,
            notificationType: notification.type,
            notifPostId,
            targetPostId: postId,
            matches,
            notificationData: notification.data,
            hasAffectedTypes: !!affectedTypes,
            affectedTypes: affectedTypes
          });
          
          if (matches) {
            console.log('✅ POST notification WILL BE DELETED:', {
              id: notification._id,
              type: notification.type,
              content: notification.content?.substring(0, 50) + '...'
            });
          }
        }
        
        // 🔥 حذف كل الإشعارات المرتبطة بالكومنت (والردود عليه)
        if (type === 'COMMENT_ADDED') {
          // إذا تم تحديد commentId، احذف تعليق محدد وجميع الردود عليه
          if (commentId) {
            console.log('🔍 Checking notification for COMMENT deletion (including replies):', {
              notificationId: notification._id,
              notificationType: notification.type,
              targetCommentId: commentId
            });
            // 🔥 البحث في كل مكان ممكن يكون فيه commentId
            const foundInData = String(notification.data?.commentId || '') === commentId;
            const foundInId = String(notification.data?._id || '') === commentId;
            const foundInComment = String(notification.data?.comment?._id || '') === commentId;
            const foundInParent = String(notification.data?.parentCommentId || '') === commentId;
            
            // 🔥 بحث إضافي: إذا كان هذا رد على التعليق المحذوف
            const isReplyToDeletedComment = String(notification.data?.comment?.parentCommentId || '') === commentId;
            
            // 🔥 للمنشن: بحث إضافي شامل في كل البيانات
            let foundInMention = false;
            if (notification.type === 'USER_MENTIONED') {
              const dataStr = JSON.stringify(notification.data || {});
              foundInMention = dataStr.includes(commentId);
              
              // تسجيل للتصحيح
              console.log('🔍 Checking MENTION for comment deletion:', {
                notificationId: notification._id,
                commentId: commentId,
                foundInMention,
                notificationData: notification.data
              });
            }
            
            // 🔥 بحث شامل في كل أجزاء البيانات باستخدام JSON
            let foundInFullData = false;
            try {
              const fullDataStr = JSON.stringify(notification);
              foundInFullData = fullDataStr.includes(`"commentId":"${commentId}"`) || 
                               fullDataStr.includes(`"parentCommentId":"${commentId}"`) ||
                               fullDataStr.includes(`"_id":"${commentId}"`);
            } catch (e) {
              // تجاهل الأخطاء في التحويل
            }
            
            const isRelatedToComment = foundInData || foundInId || foundInComment || foundInParent || foundInMention || isReplyToDeletedComment || foundInFullData;
            
            if (isRelatedToComment) {
              shouldRemove = true;
              console.log('🗑️ DELETING notification for COMMENT/REPLY:', {
                id: notification._id,
                type: notification.type,
                commentId: commentId,
                foundWhere: {
                  data: foundInData,
                  id: foundInId,
                  comment: foundInComment,
                  parent: foundInParent,
                  mention: foundInMention,
                  replyToDeleted: isReplyToDeletedComment,
                  fullData: foundInFullData
                }
              });
            }
          }
          // إذا تم تحديد postId فقط (بدون commentId)، احذف كل التعليقات والردود في المنشور
          else if (postId && notification.type === 'COMMENT_ADDED') {
            // البحث الشامل عن postId في كل أجزاء الإشعار
            const dataStr = JSON.stringify(notification);
            const hasPostId = dataStr.includes(`"postId":"${postId}"`) || 
                             dataStr.includes(`"post":"${postId}"`) ||
                             notifPostId === postId;
            
            if (hasPostId) {
              shouldRemove = true;
              console.log('🗑️ DELETING ALL COMMENT/REPLY notifications for POST:', {
                id: notification._id,
                type: notification.type,
                postId: postId,
                notifPostId: notifPostId
              });
            }
          }
        }
        
                // 🔥 حذف كل الإشعارات المرتبطة بالبوست (البوست + التعليقات + الردود + التفاعلات + المنشنات)
        if (type === 'POST' && postId) {
          // 🔥 البحث في كل مكان ممكن يكون فيه postId
          const foundInData = String(notification.data?.postId || '') === postId;
          const foundInComment = String(notification.data?.comment?.postId || '') === postId;
          const foundInPost = String(notification.data?.post?._id || '') === postId;
          
          // البحث في الـ replies المتداخلة
          let foundInNestedReply = false;
          if (notification.data?.comment?.parentCommentId) {
            // هذا رد، تحقق من postId في البيانات المتداخلة
            const replyData = JSON.stringify(notification.data);
            foundInNestedReply = replyData.includes(`"postId":"${postId}"`);
          }
          
          // 🔥 للمنشن: بحث إضافي شامل في كل البيانات
          let foundInMention = false;
          if (notification.type === NotificationType.USER_MENTIONED) {
            const dataStr = JSON.stringify(notification.data || {});
            foundInMention = dataStr.includes(postId);
          }
          
          // 🔥 للتفاعلات على التعليقات والردود: تحقق من postId في البيانات
          let foundInCommentReaction = false;
          if (String(notification.type) === 'COMMENT_REACTION') {
            const dataStr = JSON.stringify(notification.data || {});
            foundInCommentReaction = dataStr.includes(postId);
          }
          
          // 🔥 بحث شامل في كل أجزاء البيانات باستخدام JSON
          let foundInFullData = false;
          try {
            const fullDataStr = JSON.stringify(notification);
            foundInFullData = fullDataStr.includes(`"postId":"${postId}"`) || fullDataStr.includes(`"post":"${postId}"`);
          } catch (e) {
            // تجاهل الأخطاء في التحويل
          }
          
          const isRelatedToPost = foundInData || foundInComment || foundInPost || foundInMention || foundInCommentReaction || foundInNestedReply || foundInFullData;
          
          if (isRelatedToPost) {
            shouldRemove = true;
            console.log('🗑️ DELETING notification for POST (including comments/replies):', {
              id: notification._id,
              type: notification.type,
              postId: postId,
              foundWhere: {
                data: foundInData,
                comment: foundInComment,
                post: foundInPost,
                mention: foundInMention,
                commentReaction: foundInCommentReaction,
                nestedReply: foundInNestedReply,
                fullData: foundInFullData
              }
            });
          }
        }
        
        // حذف إشعارات reactions على البوستات (محسن)
        if (type === 'POST_REACTION' && postId) {
          if (notification.type === NotificationType.POST_REACTION && 
              (notifPostId === postId || JSON.stringify(notification).includes(`"postId":"${postId}"`)) && 
              (!fromUserId || notifFromUserId === fromUserId)) {
            shouldRemove = true;
            console.log('🗑️ Removing POST_REACTION for post:', {
              id: notification._id,
              postId: postId,
              fromUser: notifFromUserId
            });
          }
        }
        
        // 🔥 حذف إشعارات reactions على التعليقات والردود 
        if (type === 'COMMENT_REACTION') {
          // حذف بناءً على postId (جميع تفاعلات التعليقات في المنشور)
          if (postId) {
            const dataStr = JSON.stringify(notification.data || {});
            const hasPostId = dataStr.includes(`"postId":"${postId}"`) || dataStr.includes(`"post":"${postId}"`);
            
            if (String(notification.type) === 'COMMENT_REACTION' && hasPostId && 
                (!fromUserId || notifFromUserId === fromUserId)) {
              shouldRemove = true;
              console.log('🗑️ Removing COMMENT_REACTION for post:', {
                id: notification._id,
                postId: postId,
                fromUser: notifFromUserId,
                commentId: notifCommentId
              });
            }
          }
          
          // حذف بناءً على commentId (تفاعلات تعليق/رد محدد)
          if (commentId && String(notification.type) === 'COMMENT_REACTION') {
            const dataStr = JSON.stringify(notification.data || {});
            const hasCommentId = dataStr.includes(`"commentId":"${commentId}"`) || 
                                String(notification.data?.commentId || '') === commentId ||
                                String(notification.data?._id || '') === commentId;
            
            if (hasCommentId && (!fromUserId || notifFromUserId === fromUserId)) {
              shouldRemove = true;
              console.log('🗑️ Removing COMMENT_REACTION for comment:', {
                id: notification._id,
                commentId: commentId,
                fromUser: notifFromUserId
              });
            }
          }
        }
        
        // 🔥 حذف إشعارات المنشن (شامل: بوست/تعليق/رد) - محسن
        if (type === 'USER_MENTIONED') {
          const notifMentionedUserId = String(notification.toUserId?._id || notification.toUserId || '');
          
          // البحث الشامل عن postId في كل أجزاء الإشعار
          const dataStr = JSON.stringify(notification);
          const hasPostId = dataStr.includes(`"postId":"${postId}"`) || 
                           dataStr.includes(`"post":"${postId}"`) ||
                           notifPostId === postId;
          
          // حذف المنشن في البوست أو التعليقات أو الردود المرتبطة بالبوست
          if (postId && hasPostId && notification.type === 'USER_MENTIONED') {
            // إذا لم يتم تحديد fromUserId، احذف كل المنشنات في المنشور
            if (!fromUserId) {
              shouldRemove = true;
              console.log('🗑️ Removing ALL USER_MENTIONED notifications for post (including comments/replies):', {
                id: notification._id,
                fromUser: notifFromUserId,
                toUser: notifMentionedUserId,
                postId: postId
              });
            } else if (notifFromUserId === fromUserId) {
              shouldRemove = true;
              console.log('🗑️ Removing USER_MENTIONED notification (including comments/replies):', {
                id: notification._id,
                fromUser: notifFromUserId,
                toUser: notifMentionedUserId,
                postId: postId
              });
            }
          }
          
          // حذف المنشن في التعليق أو الرد (محسن)
          if (commentId && notification.type === 'USER_MENTIONED') {
            // البحث الشامل عن commentId في كل أجزاء الإشعار
            const dataStr = JSON.stringify(notification);
            const hasCommentId = dataStr.includes(`"commentId":"${commentId}"`) || 
                                notifCommentId === commentId ||
                                String(notification.data?._id || '') === commentId ||
                                String(notification.data?.comment?._id || '') === commentId;
            
            if (hasCommentId) {
              // إذا لم يتم تحديد fromUserId، احذف كل المنشنات في التعليق
              if (!fromUserId) {
                shouldRemove = true;
                console.log('🗑️ Removing ALL USER_MENTIONED notifications for comment (including replies):', {
                  id: notification._id,
                  fromUser: notifFromUserId,
                  toUser: notifMentionedUserId,
                  commentId: commentId
                });
              } else if (notifFromUserId === fromUserId) {
                shouldRemove = true;
                console.log('🗑️ Removing USER_MENTIONED notification (including replies):', {
                  id: notification._id,
                  fromUser: notifFromUserId,
                  toUser: notifMentionedUserId,
                  commentId: commentId
                });
              }
            }
          }
          
          // حذف المنشن من مستخدم معين (فقط إذا تم تحديد fromUserId)
          if (fromUserId && notifFromUserId === fromUserId && notification.type === 'USER_MENTIONED') {
            shouldRemove = true;
            console.log('🗑️ Removing USER_MENTIONED notification from specific user:', {
              id: notification._id,
              fromUser: notifFromUserId,
              toUser: notifMentionedUserId
            });
          }
        }
        
        // حذف إشعارات المتابعة
        if (type === 'FOLLOWED_USER' && fromUserId) {
          if (notification.type === NotificationType.FOLLOWED_USER && 
              notifFromUserId === fromUserId) {
            shouldRemove = true;
          }
        }
        
        return !shouldRemove;
      });
      
      const deletedCount = initialCount - state.notifications.length;
      console.log(`🗑️ removeNotificationsByCriteria: Deleted ${deletedCount} notifications for criteria:`, action.payload);
      console.log(`📊 Notifications count: ${initialCount} → ${state.notifications.length}`);
      
      // إظهار ما تم حذفه بالتفصيل إذا كان حذف بوست
      if (type === 'POST' && postId && deletedCount > 0) {
        console.log(`🎯 Successfully deleted ${deletedCount} notifications for POST ${postId}, including:`);
        console.log('   - Post notifications');
        console.log('   - Comment notifications');
        console.log('   - Reply notifications');
        console.log('   - Reaction notifications (post + comments)');
        console.log('   - Mention notifications (post + comments + replies)');
      }
      
      // تحديث العداد
      const newUnreadCount = state.notifications.filter(n => !n.isRead).length;
      state.unreadCount = newUnreadCount;
      console.log(`📊 Unread count updated: ${state.unreadCount}`);
      
      // 🔥 Force state immutability to trigger re-renders
      state.notifications = [...state.notifications];
      
      console.log('✅ State update completed. New state:', {
        totalNotifications: state.notifications.length,
        unreadCount: state.unreadCount,
        deletedCount: deletedCount,
        stateUpdateTimestamp: new Date().toISOString()
      });
    },

    // 🔥 إضافة دالة لحذف إشعارات البوست وكل التعليقات والردود المرتبطة به
    removePostNotifications: (state, action: PayloadAction<{
      postId: string;
      includeComments?: boolean;
      includeReplies?: boolean;
      includeMentions?: boolean;
      includeReactions?: boolean;
    }>) => {
      const { postId, includeComments = true, includeReplies = true, includeMentions = true, includeReactions = true } = action.payload;
      
      const initialCount = state.notifications.length;
      
      state.notifications = state.notifications.filter(notification => {
        let shouldRemove = false;
        
        const notifPostId = String(notification.data?.postId || notification.data?._id || '');
        const notifCommentId = String(notification.data?.commentId || '');
        const notifParentCommentId = String(notification.data?.parentCommentId || '');
        
        // حذف إشعارات البوست نفسه (POST_CREATED, POST_REACTION)
        if ((notification.type === NotificationType.POST_CREATED || notification.type === NotificationType.POST_REACTION) && 
            notifPostId === postId) {
          shouldRemove = true;
        }
        
        // حذف إشعارات التعليقات على البوست إذا كان مطلوب
        if (includeComments && notification.type === NotificationType.COMMENT_ADDED && 
            notifPostId === postId) {
          shouldRemove = true;
        }
        
        // حذف إشعارات الردود على تعليقات البوست إذا كان مطلوب
        if (includeReplies && 
            notification.type === NotificationType.COMMENT_ADDED && 
            notifPostId === postId) {
          shouldRemove = true;
        }
        
        // حذف إشعارات المنشن في البوست أو تعليقاته إذا كان مطلوب
        if (includeMentions && notification.type === NotificationType.USER_MENTIONED && 
            notifPostId === postId) {
          shouldRemove = true;
        }
        
        // حذف إشعارات Reactions على البوست أو تعليقاته إذا كان مطلوب
        if (includeReactions && notification.type.endsWith('REACTION') && 
            notifPostId === postId) {
          shouldRemove = true;
        }
        
        return !shouldRemove;
      });
      
      const deletedCount = initialCount - state.notifications.length;
      console.log(`🗑️ removePostNotifications: Removed ${deletedCount} post-related notifications for postId: ${postId}`);
      
      // تحديث العداد
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
    },

    // 🔥 إضافة reducer خاص بحذف المنشن
    removeMentionNotifications: (state, action: PayloadAction<{
      postId?: string;
      commentId?: string;
      fromUserId?: string;
      toUserId?: string;
    }>) => {
      const { postId, commentId, fromUserId, toUserId } = action.payload;
      
      const initialCount = state.notifications.length;
      
      state.notifications = state.notifications.filter(notification => {
        let shouldRemove = false;
        
        if (notification.type === NotificationType.USER_MENTIONED) {
          // 🔥 استخراج شامل للبيانات من عدة مواقع ممكنة
          const notifPostId = String(
            notification.data?.postId || 
            notification.data?.post?._id ||
            (notification.data?.post && typeof notification.data.post === 'string' ? notification.data.post : '') ||
            notification.data?.comment?.postId ||
            ''
          );
          
          // 🔥 استخراج commentId من عدة مواقع ممكنة  
          const notifCommentId = String(
            notification.data?.commentId || 
            notification.data?._id || 
            notification.data?.comment?._id ||
            notification._id ||
            ''
          );
          
          const notifParentCommentId = String(
            notification.data?.parentCommentId || 
            notification.data?.comment?.parentCommentId ||
            ''
          );
          
          const notifFromUserId = String(notification.fromUserId?._id || notification.fromUserId || '');
          const notifToUserId = String(notification.toUserId?._id || notification.toUserId || '');
          
          // 🔥 تسجيل تفصيلي لتصحيح مشاكل المنشن
          console.log(`🔍 Checking mention notification:`, {
            notificationId: notification._id,
            notifCommentId,
            notifParentCommentId,
            notifPostId,
            notifFromUserId,
            notifToUserId,
            targetCommentId: commentId,
            targetPostId: postId,
            targetFromUserId: fromUserId,
            targetToUserId: toUserId,
            notificationData: notification.data
          });
          
          // حذف منشن في بوست معين
          if (postId && notifPostId === postId) {
            shouldRemove = true;
            console.log(`🗑️ Removing mention in post: ${postId}`);
          }
          
          // حذف منشن في تعليق/رد معين - استخدام منطق أكثر شمولية
          if (commentId && 
              (notifCommentId === commentId || 
               notifParentCommentId === commentId ||
               // فحص إضافي في حالة كان commentId مخزون في مكان آخر
               (notification.data?.comment && String(notification.data.comment._id) === commentId))) {
            shouldRemove = true;
            console.log(`🗑️ Removing mention in comment/reply: ${commentId}`);
          }
          
          // حذف منشن من مستخدم معين
          if (fromUserId && notifFromUserId === fromUserId) {
            shouldRemove = true;
            console.log(`🗑️ Removing mention from user: ${fromUserId}`);
          }
          
          // حذف منشن لمستخدم معين
          if (toUserId && notifToUserId === toUserId) {
            shouldRemove = true;
            console.log(`🗑️ Removing mention to user: ${toUserId}`);
          }
        }
        
        if (shouldRemove && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        return !shouldRemove;
      });
      
      const deletedCount = initialCount - state.notifications.length;
      console.log(`🗑️ removeMentionNotifications: Removed ${deletedCount} mention notifications`);
      
      // 🔥 Force state immutability to trigger re-renders
      state.notifications = [...state.notifications];
      
      console.log('✅ State update completed for mentions. New state:', {
        totalNotifications: state.notifications.length,
        unreadCount: state.unreadCount,
        stateUpdateTimestamp: new Date().toISOString()
      });
    },
    
    // 🔥 دالة تصحيح مؤقتة لرؤية بنية الإشعارات
    debugNotifications: (state, action: PayloadAction<{ postId?: string; limitTo?: number }>) => {
      const { postId, limitTo = 5 } = action.payload;
      
      console.log('🧪 DEBUG: Current notifications in store:', {
        total: state.notifications.length,
        unread: state.unreadCount,
        notifications: state.notifications.slice(0, limitTo).map(n => ({
          id: n._id,
          type: n.type,
          isRead: n.isRead,
          content: n.content.substring(0, 50) + '...',
          data: n.data,
          fromUserId: n.fromUserId?._id || n.fromUserId,
          toUserId: n.toUserId?._id || n.toUserId,
          createdAt: n.createdAt
        }))
      });
      
      if (postId) {
        const relatedNotifications = state.notifications.filter(n => {
          const notifPostId = String(
            n.data?.postId || 
            n.data?.post?._id ||
            (n.data?.post && typeof n.data.post === 'string' ? n.data.post : '') ||
            ''
          );
          return notifPostId === postId;
        });
        
        console.log(`🧪 DEBUG: Notifications related to post ${postId}:`, {
          count: relatedNotifications.length,
          notifications: relatedNotifications.map(n => ({
            id: n._id,
            type: n.type,
            content: n.content.substring(0, 50) + '...',
            data: n.data
          }))
        });
      }
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
  removeCommentNotifications,     // 🔥 إضافة جديدة
  removeNotificationsByCriteria,  // 🔥 إضافة جديدة
  removePostNotifications,        // 🔥 إضافة جديدة
  removeMentionNotifications,     // 🔥 إضافة جديدة
  debugNotifications,             // 🔥 دالة تصحيح مؤقتة
} = notificationsSlice.actions;

export default notificationsSlice.reducer; 