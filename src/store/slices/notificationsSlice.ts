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
      // Remove duplicates by _id
      const seen = new Set();
      state.notifications = action.payload.filter(n => {
        if (seen.has(n._id)) return false;
        seen.add(n._id);
        return true;
      });
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      console.log('[REDUX][ADD]', action.payload);
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
      
      state.notifications = state.notifications.filter(n => {
        const notifFromUserId = String(n.fromUserId?._id || n.fromUserId);
        const notifPostId = String(n.data?.postId || (n as unknown as { postId: string }).postId || '');
        const notifCommentId = String(n.data?.commentId || n.data?._id || (n as unknown as { commentId: string }).commentId || n._id || '');
        const notifReplyId = String(n.data?.replyId || (n as unknown as { replyId: string }).replyId || '');
        const notifParentCommentId = String(
          n.data?.parentCommentId || 
          (n as unknown as { parentCommentId: string }).parentCommentId || 
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

        const matchPostCreated =
          n.type === NotificationType.POST_CREATED &&
          notifFromUserId === String(action.payload.fromUserId) &&
          notifPostId === String(action.payload.postId || '');

        const matchFollow =
          n.type === NotificationType.FOLLOWED_USER &&
          (
            notifFromUserId === String(action.payload.fromUserId) ||
            notifFromUserId === String((action.payload as unknown as { followId: string }).followId)
          );

        const shouldDelete = matchReaction || matchComment || matchRepliesOfDeletedComment || 
                          matchAllNotificationsForDeletedComment || matchEnhancedCommentCleanup || 
                          matchMention || matchPostCreated || matchFollow;
        
        if (shouldDelete && n.type === NotificationType.USER_MENTIONED) {
        }
        
        return !shouldDelete;
      });
      
      
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
      } = action.payload;
      
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
            }
          }
          
          if (directMatch || dataMatch || mentionMatch) {
            shouldRemove = true;
          }
        }
        
        // حذف إشعارات Reactions إذا كان مطلوب (ANY reaction type)
        if (includeReactions && notification.type.endsWith('REACTION') && 
            notifCommentId === commentId) {
          shouldRemove = true;
        }
        
        return !shouldRemove;
      });
      
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      
      // 🔥 Force state immutability to trigger re-renders
      state.notifications = [...state.notifications];
      
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
      const { type, postId, commentId, fromUserId, reactionType } = action.payload;
      
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
        
        // استخراج نوع التفاعل من الإشعار
        const notifReactionType = notification.data?.reactionType || notification.data?.reaction;
        
        // تحسين معالجة إشعارات التفاعلات
        if (type && type.endsWith('_REACTION')) {
          // للتفاعلات على المنشورات
          if (type === 'POST_REACTION' && String(notification.type) === 'POST_REACTION') {
            if (postId && notifPostId === postId) {
              // Debug logging
              console.log('[DEBUG][POST_REACTION] notifFromUserId:', notifFromUserId, 'fromUserId:', fromUserId, 'notification:', notification);
              // More robust comparison
              const matchUser = !fromUserId || notifFromUserId?.toString() == fromUserId?.toString();
              const matchReaction = !reactionType || notifReactionType === String(reactionType);
              if (matchUser && matchReaction) {
                shouldRemove = true;
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
              } else if (!fromUserId || notifFromUserId === fromUserId) {
                if (!reactionType || notifReactionType === reactionType) {
                  shouldRemove = true;
                }
              }
            }
          }
        }
        
        // 🔥 حذف كل الإشعارات المرتبطة بالكومنت (والردود عليه)
        if (type === 'COMMENT_ADDED') {
          // إذا تم تحديد commentId، احذف تعليق محدد وجميع الردود عليه
          if (commentId) {
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
              console.error('Error parsing notification data:', e);
            }
            
            const isRelatedToComment = foundInData || foundInId || foundInComment || foundInParent || foundInMention || isReplyToDeletedComment || foundInFullData;
            
            if (isRelatedToComment) {
              shouldRemove = true;
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
            console.error('Error parsing notification data:', e);
          }
          
          const isRelatedToPost = foundInData || foundInComment || foundInPost || foundInMention || foundInCommentReaction || foundInNestedReply || foundInFullData;
          
          if (isRelatedToPost) {
            shouldRemove = true;
          }
        }
        
        // حذف إشعارات reactions على البوستات (محسن)
        if (type === 'POST_REACTION' && postId) {
          if (notification.type === NotificationType.POST_REACTION && 
              (notifPostId === postId || JSON.stringify(notification).includes(`"postId":"${postId}"`)) && 
              (!fromUserId || notifFromUserId === fromUserId)) {
            shouldRemove = true;
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
            }
          }
        }
        
        // 🔥 حذف إشعارات المنشن (شامل: بوست/تعليق/رد) - محسن
        if (type === 'USER_MENTIONED') {
          
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
            } else if (notifFromUserId === fromUserId) {
              shouldRemove = true;
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
              } else if (notifFromUserId === fromUserId) {
                shouldRemove = true;
              }
            }
          }
          
          // حذف المنشن من مستخدم معين (فقط إذا تم تحديد fromUserId)
          if (fromUserId && notifFromUserId === fromUserId && notification.type === 'USER_MENTIONED') {
            shouldRemove = true;
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
      
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      
      // 🔥 Force state immutability to trigger re-renders
      state.notifications = [...state.notifications];
      
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
      
      state.notifications = state.notifications.filter(notification => {
        let shouldRemove = false;
        
        const notifPostId = String(notification.data?.postId || notification.data?._id || '');
        
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
          // حذف منشن في بوست معين
          if (postId && notifPostId === postId) {
            shouldRemove = true;
          }
          
          // حذف منشن في تعليق/رد معين - استخدام منطق أكثر شمولية
          if (commentId && 
              (notifCommentId === commentId || 
               notifParentCommentId === commentId ||
               // فحص إضافي في حالة كان commentId مخزون في مكان آخر
               (notification.data?.comment && String(notification.data.comment._id) === commentId))) {
            shouldRemove = true;
          }
          
          // حذف منشن من مستخدم معين
          if (fromUserId && notifFromUserId === fromUserId) {
            shouldRemove = true;
          }
          
          // حذف منشن لمستخدم معين
          if (toUserId && notifToUserId === toUserId) {
            shouldRemove = true;
          }
        }
        
        if (shouldRemove && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        return !shouldRemove;
      });
      
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      
      // 🔥 Force state immutability to trigger re-renders
      state.notifications = [...state.notifications];
      
    }
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
} = notificationsSlice.actions;

export default notificationsSlice.reducer; 