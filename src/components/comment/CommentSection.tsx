'use client'

import { useState, useEffect, memo, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchComments, addCommentAsync, updateVisibleCount } from '@/store/slices/commentsSlice'
import { fetchCodeSuggestions } from '@/store/slices/aiSuggestionsSlice'
import CommentItem from './CommentItem'
import CommentEditor from './CommentEditor'
import { MessageCircle, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import CommentAI from './CommentAI'
import { useBlock } from '@/hooks/useBlock'
import CommentSkeleton from './CommentSkeleton'
import { Comment } from '@/types/comments'
import { COMMENT_LIMIT } from '@/constants/comments';
import { toast } from 'sonner'

interface CommentSectionProps {
  postId: string;
  className?: string;
  hasAiSuggestions?: boolean;
  highlightedCommentId?: string;
  highlightedReplyId?: string;
  postText: string;
  postCode?: string;
  postCodeLang?: string;
  autoLoad?: boolean;
}

const CommentSection = memo(function CommentSection({ 
  postId, 
  className = '',
  hasAiSuggestions = false,
  highlightedCommentId,
  highlightedReplyId,
  postText,
  postCode,
  postCodeLang,
  autoLoad = true
}: CommentSectionProps) {
  
  const dispatch = useDispatch<AppDispatch>()
  const { comments, hasMore, totalCommentsCount, visibleCounts } = useSelector((state: RootState) => state.comments)
  const { suggestions } = useSelector((state: RootState) => state.aiSuggestions)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [mentionUser, setMentionUser] = useState('')
  
  // Get current post comments (main comments only)
  const currentPostComments = useMemo(() => {
    return comments.filter(comment => comment.postId === postId);
  }, [comments, postId]);
  
  // Get visibleComments from Redux store or default to COMMENT_LIMIT
  const visibleComments = Math.min(visibleCounts[postId] || COMMENT_LIMIT, Math.max(currentPostComments.length, COMMENT_LIMIT));
  const [showHighlight, setShowHighlight] = useState(true)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [aiSuggestionsLoaded, setAiSuggestionsLoaded] = useState(false)
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([])

  const user = useSelector((state: RootState) => state.auth.user)
  const { checkBlockStatus, isBlocked } = useBlock()
  const checkBlockStatusRef = useRef(checkBlockStatus)
  const checkedAuthorsRef = useRef<Set<string>>(new Set())

  // Update ref when checkBlockStatus changes
  useEffect(() => {
    checkBlockStatusRef.current = checkBlockStatus
  }, [checkBlockStatus])

  // Filter comments for this specific post and exclude blocked users
  const postComments = useMemo(() => {
    const realComments = currentPostComments.filter(comment => !isBlocked(comment.createdBy._id));
    
    // Combine real comments with optimistic comments
    return [...optimisticComments, ...realComments];
  }, [currentPostComments, isBlocked, optimisticComments]);

  // Check block status for all comment authors and reply authors when comments change
  useEffect(() => {
    if (postComments.length > 0) {
      // Get unique author IDs from comments
      const commentAuthorIds = [...new Set(postComments.map(comment => comment.createdBy._id).filter(Boolean))]
      
      // Get unique author IDs from replies
      const replyAuthorIds = postComments.flatMap(comment => 
        (comment.replies || []).map(reply => reply?.createdBy._id).filter(Boolean)
      )
      
      // Combine and remove duplicates
      const allAuthorIds = [...new Set([...commentAuthorIds, ...replyAuthorIds])]
      
      // Only check authors we haven't checked before
      const uncheckedAuthors = allAuthorIds.filter(authorId => authorId && !checkedAuthorsRef.current.has(authorId))
      
      if (uncheckedAuthors.length > 0) {
        // Check block status for each unchecked author
        uncheckedAuthors.forEach(authorId => {
          if (authorId) {
            checkBlockStatusRef.current(authorId)
          }
        })
        
        // Update the set of checked authors
        uncheckedAuthors.forEach(authorId => {
          checkedAuthorsRef.current.add(authorId)
        })
      }
    }
  }, [postComments]);

  // Comments are already ordered by backend with highlighted comment first
  const orderedComments = useMemo(() => {
    return postComments;
  }, [postComments]);

  // Make sure all comments are visible if we have a highlighted comment or reply
  useEffect(() => {
    const hasHighlightedComment = postComments.some(comment => comment.isHighlighted);
    const hasHighlightedReply = postComments.some(comment => 
      comment.replies?.some(reply => reply.isHighlighted)
    );
    
    if (hasHighlightedComment || hasHighlightedReply) {
      // Show all comments when there's a highlighted comment or reply
      dispatch(updateVisibleCount({ postId, count: postComments.length }));
    }
  }, [postComments, dispatch, postId]);

  // Remove highlight after 5 seconds
  useEffect(() => {
    const hasHighlightedComment = postComments.some(comment => comment.isHighlighted);
    const hasHighlightedReply = postComments.some(comment => 
      comment.replies?.some(reply => reply.isHighlighted)
    );
    
    if ((hasHighlightedComment || hasHighlightedReply) && showHighlight) {
      const timer = setTimeout(() => {
        setShowHighlight(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [postComments, showHighlight]);

  // Get visible comments based on pagination
  const visibleCommentsList = useMemo(() => {
    return orderedComments.slice(0, visibleComments);
  }, [orderedComments, visibleComments]);

  // Calculate loaded main comments count (not including replies)
  const loadedMainCommentsCount = useMemo(() => {
    return currentPostComments.length;
  }, [currentPostComments]);
  
  // Use hasMore flag from backend directly
  const hasMoreComments = hasMore[postId] ?? false;
  
  // Calculate remaining comments to display
  const remainingCommentsDisplay = useMemo(() => {
    // Use totalCommentsCount from backend (main comments only)
    const total = totalCommentsCount[postId] ?? 0;
    const remaining = Math.max(0, total - loadedMainCommentsCount);
    
    return remaining;
  }, [totalCommentsCount, postId, loadedMainCommentsCount]);

  useEffect(() => {
    // Only fetch comments if autoLoad is true
    if (autoLoad) {
      setIsLoadingComments(true);
      setShowSkeleton(true);
      
      dispatch(fetchComments({ postId, offset: 0, limit: COMMENT_LIMIT }))
        .unwrap()
        .then(() => {
          setIsLoadingComments(false);
          
          // Fetch AI suggestions after comments are loaded
          if (hasAiSuggestions) {
            dispatch(fetchCodeSuggestions(postId))
              .unwrap()
              .then(() => {
                setAiSuggestionsLoaded(true);
                setShowSkeleton(false);
              })
              .catch(() => {
                toast.error('Failed to fetch AI suggestions');
                setAiSuggestionsLoaded(true);
                setShowSkeleton(false);
              });
          } else {
            setAiSuggestionsLoaded(true);
            setShowSkeleton(false);
          }
        })
        .catch(() => {
          toast.error('Failed to fetch comments');
          setIsLoadingComments(false);
          setShowSkeleton(false);
        });
    }
  }, [postId, hasAiSuggestions, autoLoad, dispatch]);

  const handleAddComment = async (content: { text: string, code: string, codeLang: string }) => {
    try {
      if (!user || typeof user._id !== 'string') return;
      
      // Create optimistic comment
      const optimisticComment: Comment = {
        _id: `temp-${Date.now()}`,
        postId: postId,
        createdBy: {
          _id: user._id,
          username: user.username || '',
          email: user.email || '',
          firstName: (user.firstName as string) || 'User',
          lastName: (user.lastName as string) || '',
          avatar: (user.avatar as string) || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        text: content.text,
        code: content.code,
        codeLang: content.codeLang,
        createdAt: new Date(),
        reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 },
        userReactions: [],
        replies: [],
        repliesCount: 0
      }
      
      // Add optimistic comment immediately
      setOptimisticComments(prev => [optimisticComment, ...prev])
      
      // Send to backend
      const newComment = {
        postId: postId,
        createdBy: user._id,
        text: content.text,
        code: content.code,
        codeLang: content.codeLang,
        createdAt: new Date(),
        reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 },
        userReactions: []
      }
      
      await dispatch(addCommentAsync(newComment))
      
      // Remove optimistic comment after successful save
      setOptimisticComments(prev => prev.filter(c => c._id !== optimisticComment._id))
      
    } catch {
      toast.error('Failed to add comment');
      // Remove optimistic comment on error
      setOptimisticComments(prev => prev.filter(c => c._id !== `temp-${Date.now()}`))
    }
  }

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    
    // Calculate offset based on loaded main comments
    const currentLoadedCount = loadedMainCommentsCount;
    let parentCommentIdForHighlight;
    
    if (highlightedReplyId) {
      // For highlighted reply: find the parent comment that contains the highlighted reply
      const parentComment = currentPostComments.find(comment => 
        comment.replies?.some(reply => reply._id === highlightedReplyId)
      );
      parentCommentIdForHighlight = parentComment?._id;
    } else if (highlightedCommentId) {
      // For highlighted comment: use the comment ID itself
      parentCommentIdForHighlight = highlightedCommentId;
    }
    
    // Fetch more comments from API with highlight parameter
    dispatch(fetchComments({ 
      postId, 
      offset: currentLoadedCount, 
      limit: COMMENT_LIMIT,
      highlight: parentCommentIdForHighlight
    }))
      .unwrap()
      .then(() => {
        setIsLoadingMore(false);
      })
      .catch(() => {
        toast.error('Failed to load more comments');
        setIsLoadingMore(false);
      });
  }

  if (showSkeleton) {
    return (
      <div className={`space-y-4 ${className}`}>
        <CommentSkeleton count={3} />
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Comment Form */}
      {user && (
        <CommentEditor
          initialValue={{ text: '', code: '', codeLang: '' }}
          onSubmit={handleAddComment}
          placeholder="Write a comment..."
        />
      )}

      {/* AI Suggestions */}
      {hasAiSuggestions && aiSuggestionsLoaded && (
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
              {!highlightedReplyId && comment.isHighlighted && showHighlight && (
                <div className="absolute top-[-0.5rem] left-[-0.5rem] w-[calc(100%+1rem)] h-[calc(100%+1rem)] bg-primary/10 z-1 border-s-2 border-primary transition-opacity duration-500 rounded-lg"></div>
              )}
              {/* Show skeleton for optimistic comments */}
              {comment._id.startsWith('temp-') ? (
                <CommentSkeleton count={1} />
              ) : (
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
              )}
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
            disabled={isLoadingMore}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="size-4 me-1" />
            Load More Comments ({remainingCommentsDisplay} more)
          </Button>
        </div>
      )}
      
      {/* Show loading skeleton for Load More */}
      {isLoadingMore && (
        <CommentSkeleton count={3} />
      )}

      {/* No Comments */}
      {postComments.length + (hasAiSuggestions ? 1 : 0) === 0 && !isLoadingComments && (
        <div className="text-center py-6 text-muted-foreground">
          <MessageCircle className="size-8 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
})

export default CommentSection