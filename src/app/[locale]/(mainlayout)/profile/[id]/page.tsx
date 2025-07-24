'use client'

import ProfilePageClient from '@/components/profile/ProfilePageClient';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserByUsername } from '@/store/slices/userSlice';
import { AppDispatch, RootState } from '@/store/store';
import { Loader2 } from 'lucide-react';
import { User } from '@/types/comments';

const Page = () => {
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { data: user, loading, error } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (typeof params.id === 'string') {
      dispatch(fetchUserByUsername(params.id));
    }
  }, [dispatch, params.id]);

  if (loading) return <div className="text-center mt-10 flex items-center justify-center">
    <Loader2 className='w-10 h-10 animate-spin' />
  </div>;

  if (error) return <div className="text-center mt-10 text-red-500">{String(error)}</div>;
  if (!user) return null;

  return <ProfilePageClient user={user as User} />;
};

export default Page;
