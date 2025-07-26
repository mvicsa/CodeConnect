'use client'

import {
  ReplyIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
  XIcon,
  ChevronDown,
  UserX,
} from 'lucide-react'
import ReplyForm from './ReplyForm'
import CommentEditor from './CommentEditor'
import UserAvatar from '../UserAvatar'
import ReactionMenu from '../ReactionsMenu'
import CodeBlock from '../code/CodeBlock'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useTranslations } from 'next-intl'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import {
  addReplyAsync,
  deleteCommentOrReplyAsync,
  editCommentOrReplyAsync,
  fetchReplies
} from '@/store/slices/commentsSlice'
import { removeNotificationsByCriteria } from '@/store/slices/notificationsSlice'
import { useBlock } from '@/hooks/useBlock'
import { BlockButton } from '@/components/block'
import { useState, useMemo, useEffect, useContext, useRef } from 'react'
import { Comment, CommentUser, Reply, User } from '@/types/comments'
import Link from 'next/link'
import AdminBadge from '../AdminBadge'
import { SocketContext } from '@/store/Provider'
import CommentAI from './CommentAI'
import { AIEvaluation } from '@/types/ai'
import { Skeleton } from '../ui/skeleton'
import { getAuthToken } from '@/lib/cookies';


// Define CommentContent type
interface CommentContent {
  text: string;
  code: string;
  codeLang: string;
}

interface ExtendedUser extends User {
  role?: string;
}

// Helper type guards
function hasCreatedBy(obj: Comment | Reply): obj is Comment | Reply & { createdBy: User } {
  return obj && typeof obj === 'object' && 'createdBy' in obj && !!obj.createdBy;
}
function has_id(obj: Comment | Reply): obj is Comment | Reply & { _id: string } {
  return obj && typeof obj === 'object' && '_id' in obj && !!obj._id;
}

function isCommentWithReplies(obj: Comment | Reply): obj is Comment {
  return 'replies' in obj && Array.isArray(obj.replies);
}

export default function CommentItem({
  comment,
  activeReplyId,
  setActiveReplyId,
  mentionUser,
  setMentionUser,
  rootId = null,
  highlightedReplyId,
  showHighlight = true,
  postText,
  postCode,
  postCodeLang
}: {
  comment: Comment | Reply
  activeReplyId: string | null
  setActiveReplyId: (id: string | null) => void
  mentionUser: string
  setMentionUser: (user: string) => void
  rootId?:  string | null
  highlightedReplyId?: string
  showHighlight?: boolean
  postText: string
  postCode?: string
  postCodeLang?: string
}) {
  const socket = useContext(SocketContext);
  const t = useTranslations()
  const dispatch = useDispatch<AppDispatch>()
  const [openDelete, setOpenDelete] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<CommentContent>({
    text: comment.text || '',
    code: comment.code || '',
    codeLang: comment.codeLang || '',
  })
  const [showReplies, setShowReplies] = useState(false)
  const [visibleReplies, setVisibleReplies] = useState(0) 
  const [fetchedAiEvaluation, setFetchedAiEvaluation] = useState<AIEvaluation | null>(null);
  const commentId = has_id(comment) ? comment._id : '';
  useEffect(() => {
    if (comment.hasAiEvaluation && commentId) {
      const token = getAuthToken();
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}/ai-evaluation`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setFetchedAiEvaluation(data);
        });
    }
  }, [comment, commentId]);

  const isReply = !!comment.parentCommentId
  const rootCommentId = rootId || String(commentId)
  const { user } = useSelector((state: RootState) => state.auth)
  const { checkBlockStatus, isBlocked, isBlockedBy } = useBlock();
  const checkBlockStatusRef = useRef(checkBlockStatus);

  // Update ref when checkBlockStatus changes
  useEffect(() => {
    checkBlockStatusRef.current = checkBlockStatus;
  }, [checkBlockStatus]);
  
  // Get block status directly from Redux to avoid re-renders
  const blockStatuses = useSelector((state: RootState) => state.block.blockStatuses, (prev, next) => {
    // Only re-render if the specific author's block status changed
    const authorId = comment.createdBy?._id?.toString();
    if (!authorId) return prev === next;
    return prev[authorId] === next[authorId];
  });

  const userStatuses = useSelector((state: RootState) => state.chat.userStatuses || {});
  const status = user ? userStatuses[comment.createdBy?._id?.toString()] || 'offline' : 'offline';

  useEffect(() => {
    if (
      highlightedReplyId &&
      isCommentWithReplies(comment) &&
      comment.replies.some(reply => reply && reply._id === highlightedReplyId)
    ) {
      setShowReplies(true);
      setVisibleReplies(comment.replies.length);
    }
  }, [highlightedReplyId, comment]);

  // Get visible replies based on pagination and filter blocked users
  const visibleRepliesList = useMemo(() => {
    if (!isCommentWithReplies(comment) || !comment.replies || comment.replies.length === 0) {
      return [];
    }

    // Always show replies in reverse chronological order (newest first) and filter blocked users
    const sortedReplies = [...comment.replies];
    return sortedReplies
      .slice(0, Math.max(visibleReplies, 0))
      .filter(Boolean)
      .filter((reply) => !isBlocked(reply.createdBy._id)) as Reply[];
  }, [comment, visibleReplies, isBlocked]);

  // Check if there are more replies to load (after filtering blocked users)
  const filteredReplies = isCommentWithReplies(comment) && comment.replies 
    ? comment.replies.filter((reply) => reply && !isBlocked(reply.createdBy._id))
    : [];
  const hasMoreReplies = isCommentWithReplies(comment) && filteredReplies.length > visibleRepliesList.length;

  const handleReplyClick = () => {
    // If this is a reply, trigger the reply form on the parent comment
    if (isReply) {
      setMentionUser((hasCreatedBy(comment) ? comment.createdBy?.username : '') || '')
      setActiveReplyId(rootCommentId)
    } else {
      setMentionUser((hasCreatedBy(comment) ? comment.createdBy?.username : '') || '')
      setActiveReplyId(String(commentId))
    }
  }

  const shouldShowReplyForm = !isReply && activeReplyId === String(commentId)

  const handleLoadMoreReplies = () => {
    if (!showReplies) {
      // First time loading replies
      if (has_id(comment)) {
        dispatch(fetchReplies(comment._id))
          .unwrap()
          .then((replies) => {
            // Check block status for reply authors
            const replyAuthorIds = replies.map(reply => reply.createdBy._id).filter(Boolean);
            replyAuthorIds.forEach(authorId => {
              if (authorId) {
                checkBlockStatusRef.current(authorId);
              }
            });
            
            setShowReplies(true);
            setVisibleReplies(2);
          });
      }
    } else {
      // Loading more replies
      setVisibleReplies(prev => prev + 2);
    }
  }

  const handleReplySubmit = async (text: string) => {
    // Always use rootCommentId for adding replies, whether replying to a comment or a reply
    const parentId = rootCommentId;
    
    if (!parentId) {
      console.error('Cannot add reply: No valid parent comment ID');
      return;
    }
    
    try {
      await dispatch(addReplyAsync({
        parentCommentId: parentId,
        text: text,
        postId: comment.postId,
        code: '',
        codeLang: ''
      })).unwrap();
      
      setActiveReplyId(null);
      setMentionUser('');
      // Ensure the new reply is visible by increasing visibleReplies if needed
      setVisibleReplies(prev => Math.max(prev + 1, 1));
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  }

  const handleEditSubmit = async (editValue: { text: string, code: string, codeLang: string }) => {
    if (
      editValue.text !== comment.text ||
      editValue.code !== comment.code ||
      editValue.codeLang !== comment.codeLang
    ) {
      try {
        // Check for removed mentions before updating
        const originalMentions = extractMentions(comment.text || '');
        const newMentions = extractMentions(editValue.text);
        const removedMentions = originalMentions.filter(mention => !newMentions.includes(mention));
        
        await dispatch(editCommentOrReplyAsync({
          id: String(commentId),
          data: {
            text: editValue.text,
            code: editValue.code,
            codeLang: editValue.codeLang,
            postId: comment.postId,
            createdBy: (hasCreatedBy(comment) ? comment.createdBy._id : (comment as CommentUser).user?._id) || user?._id as string || ''
          }
        }))
        
        // If mentions were removed, emit socket event to delete notifications
        if (removedMentions.length > 0 && socket) {
          console.log('🔄 Mentions removed:', removedMentions);
          socket.emit('notification:delete', {
            type: 'USER_MENTIONED',
            commentId: String(commentId),
            fromUserId: user?._id
          });
          console.log('🔄 Socket: Sent notification deletion for removed mentions in comment:', commentId);
        }
        
        // Force update local state to ensure UI reflects changes immediately
        setEditValue({
          text: editValue.text,
          code: editValue.code,
          codeLang: editValue.codeLang,
        })
        
        // If this is a reply, fetch the parent comment's replies again to ensure UI updates
        if (isReply && rootCommentId) {
          dispatch(fetchReplies(rootCommentId))
        }
      } catch (error) {
        console.error('Error editing comment/reply:', error)
      }
    }
    setIsEditing(false)
  }

  // Helper function to extract mentions from text
  const extractMentions = (text: string): string[] => {
    const mentions: string[] = [];
    text.split(' ').forEach(word => {
      if (word.startsWith('@')) {
        mentions.push(word.slice(1)); // Remove @ symbol
      }
    });
    return mentions;
  }

  const handleEditCancel = () => {
    setEditValue({
      text: comment.text || '',
      code: comment.code || '',
      codeLang: comment.codeLang || '',
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    console.log('🗑️ Deleting comment/reply:', commentId, 'isReply:', isReply);
    
    // 🔥 IMMEDIATE: حذف جميع الإشعارات المرتبطة بالتعليق/الرد محلياً أولاً
    console.log('🧹 IMMEDIATE CLEANUP: Removing ALL notifications for comment/reply:', commentId);
    
    // حذف إشعارات التعليق/الرد نفسه
    dispatch(removeNotificationsByCriteria({
      type: 'COMMENT_ADDED',
      commentId: String(commentId),
    }));
    
    // حذف إشعارات التفاعلات على التعليق/الرد
    dispatch(removeNotificationsByCriteria({
      type: 'COMMENT_REACTION',
      commentId: String(commentId),
    }));
    
    // حذف إشعارات المنشنات في التعليق/الرد
    dispatch(removeNotificationsByCriteria({
      type: 'USER_MENTIONED',
      commentId: String(commentId),
    }));
    
    // 🔥 إذا كان تعليق (وليس رد)، احذف أيضاً جميع الردود وإشعاراتها
    if (!isReply && 'replies' in comment && comment.replies && comment.replies.length > 0) {
      console.log(`🧹 CLEANUP: Deleting notifications for ${comment.replies.length} replies`);
      
      comment.replies.forEach((reply: Reply) => {
        // حذف إشعارات كل رد
        dispatch(removeNotificationsByCriteria({
          type: 'COMMENT_ADDED',
          commentId: String(reply._id),
        }));
        
        // حذف إشعارات التفاعلات على كل رد
        dispatch(removeNotificationsByCriteria({
          type: 'COMMENT_REACTION',
          commentId: String(reply._id),
        }));
        
        // حذف إشعارات المنشنات في كل رد
        dispatch(removeNotificationsByCriteria({
          type: 'USER_MENTIONED',
          commentId: String(reply._id),
        }));
        
        console.log('🗑️ Deleted notifications for reply:', reply._id);
      });
    }
    
    // حذف الكومنت من API
    await dispatch(deleteCommentOrReplyAsync(String(commentId)));
    setOpenDelete(false);
    
    // 🔥 إرسال socket events لحذف الإشعارات عند كل الناس
    if (socket && user?._id) {
      // استخراج المنشنات من التعليق لإرسالها مع إشعار الحذف
      const mentions = extractMentions(comment.text || '');
      
      console.log('🔄 Socket: Sending notification deletion events for comment:', commentId);
      
      // حذف إشعارات التعليق/الرد
      socket.emit('notification:delete', {
        type: 'COMMENT_ADDED',
        commentId: String(commentId),
        fromUserId: user._id,
        postId: comment.postId,
        mentions: mentions,
        hasMentions: mentions.length > 0,
        forceBroadcast: true,
        forceRefresh: true
      });
      
      // حذف إشعارات التفاعلات على التعليق/الرد
      socket.emit('notification:delete', {
        type: 'COMMENT_REACTION',
        commentId: String(commentId),
        postId: comment.postId,
        deleteAllReactions: true,
        forceRefresh: true
      });
      
      // حذف إشعارات المنشنات في التعليق/الرد
      socket.emit('notification:delete', {
        type: 'USER_MENTIONED',
        commentId: String(commentId),
        fromUserId: user._id,
        postId: comment.postId,
        mentions: mentions,
        forceRefresh: true
      });
      
             // 🔥 إذا كان تعليق (وليس رد)، إرسال أحداث لحذف جميع الردود وإشعاراتها
       if (!isReply && 'replies' in comment && comment.replies && comment.replies.length > 0) {
         console.log(`🔄 Socket: Sending deletion events for ${comment.replies.length} replies`);
         
         comment.replies.forEach((reply: Reply) => {
          const replyMentions = extractMentions(reply.text || '');
          
          // حذف إشعارات كل رد
          socket.emit('notification:delete', {
            type: 'COMMENT_ADDED',
            commentId: String(reply._id),
            fromUserId: user._id,
            postId: comment.postId,
            mentions: replyMentions,
            hasMentions: replyMentions.length > 0,
            forceBroadcast: true,
            forceRefresh: true
          });
          
          // حذف إشعارات التفاعلات على كل رد
          socket.emit('notification:delete', {
            type: 'COMMENT_REACTION',
            commentId: String(reply._id),
            postId: comment.postId,
            deleteAllReactions: true,
            forceRefresh: true
          });
          
          // حذف إشعارات المنشنات في كل رد
          socket.emit('notification:delete', {
            type: 'USER_MENTIONED',
            commentId: String(reply._id),
            fromUserId: user._id,
            postId: comment.postId,
            mentions: replyMentions,
            forceRefresh: true
          });
          
          console.log('🔄 Socket: Sent deletion events for reply:', reply._id);
        });
      }
      
      console.log('✅ Socket: All notification deletion events sent for comment/reply and its replies:', commentId);
    } else {
      console.warn('⚠️ Socket or user not available, cannot send notification deletion events');
    }
    
    // 🔥 إعادة تحميل الإشعارات بعد الحذف للتأكد من التحديث
    if (user?._id) {
      setTimeout(async () => {
        try {
          console.log('🔄 Refreshing notifications after comment deletion');
          const token = getAuthToken();
          if (token) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
              const data = await response.json();
              const { setNotifications } = await import('@/store/slices/notificationsSlice');
              dispatch(setNotifications(data));
              console.log('✅ Notifications refreshed successfully after comment deletion');
            }
          }
        } catch (error) {
          console.error('❌ Failed to refresh notifications after comment deletion:', error);
        }
      }, 1500);
    }
  }

  // Block filtering logic
  const authorId = comment.createdBy?._id?.toString();
  
  // Get block status directly from Redux state
  const authorBlockStatus = authorId ? blockStatuses[authorId] : null;
  const isAuthorBlocked = authorBlockStatus?.isBlocked || false;
  const isAuthorBlockedBy = authorBlockStatus?.isBlockedBy || false;
  
  // Check if block status is still loading (not yet checked)
  const isBlockStatusLoading = authorId && !authorBlockStatus;
  
  // Show skeleton while block status is loading
  if (isBlockStatusLoading) {
    return (
      <div className="flex gap-3 items-start relative z-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <div className="bg-accent p-3 rounded-xl relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Don't show comments from blocked users
  if (authorId && isAuthorBlocked) {
    return null;
  }
  
  // Don't show comments to users who blocked you
  if (authorId && isAuthorBlockedBy) {
    return null;
  }

  return (
    <div className="flex gap-3 items-start relative z-2">
      <Link href={`/profile/${comment.createdBy.username}`} className='relative'>
        <UserAvatar src={hasCreatedBy(comment) ? (comment.createdBy.avatar || '') : ''} firstName={hasCreatedBy(comment) ? (comment.createdBy.firstName || '') : ((comment as CommentUser).user?.username || '')} />
        {!isBlocked(comment.createdBy?._id || '') && !isBlockedBy(comment.createdBy?._id || '') && (
          <span
            className={
              `absolute bottom-0.5 end-0.5 w-3 h-3 rounded-full border-2 border-card ` +
              (status === 'online' ? 'bg-primary' : 'bg-gray-400')
            }
            title={status.charAt(0).toUpperCase() + status.slice(1)}
          />
        )}
      </Link>

      <div className="flex-1">
        <div className="bg-accent p-3 rounded-xl relative">
          {!isEditing && user && (
            <div className="absolute top-2 end-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="cursor-pointer outline-none">
                  <EllipsisVerticalIcon className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  { user?._id === comment.createdBy._id && (
                    <>
                      <DropdownMenuItem onClick={() => setIsEditing(true)} className='cursor-pointer'>
                        <PencilIcon className="size-4" />
                        {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setOpenDelete(true)} className='cursor-pointer'>
                        <TrashIcon className="size-4" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem className='cursor-pointer'>
                    <FlagIcon className="size-4" />
                    {t('report')}
                  </DropdownMenuItem>
                  {user?._id !== comment.createdBy._id && (
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <div className='flex items-center gap-2'>
                        <UserX className="size-4" />
                        <BlockButton
                          targetUserId={comment.createdBy?._id || ''}
                          targetUsername={comment.createdBy?.username}
                          variant="ghost"
                          size="sm"
                          showIcon={false}
                          showText={true}
                          className="p-0 h-auto font-normal justify-start"
                        />
                      </div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div className="font-semibold text-sm">
            {hasCreatedBy(comment) && (
              <>
                <Link href={`/profile/${comment.createdBy.username}`} className='hover:underline transition-all duration-300 me-1'>
                  { comment.createdBy.firstName }
                  { comment.createdBy.lastName && ' ' + comment.createdBy.lastName }
                </Link>
                { (comment.createdBy as ExtendedUser).role === 'admin' && (
                  <AdminBadge role={(comment.createdBy as ExtendedUser).role || ''} size='xs' />
                ) }
              </>
            )}
          </div>
          {isEditing ? (
            <div className="mt-2">
              <CommentEditor
                initialValue={editValue}
                onSubmit={handleEditSubmit}
                placeholder="Edit your comment..."
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={handleEditCancel}>
                  <XIcon className="size-4" />
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 space-y-2">
              {comment.text && (
                <bdi className='block'>
                  <p className="text-sm">
                    {comment.text.split(' ').map((word, index) => {
                      if (word.startsWith('@')) {
                        const username = word.slice(1); // Remove @ symbol
                        return (
                          <span key={index}>
                            <Link 
                              href={`/profile/${username}`}
                              className="text-primary hover:underline"
                            >
                              {word}
                            </Link>{' '}
                          </span>
                        );
                      }
                      return word + ' ';
                    })}
                  </p>
                </bdi>
              )}
              {comment.code && (
                <CodeBlock 
                  code={comment.code} 
                  language={comment.codeLang || 'javascript'} 
                />
              )}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-3 text-xs text-muted-foreground mt-2 items-center px-2">
            <ReactionMenu 
              size="sm"
              commentId={String(commentId)}
              parentCommentId={isReply ? rootCommentId : undefined}
              replyId={isReply ? String(commentId) : undefined}
              reactions={comment.reactions}
              userReactions={comment.userReactions}
              currentUserId={user?._id as string || ''}
            />
            { user && (
              <button onClick={handleReplyClick} className="flex items-center hover:text-foreground transition-all duration-300 gap-1 cursor-pointer">
                <ReplyIcon className="size-4" /> {isCommentWithReplies(comment) && filteredReplies.length > 0 ? filteredReplies.length : ''}
              </button>
            )}
            <Link href={`/posts/${comment.postId}/${commentId}`} className='hover:underline'>
              <span>{new Date(comment.createdAt || '').toLocaleString()}</span>
            </Link>
          </div>
        )}

        {/* Show AI evaluation if available or fetched */}
        {(comment.hasAiEvaluation && fetchedAiEvaluation) && (
          <div className='mt-4'>
            <CommentAI 
              evaluation={fetchedAiEvaluation} 
              postId={comment.postId} 
            />
          </div>
        )}

        {shouldShowReplyForm && (
          <ReplyForm
            key={mentionUser}
            initialValue={`@${mentionUser} `}
            onSubmit={handleReplySubmit}
          />
        )}

        {/* Replies Section */}
        <div className={`${(comment as Comment).replies?.length > 0 && visibleReplies > 0 ? 'mt-3' : ''} space-y-3`}>
          {/* Show replies */}
          {visibleRepliesList.map((replyData, index) => (
            <div 
              key={replyData._id || `reply-${index}`} 
              id={`comment-${replyData._id}`}
              className="reply-item relative"
            >
              {highlightedReplyId === replyData._id && showHighlight && (
                <div className="absolute top-[-0.5rem] left-[-0.5rem] w-[calc(100%+1rem)] h-[calc(100%+1rem)] bg-primary/10 z-1 border-s-2 border-primary transition-opacity duration-500 rounded-lg"></div>
              )}
              <CommentItem
                comment={replyData}
                activeReplyId={activeReplyId}
                setActiveReplyId={setActiveReplyId}
                mentionUser={mentionUser}
                setMentionUser={setMentionUser}
                rootId={rootCommentId}
                highlightedReplyId={highlightedReplyId}
                showHighlight={showHighlight}
                postText={postText}
                postCode={postCode}
                postCodeLang={postCodeLang}
              />
            </div>
          ))}
          
          {/* Single Load More Button */}
          {!isReply && hasMoreReplies && (
            <div className="flex justify-start pt-2 mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMoreReplies}
                className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 h-auto"
              >
                <ChevronDown className="size-3 mr-1" />
                {!showReplies 
                  ? `View ${filteredReplies.length - visibleRepliesList.length} ${filteredReplies.length - visibleRepliesList.length === 1 ? 'reply' : 'replies'}`
                  : `Load More Replies (${filteredReplies.length - visibleRepliesList.length} more)`
                }
              </Button>
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className='cursor-pointer'>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className='bg-danger hover:bg-danger/90 cursor-pointer'>
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
