"use client";

import { AppSidebar } from "@/components/layout/sidebar/AppSidebar";

import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import CreatePostWrapper from "@/components/post/CreatePostWrapper";
import PostsListContainer from "@/components/post/PostsListContainer";
import { useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";

export default function Home() {
  const t = useTranslations();
  const { user, loading, initialized } = useSelector(
    (state: RootState) => state.auth
  );
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user && !loading) {
      router.replace("/login?message=Please register or login first");
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
        <p className="text-lg text-red-500">
          You must be logged in. Please register or login first.
        </p>
      </div>
    );
  }

  return (
    <Container>
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar (visible on desktop, hidden on mobile) */}
        <div className="md:col-span-4 xl:col-span-3 hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-8 xl:col-span-6">
          <main className="w-full space-y-6">
            <CreatePostWrapper />
            <PostsListContainer />
          </main>
        </div>

        {/* Right Sidebar - Placeholder or content */}
        <div className="lg:col-span-3 hidden xl:block ">
          {/* Optional right sidebar content */}
          Right Sidebar
        </div>
      </div>
    </Container>
  );
}
