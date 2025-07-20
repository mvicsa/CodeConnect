import React, { memo, useState, useMemo } from 'react';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { BotIcon, EllipsisVerticalIcon, FlagIcon, MessageCircleMore, PencilIcon, SendIcon, TrashIcon } from 'lucide-react'
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
import AIBadge from '../AiBadge'

const Post = memo(function Post({ post }: { post: PostType }) {
  const { _id, text, image, video, code, codeLang, tags, createdBy, createdAt, reactions, userReactions, hasAiSuggestions } = post;
  const t = useTranslations();
  const dispatch = useDispatch<AppDispatch>();
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth)
  
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
      await dispatch(deletePost({ id: _id, token: localStorage.getItem('token') || '' })).unwrap();
      toast.success('Post deleted successfully!');
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete post.');
      console.error('Failed to delete post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };
  
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
  
  return (
    <>
      <Card className='w-full  gap-4 shadow-none dark:border-transparent'>
          <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Link href={`/profile/${createdBy?.username}`}>
                  <UserAvatar src={createdBy?.avatar} firstName={createdBy?.firstName} />
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
                    <p className='text-sm text-primary'>{createdAt ? new Date(createdAt).toLocaleString() : ''}</p>
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
                      </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardAction>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            { text && <p>{ text }</p> }
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
                userReactions={userReactions || []}
                currentUserId={createdBy?._id}
                currentUsername={createdBy?.username}
              />
              <button 
                onClick={ toggleComments }
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
              <CommentSection postId={_id} hasAiSuggestions={hasAiSuggestions} />
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