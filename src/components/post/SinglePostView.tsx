'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchPostById } from '@/store/slices/postsSlice';
import Post from './Post';
import { Skeleton } from '../ui/skeleton';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useBlock } from '@/hooks/useBlock';
import PostBlockStatusChecker from './PostBlockStatusChecker';

interface SinglePostViewProps {
  postId: string;
}

export default function SinglePostView({ postId }: SinglePostViewProps) {
  const t = useTranslations();
  const dispatch = useDispatch<AppDispatch>();
  const { posts, loading, error } = useSelector((state: RootState) => state.posts);
  const { loading: blockLoading } = useBlock();
  
  // Find the post in the Redux store
  const post = posts.find(p => p._id === postId) || null;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Always fetch the post to ensure we have the latest data
        await dispatch(fetchPostById(postId)).unwrap();
      } catch (err) {
        console.error('Error fetching post:', err);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, dispatch]);

  // Show skeleton while loading post or block data
  if (loading || blockLoading) {
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

  if (!post && !loading) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Post not found</AlertTitle>
        <AlertDescription>The post you are looking for does not exist.</AlertDescription>
      </Alert>
    );
  }

  return post ? (
    <>
      <PostBlockStatusChecker post={post} />
      <Post post={post} />
    </>
  ) : null;
} 