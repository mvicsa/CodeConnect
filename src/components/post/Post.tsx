import React, { memo, useState, useMemo, useEffect, useContext } from 'react';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { BotIcon, EllipsisVerticalIcon, FlagIcon, MessageCircleMore, PencilIcon, SendIcon, TrashIcon, UserX } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import ReactionMenu from '../ReactionsMenu'
import VideoPlayer from '../VideoPlayer'
import CodeBlock from '../code/CodeBlock'
import { PostType } from '@/types/post'
import Tags from '../Tags'
import UserAvatar from '../UserAvatar'
import CommentSection from '../comment/CommentSection'
import PostForm from './PostForm'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { deletePost } from '@/store/slices/postsSlice'
import { removeNotificationsByCriteria } from '@/store/slices/notificationsSlice'
import { useBlock } from '@/hooks/useBlock'
import { BlockButton } from '@/components/block'
import { Skeleton } from '../ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { toast } from 'sonner';
import AdminBadge from '../AdminBadge'
import { SocketContext } from '@/store/Provider';
import ReadMore from '../ReadMore';
import { useRouter } from 'next/navigation';

interface PostProps {
  post: PostType;
  initialShowComments?: boolean;
  highlightedCommentId?: string;
  highlightedReplyId?: string;
  commentsLoading?: boolean;
}

const Post = memo(function Post({ 
  post, 
  initialShowComments = false, 
  highlightedCommentId,
  highlightedReplyId,
  commentsLoading = false
}: PostProps) {
  const { _id, text, image, video, code, codeLang, tags, createdBy, createdAt, hasAiSuggestions } = post;
  const t = useTranslations();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth)
  const socket = useContext(SocketContext);
  const { isBlocked, isBlockedBy } = useBlock();
  const router = useRouter();
  const [showComments, setShowComments] = useState(initialShowComments || !!highlightedCommentId);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get block status directly from Redux to avoid re-renders
  const blockStatuses = useSelector((state: RootState) => state.block.blockStatuses, (prev, next) => {
    // Only re-render if the specific author's block status changed
    const authorId = createdBy?._id?.toString();
    if (!authorId) return prev === next;
    return prev[authorId] === next[authorId];
  });

  // Always use freshest reactions from Redux
  const postReactionsState = useSelector((state: RootState) => state.reactions.postReactions[_id]);
  const reactions = postReactionsState?.reactions ?? post.reactions;
  const userReactions = postReactionsState?.userReactions ?? post.userReactions;

  // Normalize userReactions for type safety
  const normalizedUserReactions = ((userReactions || []).map(r =>
    typeof r.userId === 'string'
      ? { ...r, userId: { _id: r.userId, username: r.username } }
      : r
  ) as typeof post.userReactions);

  // Set showComments to true if initialShowComments changes or if there's a highlighted comment
  useEffect(() => {
    if (initialShowComments || highlightedCommentId) {
      setShowComments(true);
    }
  }, [initialShowComments, highlightedCommentId]);

  const userStatuses = useSelector((state: RootState) => state.chat.userStatuses || {});
  const status = user ? userStatuses[createdBy?._id?.toString()] || 'offline' : 'offline';
  
  // Get comments count for this post
  const { comments } = useSelector((state: RootState) => state.comments)
  const commentsCount = useMemo(() => 
    comments.filter(comment => comment.postId === _id).length, 
    [comments, _id]
  )
  
  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      dispatch(removeNotificationsByCriteria({
        type: 'POST',
        postId: _id,
      }));

      dispatch(removeNotificationsByCriteria({
        type: 'POST_REACTION',
        postId: _id,
      }));
      
      dispatch(removeNotificationsByCriteria({
        type: 'COMMENT_ADDED',
        postId: _id,
      }));
      
      dispatch(removeNotificationsByCriteria({
        type: 'COMMENT_REACTION',
        postId: _id,
      }));
      
      dispatch(removeNotificationsByCriteria({
        type: 'USER_MENTIONED',
        postId: _id,
      }));
      
      if (socket && user?._id) {
        socket.emit('notification:delete', {
          type: 'POST',
          postId: _id,
          fromUserId: user._id,
          deleteAllRelated: true,
          forceRefresh: true
        });
        
        socket.emit('notification:delete', {
          type: 'POST_REACTION',
          postId: _id,
          deleteAllReactions: true,
          forceRefresh: true
        });
        
        socket.emit('notification:delete', {
          type: 'COMMENT_ADDED',
          postId: _id,
          deleteAllComments: true,
          forceRefresh: true
        });
        
        socket.emit('notification:delete', {
          type: 'COMMENT_REACTION',
          postId: _id,
          deleteAllReactions: true,
          forceRefresh: true
        });
        
        socket.emit('notification:delete', {
          type: 'USER_MENTIONED',
          postId: _id,
          deleteAllMentions: true,
          forceRefresh: true
        });
        
      }
      
      await dispatch(deletePost({ id: _id, token: localStorage.getItem('token') || '' })).unwrap();
      
      if (user?._id) {
        setTimeout(async () => {
          try {
            const token = localStorage.getItem('token');
            if (token) {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/user/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                const data = await response.json();
                const { setNotifications } = await import('@/store/slices/notificationsSlice');
                dispatch(setNotifications(data));
              }
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete post');
          }
        }, 1500);
      }
      
      toast.success('Post deleted successfully!');
      setShowDeleteDialog(false);
      // Redirect to timeline
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  // Block filtering logic
  const authorId = createdBy?._id?.toString();
  
  // Get block status directly from Redux state
  const authorBlockStatus = authorId ? blockStatuses[authorId] : null;
  const isAuthorBlocked = authorBlockStatus?.isBlocked || false;
  const isAuthorBlockedBy = authorBlockStatus?.isBlockedBy || false;
  
  // Check if block status is still loading (not yet checked)
  const isBlockStatusLoading = authorId && !authorBlockStatus;
  
  // Show skeleton while block status is loading
  if (isBlockStatusLoading) {
    return (
      <Card className='w-full gap-4 shadow-none dark:border-transparent'>
        <CardContent className='p-4'>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Don't show posts from blocked users
  if (authorId && isAuthorBlocked) {
    return null;
  }
  
  // Don't show posts to users who blocked you
  if (authorId && isAuthorBlockedBy) {
    return null;
  }
  
  // Show PostForm component when editing
  if (isEditing) {
    return (
      <PostForm
        mode="edit"
        post={post}
        onCancel={handleCancelEdit}
        onSuccess={handleSaveEdit}
      />
    );
  }
  
  // Helper to render text with @mentions as profile links
  function renderTextWithMentions(text: string) {
    if (!text) return null;
    // Split by word boundaries, keep punctuation
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith('@') && part.length > 1 && /^@[\w.]+$/.test(part)) {
        const username = part.slice(1);
        return (
          <Link key={i} href={`/profile/${username}`} className="text-primary hover:underline">
            {part}
          </Link>
        );
      }
      return part;
    });
  }
  
  return (
    <>
      <Card className='w-full  gap-4 shadow-none dark:border-transparent'>
          <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Link href={`/profile/${createdBy?.username}`} className='relative'>
                  <UserAvatar src={createdBy?.avatar} firstName={createdBy?.firstName} />
                  {!isBlocked(createdBy?._id || '') && !isBlockedBy(createdBy?._id || '') && (
                    <span
                      className={
                        `absolute bottom-0.5 end-0.5 w-3 h-3 rounded-full border-2 border-card ` +
                        (status === 'online' ? 'bg-primary' : 'bg-gray-400')
                      }
                      title={status.charAt(0).toUpperCase() + status.slice(1)}
                    />
                  )}
                </Link>
                <div>
                  <div className='align-middle'>
                    <Link href={`/profile/${createdBy?.username}`} className='text-lg font-medium me-1'>
                      {createdBy?.firstName || ''}  {createdBy?.lastName || ''}
                    </Link>
                    {createdBy?.role === 'admin' && (
                      <AdminBadge role={createdBy?.role} size='sm' />
                    )}
                  </div>
                  <div className='flex items-center font-light gap-2'>
                    <Link href={`/profile/${createdBy?.username}`} className='text-sm text-muted-foreground'>@{createdBy?.username || ''}
                    </Link>
                    <div className='w-1 h-1 bg-primary rounded-full' />
                    <Link href={`/posts/${_id}`} className="hover:underline text-primary">
                      <p className='text-sm text-primary'>{createdAt ? new Date(createdAt).toLocaleString() : ''}</p>
                    </Link>
                  </div>
                </div>
              </CardTitle>
              <CardAction>
                {user && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className='cursor-pointer outline-none'>
                      <EllipsisVerticalIcon className='size-4 text-muted-foreground' />
                    </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        {user?._id === createdBy?._id && (
                          <>
                            <DropdownMenuItem className='cursor-pointer' onClick={handleEdit}>
                              <PencilIcon className='size-4' />
                              { t('edit') }
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className='cursor-pointer' 
                              onClick={handleDelete}
                            >
                              <TrashIcon className='size-4' />
                              { t('delete') }
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem className='cursor-pointer'>
                          <FlagIcon className='size-4' />
                          { t('report') }
                        </DropdownMenuItem>
                        {user?._id !== createdBy?._id && (
                          <DropdownMenuItem asChild className='cursor-pointer'>
                            <div className='flex items-center gap-2'>
                              <UserX className='size-4' />
                              <BlockButton
                                targetUserId={createdBy?._id || ''}
                                targetUsername={createdBy?.username}
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
                )}
              </CardAction>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <ReadMore
              text={text || ''}
              maxLength={150}
              readMoreText="Read More"
              readLessText="Read Less"
              render={renderTextWithMentions}
            />
                
            { image && <Image src={image} alt={text || ''} width={500} height={500} className='w-full max-h-96 rounded-lg object-cover' /> }
            { video && <VideoPlayer source={video} /> }
            { code && <CodeBlock
              code={ code }
              language={ codeLang }
            /> }
            { tags && <Tags tags={ tags } /> }
          </CardContent>
          <CardFooter className='flex flex-col items-start gap-3'>
            <div className='flex items-center gap-4 w-full'>
              <ReactionMenu 
                postId={_id}
                reactions={reactions}
                userReactions={normalizedUserReactions}
                currentUserId={createdBy?._id as string}
              />
              <button 
                onClick={ toggleComments }
                data-comments-toggle
                className='flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
              >
                <MessageCircleMore className='size-5' />
                {(commentsCount > 0 || hasAiSuggestions) && <span className="text-sm font-medium">{commentsCount + (hasAiSuggestions ? 1 : 0)}</span>}
              </button>
              <SendIcon className='size-5 text-muted-foreground hidden' />
              {hasAiSuggestions && (
                <span className='ms-auto'>
                  <BotIcon className='size-5 text-primary' />
                </span>
              )}
            </div>
            <div className={`w-full border-t border-border pt-4 ${showComments ? 'block' : 'hidden'}`}>
              {commentsLoading ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-[100px] bg-muted"></div>
                      <div className="h-4 w-[60px] bg-muted"></div>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-muted"></div>
                  <div className="h-4 w-2/3 bg-muted"></div>
                </div>
              ) : (
                <CommentSection 
                  postId={_id} 
                  hasAiSuggestions={hasAiSuggestions} 
                  highlightedCommentId={highlightedCommentId}
                  highlightedReplyId={highlightedReplyId}
                  postText={text}
                  postCode={code}
                  postCodeLang={codeLang}
                />
              )}
            </div>
          </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone and will permanently remove the post and all its comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting} className='cursor-pointer'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={isDeleting}
              className="bg-danger hover:bg-danger/90 cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Post'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})

export default Post 