'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { PostType } from '@/types/post';
import Post from './Post';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { fetchComments, getCommentContext, fetchReplies } from '@/store/slices/commentsSlice';
import { fetchPostById } from '@/store/slices/postsSlice';
import PostSkeleton from './PostSkeleton';
import { COMMENT_LIMIT, REPLY_LIMIT } from '@/constants/comments';

interface SinglePostWithHighlightedCommentProps {
  postId: string;
  highlightedCommentId?: string;
  highlightedReplyId?: string;
}

export default function SinglePostWithHighlightedComment({ 
  postId, 
  highlightedCommentId,
  highlightedReplyId
}: SinglePostWithHighlightedCommentProps) {
  const t = useTranslations('PostPage');
  const dispatch = useDispatch<AppDispatch>();
  const [post, setPost] = useState<PostType | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentCommentId, setParentCommentId] = useState<string | null>(null);
  const [targetIdType, setTargetIdType] = useState<'comment' | 'reply' | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  
  // Get the ID we're looking for (either comment or reply)
  const targetId = highlightedCommentId || highlightedReplyId;

  // Get posts and comments from store
  const { posts } = useSelector((state: RootState) => state.posts);
  const { comments } = useSelector((state: RootState) => state.comments);
  
  // Reset scroll flag when targetId changes
  useEffect(() => {
    setHasScrolled(false);
  }, [targetId]);

  // Step 1: Load the post first
  useEffect(() => {
    const loadPost = async () => {
      setPostLoading(true);
      setError(null);

      try {
        // Check if the post is already in the Redux store
        const existingPost = posts.find(p => p._id === postId);
        if (existingPost) {
          setPost(existingPost);
        } else {
          // If not in store, fetch it directly
          const result = await dispatch(fetchPostById(postId)).unwrap();
          setPost(result);
        }
      } catch (err) {
        console.error('Error loading post:', err);
        setError(t('errorFetchingPost'));
      } finally {
        setPostLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId, dispatch, t, posts]);

  // Step 2: Load comments with highlighting
  useEffect(() => {
    const loadCommentsWithHighlight = async () => {
      if (!post) return;
      
      setCommentsLoading(true);
      try {
        if (targetId) {
          // First get comment context to understand what we're highlighting
          try {
            const context = await dispatch(getCommentContext(targetId)).unwrap();
            
            if (context.isReply) {
              setTargetIdType('reply');
              setParentCommentId(context.parentComment?._id || null);
            } else {
              setTargetIdType('comment');
              setParentCommentId(targetId);
            }
            
            if (context.isReply && context.parentComment?._id) {
              // For highlighted reply: load parent comment first, then its replies
              await dispatch(fetchComments({ 
                postId, 
                offset: 0, 
                limit: COMMENT_LIMIT, // Normal comments load
                highlight: context.parentComment._id // Highlight the parent comment
              }));
              
              // Then load the parent comment's replies with highlighted reply
              await dispatch(fetchReplies({ 
                parentCommentId: context.parentComment._id, 
                offset: 0, 
                limit: REPLY_LIMIT, // Small limit - backend will add highlighted reply to this
                highlight: context.parentComment._id === context.comment.parentCommentId ? targetId : undefined
              }));

              console.log('🔥 Parent comment:', context.parentComment);

            } else {
              // For highlighted comment: normal load
              await dispatch(fetchComments({ 
                postId, 
                offset: 0, 
                limit: COMMENT_LIMIT, // Normal limit - backend will add highlighted comment to this
                highlight: targetId 
              }));
            }
            
          } catch (error) {
            console.error('Comment context not found:', error);
            // Fallback: load normal comments
            await dispatch(fetchComments({ postId, offset: 0, limit: COMMENT_LIMIT }));
          }
        } else {
          // No highlighting needed
          await dispatch(fetchComments({ postId, offset: 0, limit: COMMENT_LIMIT }));
        }
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    };

    if (post) {
      loadCommentsWithHighlight();
    }
  }, [post, postId, targetId, dispatch]);

  // Check if the target ID exists in any comment or reply - memoize to prevent infinite renders
  const targetExists = React.useMemo(() => {
    if (!targetId) return true;
    
    if (targetIdType === 'comment') {
      return comments.some(comment => comment._id === targetId);
    }
    
    if (targetIdType === 'reply') {
      return comments.some(comment => comment._id === parentCommentId);
    }
    
    return false;
  }, [comments, targetId, targetIdType, parentCommentId]);

  // Scroll to the target element when it's loaded
  useEffect(() => {
    if (!postLoading && !commentsLoading && targetId && !hasScrolled) {
      const scrollToHighlightedComment = () => {
        const elementId = `comment-${targetId}`;
        const element = document.getElementById(elementId);
        
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          setHasScrolled(true);
        }
      };

      // Small delay to ensure the element is rendered
      const timer = setTimeout(scrollToHighlightedComment, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [postLoading, commentsLoading, targetId, hasScrolled]);

  // Show loading state only during initial post loading
  if (postLoading) {
    return (
      <PostSkeleton />
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('error')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!post) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Post not found</AlertTitle>
        <AlertDescription>The post you are looking for does not exist.</AlertDescription>
      </Alert>
    );
  }
  
  // Only show not found message if we've finished loading everything and the target doesn't exist
  if (targetId && !targetExists && !commentsLoading) {
    return (
      <div>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('commentNotFound')}</AlertTitle>
          <AlertDescription>{t('commentNotFoundDescription')}</AlertDescription>
        </Alert>
        <div data-post-id={postId}>
          <Post post={post} initialShowComments={true} />
        </div>
      </div>
    );
  }

  // Always render the post once it's loaded, even if comments are still loading
  
  return (
    <div data-post-id={postId}>
      <Post 
        post={post} 
        initialShowComments={true} 
        highlightedCommentId={
          targetIdType === 'comment' ? targetId : parentCommentId || undefined
        }
        highlightedReplyId={targetIdType === 'reply' ? targetId : undefined}
        commentsLoading={commentsLoading}
      />
    </div>
  );
}