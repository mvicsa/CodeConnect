'use client'

import { useState, useEffect, memo, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchComments, addCommentAsync } from '@/store/slices/commentsSlice'
import CommentItem from './CommentItem'
import CommentEditor from './CommentEditor'
import { MessageCircle } from 'lucide-react'
import { Comment, CommentContent } from '@/types/comments'

interface CommentSectionProps {
  postId: string
  className?: string
}

const CommentSection = memo(function CommentSection({ postId, className = '' }: CommentSectionProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { comments, loading } = useSelector((state: RootState) => state.comments)
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null)
  const [mentionUser, setMentionUser] = useState('')

  // Filter comments for this specific post - memoize to prevent unnecessary re-renders
  const postComments = useMemo(() => 
    comments.filter(comment => comment.postId === postId), 
    [comments, postId]
  )

  useEffect(() => {
    // Fetch comments when component mounts
    dispatch(fetchComments())
  }, [dispatch])

  const handleAddComment = async (content: CommentContent) => {
    try {
      const newComment: Omit<Comment, 'id'> = {
        postId,
        user: { name: 'You', username: 'you' },
        content,
        createdAt: new Date(),
        reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 },
        userReactions: [],
        replies: []
      }

      await dispatch(addCommentAsync(newComment))
      console.log('Comment added successfully')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-20 bg-muted rounded-lg mb-4"></div>
          <div className="space-y-4">
            <div className="h-16 bg-muted rounded-lg"></div>
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comment Form */}
      <CommentEditor
        initialValue={{ text: '' }}
        onSubmit={handleAddComment}
        placeholder="Write a comment..."
      />

      {/* Comments List */}
      <div className="space-y-4">
        {postComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            activeReplyId={activeReplyId}
            setActiveReplyId={(id) => setActiveReplyId(id as number | null)}
            mentionUser={mentionUser}
            setMentionUser={setMentionUser}
          />
        ))}
      </div>

      {/* No Comments */}
      {postComments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="size-8 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
})

export default CommentSection 