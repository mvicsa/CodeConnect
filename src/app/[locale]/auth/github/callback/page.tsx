'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { handleGitHubCallback } from '@/store/slices/authSlice';
import { AppDispatch } from '@/store/store';
import { Loader2 } from 'lucide-react';

export default function GitHubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      console.error('GitHub OAuth error:', error);
      router.push('/login?error=github-auth-failed');
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        dispatch(handleGitHubCallback({ token, user }))
          .unwrap()
          .then(() => {
            // Redirect to home page after successful authentication
            router.push('/');
          })
          .catch((error) => {
            console.error('GitHub callback error:', error);
            router.push('/login?error=github-callback-failed');
          });
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login?error=github-callback-failed');
      }
    } else {
      router.push('/login?error=github-callback-failed');
    }
  }, [searchParams, dispatch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Completing GitHub Login</h2>
        <p className="text-muted-foreground">Please wait while we complete your authentication...</p>
      </div>
    </div>
  );
} 