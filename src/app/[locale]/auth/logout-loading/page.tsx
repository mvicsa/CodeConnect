'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { AppDispatch } from '@/store/store';

export default function LogoutLoadingPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Ensure logout action is dispatched if not already
    // (This is a fallback, typically dispatched from UserMenu.tsx)
    dispatch(logout());

    const timer = setTimeout(() => {
      router.replace('/login'); // Redirect to login page after a short delay
    }, 1500); // Display loader for 1.5 seconds

    return () => clearTimeout(timer);
  }, [dispatch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Logging you out...</h2>
        <p className="text-muted-foreground">Please wait while we log you out of your account...</p>
      </div>
    </div>
  );
}
