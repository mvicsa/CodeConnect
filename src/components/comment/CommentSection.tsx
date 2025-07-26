'use client'

import { useState, useEffect, memo, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchComments, addCommentAsync, fetchReplies } from '@/store/slices/commentsSlice'
import { fetchCodeSuggestions } from '@/store/slices/aiSuggestionsSlice'
import CommentItem from './CommentItem'
import CommentEditor from './CommentEditor'
import { MessageCircle, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import CommentAI from './CommentAI'
import { useBlock } from '@/hooks/useBlock'

interface CommentSectionProps {
  postId: string;
  className?: string;
  hasAiSuggestions?: boolean;
  highlightedCommentId?: string;
  highlightedReplyId?: string;
  postText: string;
  postCode?: string;
  postCodeLang?: string;
}

const CommentSection = memo(function CommentSection({ 
  postId, 
  className = '',
  hasAiSuggestions = false,
  highlightedCommentId,
  highlightedReplyId,
  postText,
  postCode,
  postCodeLang
}: CommentSectionProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { comments, loading } = useSelector((state: RootState) => state.comments)
  const { suggestions } = useSelector((state: RootState) => state.aiSuggestions)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [mentionUser, setMentionUser] = useState('')
  const [visibleComments, setVisibleComments] = useState(3) // Show 3 comments initially
  const [showHighlight, setShowHighlight] = useState(true)
  const [parentCommentId, setParentCommentId] = useState<string | null>(null)

  const user = useSelector((state: RootState) => state.auth.user)
  const { checkBlockStatus } = useBlock()
  const checkBlockStatusRef = useRef(checkBlockStatus)

  // Update ref when checkBlockStatus changes
  useEffect(() => {
    checkBlockStatusRef.current = checkBlockStatus
  }, [checkBlockStatus])

  // Filter comments for this specific post
  const postComments = useMemo(() => {
    return comments.filter(comment => comment.postId === postId);
  }, [comments, postId]);

  // Find parent comment ID if we have a highlighted reply
  useEffect(() => {
    if (highlightedReplyId) {
      // First, check if we already have the reply loaded in any comment
      let foundParent = false;
      
      for (const comment of postComments) {
        if (comment.replies && comment.replies.some(reply => reply?._id === highlightedReplyId)) {
          setParentCommentId(comment._id);
          foundParent = true;
          break;
        }
      }
      
      // If we haven't found the parent comment yet, load replies for all comments
      if (!foundParent) {
        // Load replies for all comments to find the parent
        postComments.forEach(comment => {
          dispatch(fetchReplies(comment._id))
            .unwrap()
            .then(replies => {
              // Check if this comment contains our target reply
              if (replies.some(reply => reply._id === highlightedReplyId)) {
                setParentCommentId(comment._id);
              }
            })
            .catch(error => {
              console.error(`Failed to load replies for comment ${comment._id}:`, error);
            });
        });
      }
    }
  }, [highlightedReplyId, postComments, dispatch]);

  // Check block status for all comment authors when comments change
  useEffect(() => {
    if (postComments.length > 0) {
      // Get unique author IDs from comments
      const authorIds = [...new Set(postComments.map(comment => comment.createdBy._id).filter(Boolean))]
      
      // Check block status for each author immediately
      authorIds.forEach(authorId => {
        if (authorId) {
          // Check immediately without debouncing for better UX
          checkBlockStatusRef.current(authorId)
        }
      })
    }
  }, [postComments]);

  // Reorder comments to put highlighted comment or parent of highlighted reply first
  const orderedComments = useMemo(() => {
    // If no highlighted comment or reply, return normal order
    if (!highlightedCommentId && !parentCommentId) return postComments;
    
    let priorityCommentId = highlightedCommentId;
    
    // If we have a highlighted reply, prioritize its parent comment
    if (parentCommentId) {
      priorityCommentId = parentCommentId;
    }
    
    // Find the comment to prioritize
    const priorityComment = postComments.find(comment => comment._id === priorityCommentId);
    if (!priorityComment) return postComments;
    
    // Return array with priority comment first, followed by all other comments
    return [
      priorityComment,
      ...postComments.filter(comment => comment._id !== priorityCommentId)
    ];
  }, [postComments, highlightedCommentId, parentCommentId]);

  // Make sure all comments are visible if we have a highlighted comment or reply
  useEffect(() => {
    if (highlightedCommentId || highlightedReplyId) {
      // Show all comments when there's a highlighted comment or reply
      setVisibleComments(postComments.length);
    }
  }, [highlightedCommentId, highlightedReplyId, postComments]);

  // Remove highlight after 5 seconds
  useEffect(() => {
    if ((highlightedCommentId || highlightedReplyId) && showHighlight) {
      const timer = setTimeout(() => {
        setShowHighlight(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedCommentId, highlightedReplyId, showHighlight]);

  // Get visible comments based on pagination
  const visibleCommentsList = useMemo(() => {
    return orderedComments.slice(0, visibleComments);
  }, [orderedComments, visibleComments]);

  // Check if there are more comments to load
  const hasMoreComments = orderedComments.length > visibleComments

  useEffect(() => {
    // Fetch comments when component mounts
    dispatch(fetchComments(postId))
      .unwrap()
      .then()
      .catch(error => {
        console.error('Failed to fetch comments:', error);
      });
      
    // Fetch AI suggestions if the post has them
    if (hasAiSuggestions) {
      dispatch(fetchCodeSuggestions(postId))
        .unwrap()
        .then()
        .catch(error => {
          console.error('Failed to fetch AI suggestions:', error);
        });
    }
  }, [dispatch, postId, hasAiSuggestions]);

  const handleAddComment = async (content: { text: string, code: string, codeLang: string }) => {
    try {
      if (!user || typeof user._id !== 'string') return; // Ensure user._id is a string
      const newComment = {
        postId: postId, // use the prop directly
        createdBy: user._id,
        text: content.text,
        code: content.code,
        codeLang: content.codeLang,
        createdAt: new Date(),
        reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 },
        userReactions: []
      }
      await dispatch(addCommentAsync(newComment))
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
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Comment Form */}
      { user && (
        <CommentEditor
          initialValue={{ text: '', code: '', codeLang: '' }}
          onSubmit={handleAddComment}
          placeholder="Write a comment..."
        />
      )}

      {/* AI Suggestions */}
      {hasAiSuggestions && (
        <CommentAI
          suggestion={suggestions[postId]}
          postId={postId}
        />
      )}
      
      {/* Comments List */}
      {postComments.length > 0 && (
        <div className="space-y-4">
          {visibleCommentsList.map((comment) => (
            <div 
              key={comment._id} 
              id={`comment-${comment._id}`}
              className="relative"
            >
              { highlightedCommentId === comment._id && showHighlight && (
                <div className="absolute top-[-0.5rem] left-[-0.5rem] w-[calc(100%+1rem)] h-[calc(100%+1rem)] bg-primary/10 z-1 border-s-2 border-primary transition-opacity duration-500 rounded-lg"></div>
              )}
              <CommentItem
                comment={comment}
                activeReplyId={activeReplyId}
                setActiveReplyId={(id) => setActiveReplyId(id)}
                mentionUser={mentionUser}
                setMentionUser={setMentionUser}
                highlightedReplyId={highlightedReplyId}
                showHighlight={showHighlight}
                postText={postText}
                postCode={postCode}
                postCodeLang={postCodeLang}
              />
            </div>
          ))}
        </div>
      )}

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
            Load More Comments ({orderedComments.length - visibleComments} more)
          </Button>
        </div>
      )}

      {/* No Comments */}
      {postComments.length + (hasAiSuggestions ? 1 : 0) === 0 && !loading && (
        <div className="text-center py-6 text-muted-foreground">
          <MessageCircle className="size-8 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
})

export default CommentSection
