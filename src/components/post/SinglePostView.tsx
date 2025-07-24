'use client';

import React, { useEffect, useState } from 'react';
import { PostType } from '@/types/post';
import Post from './Post';
import { Skeleton } from '../ui/skeleton';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface SinglePostViewProps {
  postId: string;
}

export default function SinglePostView({ postId }: SinglePostViewProps) {
  const t = useTranslations();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the token from local storage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        // Replace this with your actual API call
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch post: ${response.status}`);
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(t('errorFetchingPost'));
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, token, t]);

  if (loading) {
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

  return <Post post={post} />;
} 