'use client'

import {
  ReplyIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
  XIcon,
  ChevronDown,
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
import { useState, useMemo } from 'react'
import { Comment, Reply, User } from '@/types/comments'
import Link from 'next/link'
import AdminBadge from '../AdminBadge'


// Define CommentContent type
interface CommentContent {
  text: string;
  code: string;
  codeLang: string;
}

// Update User interface to include role
interface ExtendedUser extends User {
  role?: string;
}

// Helper type guards
function hasCreatedBy(obj: any): obj is { createdBy: any } {
  return obj && typeof obj === 'object' && 'createdBy' in obj && obj.createdBy;
}
function has_id(obj: any): obj is { _id: string } {
  return obj && typeof obj === 'object' && '_id' in obj && obj._id;
}

function isCommentWithReplies(obj: Comment | Reply): obj is Comment {
  return 'replies' in obj && Array.isArray(obj.replies);
}

// Remove the normalizeReply function

export default function CommentItem({
  comment,
  activeReplyId,
  setActiveReplyId,
  mentionUser,
  setMentionUser,
  rootId = null,
}: {
  comment: Comment | Reply
  activeReplyId: string | null
  setActiveReplyId: (id: string | null) => void
  mentionUser: string
  setMentionUser: (user: string) => void
  rootId?:  string | null
}) {
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
  const [visibleReplies, setVisibleReplies] = useState(0) // Start with 0 visible replies

  const isReply = !!comment.parentCommentId
  const commentId = has_id(comment) ? comment._id : (comment as any).id
  const rootCommentId = rootId || String(commentId)
  const { user } = useSelector((state: RootState) => state.auth);

  // Get visible replies based on pagination
  const visibleRepliesList = useMemo(() => {
    if (!isCommentWithReplies(comment) || !comment.replies || comment.replies.length === 0) {
      return [];
    }

    // Always show replies in reverse chronological order (newest first)
    const sortedReplies = [...comment.replies];
    return sortedReplies.slice(0, Math.max(visibleReplies, 0)).filter(Boolean) as Reply[];
  }, [comment, visibleReplies]);

  // Check if there are more replies to load
  const hasMoreReplies = isCommentWithReplies(comment) && 
    comment.replies.length > visibleRepliesList.length;

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
          .then(() => {
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
      const result = await dispatch(addReplyAsync({
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
        await dispatch(editCommentOrReplyAsync({
          id: String(commentId),
          data: {
            text: editValue.text,
            code: editValue.code,
            codeLang: editValue.codeLang,
            postId: comment.postId,
            createdBy: (hasCreatedBy(comment) ? comment.createdBy : (comment as any).user?._id) || ''
          }
        }))
        
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

  const handleEditCancel = () => {
    setEditValue({
      text: comment.text || '',
      code: comment.code || '',
      codeLang: comment.codeLang || '',
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await dispatch(deleteCommentOrReplyAsync(String(commentId)))
    setOpenDelete(false)
  }

  return (
    <div className="flex gap-3 items-start">
      <Link href={`/profile/${comment.createdBy.username}`}>
        <UserAvatar src={hasCreatedBy(comment) ? (comment.createdBy.avatar || '') : ''} firstName={hasCreatedBy(comment) ? (comment.createdBy.firstName || '') : ((comment as any).user?.name || '')} />
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
              currentUserId={user?._id}
              currentUsername={user?.username || ''}
            />
            { user && (
              <button onClick={handleReplyClick} className="flex items-center hover:text-foreground transition-all duration-300 gap-1 cursor-pointer">
                <ReplyIcon className="size-4" /> {isCommentWithReplies(comment) && comment.replies.length > 0 ? comment.replies.length : ''}
              </button>
            )}
            <span>{new Date(comment.createdAt || '').toLocaleString()}</span>
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
        <div className={`${(comment as Comment).replies?.length > 0 && visibleReplies > 0 ? 'mt-4' : ''} space-y-3`}>
          {/* Show replies */}
          {visibleRepliesList.map((replyData, index) => (
            <div key={replyData._id || `reply-${index}`} className="reply-item">
              <CommentItem
                comment={replyData}
                activeReplyId={activeReplyId}
                setActiveReplyId={setActiveReplyId}
                mentionUser={mentionUser}
                setMentionUser={setMentionUser}
                rootId={rootCommentId}
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
                  ? `View ${comment.replies.length - visibleRepliesList.length} ${comment.replies.length - visibleRepliesList.length === 1 ? 'reply' : 'replies'}`
                  : `Load More Replies (${comment.replies.length - visibleRepliesList.length} more)`
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
