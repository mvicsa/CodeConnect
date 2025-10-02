'use client'

import ProfilePageClient from '@/components/profile/ProfilePageClient';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserByUsername } from '@/store/slices/userSlice';
import { AppDispatch, RootState } from '@/store/store';
import { User } from '@/types/comments';
import BlockStatusChecker from '@/components/BlockStatusChecker';
import { ProfileHeaderSkeleton, ProfileSidebarSkeleton } from '@/components/profile/ProfileSkeleton';
import { PostSkeleton } from '@/components/post/PostSkeleton';

const Page = () => {
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { data: user, loading, error } = useSelector((state: RootState) => state.user);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (typeof params.id === 'string') {
      dispatch(fetchUserByUsername(params.id));
    }
  }, [dispatch, params.id]);

  // Update initial loading when user data is available
  useEffect(() => {
    if (user && !loading) {
      setInitialLoading(false);
    } else {
      setInitialLoading(true);
    }
  }, [user, loading]);

  // Set initial loading to false if no user data
  useEffect(() => {
    if (!user && !loading) {
      setInitialLoading(false);
    }
  }, [user, loading]);

  if (loading || initialLoading) return (
    <div className='max-w-screen-lg mx-auto px-4'>
      <div className='space-y-4 w-full'>
        <ProfileHeaderSkeleton />
        <div className="grid grid-cols-16 gap-4">
          <ProfileSidebarSkeleton />
          <div className="col-span-16 md:col-span-11">
            <div className="grid w-full grid-cols-2 mb-2 gap-1 p-1 rounded-lg bg-card">
              <div className="h-7 w-full rounded-md bg-accent animate-pulse" />
              <div className="h-7 w-full rounded-md bg-accent animate-pulse" />
            </div>
            <div className="space-y-4 mt-4">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return <div className="text-center mt-10 text-red-500">{String(error)}</div>;
  if (!user) return null;

  return (
    <>
      <BlockStatusChecker />
      <ProfilePageClient user={user as User} />
    </>
  );
};

export default Page;
