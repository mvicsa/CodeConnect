
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { SheetD } from "@/components/layout/sidebar/Sheet";
import CreatePostWrapper from "@/components/post/CreatePostWrapper";
import PostsListContainer from "@/components/post/PostsListContainer";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full px-4 sm:px-6 lg:px-8 pt-16 max-w-screen-xl mx-auto">
      {/* Left Sidebar (visible on desktop, hidden on mobile) */}
      <div className="lg:col-span-2 hidden lg:block rtl:col-start-11 rtl:col-span-2">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-6 lg:col-start-4 rtl:lg:col-start-4">
        <main className="w-full space-y-6 my-6">
          <SheetD />
          <CreatePostWrapper />
          <PostsListContainer />
        </main>
      </div>

      {/* Right Sidebar - Placeholder or content */}
      <div className="lg:col-span-3 hidden lg:block rtl:col-start-1">
        {/* Optional right sidebar content */}
      </div>
    </div>
  );
}