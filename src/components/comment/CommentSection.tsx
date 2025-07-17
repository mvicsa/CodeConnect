'use client'

import { useState, useEffect, memo, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchComments, addCommentAsync } from '@/store/slices/commentsSlice'
import CommentItem from './CommentItem'
import CommentEditor from './CommentEditor'
import { MessageCircle, ChevronDown } from 'lucide-react'
import { Comment } from '@/types/comments'
import { Button } from '../ui/button'

interface CommentSectionProps {
  postId: string
  className?: string
}

const CommentSection = memo(function CommentSection({ postId, className = '' }: CommentSectionProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { comments, loading } = useSelector((state: RootState) => state.comments)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [mentionUser, setMentionUser] = useState('')
  const [visibleComments, setVisibleComments] = useState(3) // Show 3 comments initially

  const user = useSelector((state: RootState) => state.auth.user)

  // Filter comments for this specific post
  const postComments = useMemo(() => {
    return comments.filter(comment => comment.postId === postId);
  }, [comments, postId]);

  // Get visible comments based on pagination
  const visibleCommentsList = useMemo(() => {
    return postComments.slice(0, visibleComments);
  }, [postComments, visibleComments]);

  // Check if there are more comments to load
  const hasMoreComments = postComments.length > visibleComments

  useEffect(() => {
    // Fetch comments when component mounts
    dispatch(fetchComments(postId))
      .unwrap()
      .then()
      .catch(error => {
        console.error('Failed to fetch comments:', error);
      });
  }, [dispatch, postId]);

  const handleAddComment = async (content: { text: string, code: string, codeLang: string }) => {
    try {
      const newComment = {
        postId: postId, // use the prop directly
        createdBy: user?._id,
        text: content.text,
        code: content.code,
        codeLang: content.codeLang,
        createdAt: new Date(),
        reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 },
        userReactions: []
      }
      await dispatch(addCommentAsync(newComment))
      console.log('Comment added successfully')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleLoadMore = () => {
    setVisibleComments(prev => prev + 3) // Load 3 more comments
  }

  if (loading && postComments.length === 0) {
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
      { user && (
        <CommentEditor
          initialValue={{ text: '', code: '', codeLang: '' }}
          onSubmit={handleAddComment}
          placeholder="Write a comment..."
        />
      )}
      {/* Comments List */}
      <div className="space-y-4 mt-4">
        {visibleCommentsList.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            activeReplyId={activeReplyId}
            setActiveReplyId={(id) => setActiveReplyId(id)}
            mentionUser={mentionUser}
            setMentionUser={setMentionUser}
          />
        ))}
      </div>

      {/* Load More Button */}
      {postComments.length > 0 && hasMoreComments && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="size-4 mr-1" />
            Load More Comments ({postComments.length - visibleComments} more)
          </Button>
        </div>
      )}

      {/* No Comments */}
      {postComments.length === 0 && !loading && (
        <div className="text-center py-6 text-muted-foreground">
          <MessageCircle className="size-8 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
})

export default CommentSection 