'use client'

import { AppSidebar } from "@/components/layout/sidebar/AppSidebar";
import CreatePostWrapper from "@/components/post/CreatePostWrapper";
import PostsListContainer from "@/components/post/PostsListContainer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const t = useTranslations();
  const { user, loading, initialized } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user && !loading) {
      router.replace('/login?message=Please register or login first');
    }
  }, [user, loading, initialized, router]);

  if (!initialized || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-lg text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">You must be logged in. Please register or login first.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <SidebarProvider>
        <div className="grid grid-cols-12 gap-4 w-full">
          <div className="col-span-3">
            <AppSidebar />
          </div>
          <div className="col-span-6">
            <main className="w-full space-y-6 my-6">
              <CreatePostWrapper />
              <PostsListContainer />
            </main>
          </div>
          <div className="col-span-3">

          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
