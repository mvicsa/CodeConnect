'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

// Dynamically import the client component
const SinglePostView = dynamic(() => import('./SinglePostView'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
});

interface SinglePostClientProps {
  postId: string;
}

export default function SinglePostClient({ postId }: SinglePostClientProps) {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    }>
      <SinglePostView postId={postId} />
    </Suspense>
  );
} 