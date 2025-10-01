'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { PostSkeleton } from './PostSkeleton';

// Dynamically import the client component
const SinglePostView = dynamic(() => import('./SinglePostView'), {
  ssr: false,
  loading: () => (
    <PostSkeleton />
  )
});

interface SinglePostClientProps {
  postId: string;
}

export default function SinglePostClient({ postId }: SinglePostClientProps) {
  return (
    <Suspense fallback={
      <PostSkeleton />
    }>
      <SinglePostView postId={postId} />
    </Suspense>
  );
} 