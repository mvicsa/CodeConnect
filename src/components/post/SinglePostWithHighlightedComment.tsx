'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { PostType } from '@/types/post';
import Post from './Post';
import { Skeleton } from '../ui/skeleton';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { fetchComments, fetchReplies } from '@/store/slices/commentsSlice';
import { fetchPostById } from '@/store/slices/postsSlice';

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
  
  // Get the ID we're looking for (either comment or reply)
  const targetId = highlightedCommentId || highlightedReplyId;

  // Get posts and comments from store
  const { posts } = useSelector((state: RootState) => state.posts);
  const { comments } = useSelector((state: RootState) => state.comments);
  
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

  // Step 2: Load comments and replies after post is loaded
  useEffect(() => {
    const loadCommentsAndReplies = async () => {
      if (!post) return;
      
      setCommentsLoading(true);
      try {
        // 1. Load all comments for this post
        const commentsResult = await dispatch(fetchComments(postId)).unwrap();
        
        // 2. If we have a target ID, load all replies for all comments
        if (targetId) {
          // First check if the target ID is a comment
          const isDirectComment = commentsResult.some(comment => comment._id === targetId);
          
          if (isDirectComment) {
            setTargetIdType('comment');
          } else {
            // If not a direct comment, it might be a reply - load all replies to check
            setTargetIdType('reply');
            
            // Load replies for all comments to find the parent
            const loadPromises = commentsResult.map(async (comment) => {
              const replies = await dispatch(fetchReplies(comment._id)).unwrap();
              console.log('replies', replies);
              // Check if this comment contains our target reply
              const hasTargetReply = replies.some(reply => reply._id === targetId);
              if (hasTargetReply) {
                setParentCommentId(comment._id);
              }
              
              return replies;
            });
            
            await Promise.all(loadPromises);
          }
        }
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    };

    if (post) {
      loadCommentsAndReplies();
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
  }, [comments, targetId, targetIdType]);

  // Scroll to the target element when it's loaded
  useEffect(() => {
    if (!postLoading && !commentsLoading && targetId) {
      // Small delay to ensure the element is rendered
      const timer = setTimeout(() => {
        const elementId = `comment-${targetId}`;
        const element = document.getElementById(elementId);
        
        if (element) {
          // Scroll to the element
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.warn(`Element with ID ${elementId} not found.`);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [postLoading, commentsLoading, targetId]);

  // Show loading state only during initial post loading
  if (postLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
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
        <AlertTitle>{t('notFound')}</AlertTitle>
        <AlertDescription>{t('postNotFound')}</AlertDescription>
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
        highlightedCommentId={targetIdType === 'comment' ? targetId : undefined}
        highlightedReplyId={targetIdType === 'reply' ? targetId : undefined}
        commentsLoading={commentsLoading}
      />
    </div>
  );
} 