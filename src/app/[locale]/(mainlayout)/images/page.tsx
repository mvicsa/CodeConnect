
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import CreatePostWrapper from "@/components/post/CreatePostWrapper";
import PostsListContainer from "@/components/post/PostsListContainer";
import Container from "@/components/Container";

export default function ImagesPage() {

  return (
    <Container>
      <div className="grid grid-cols-12 gap-4">
        {/* Left Sidebar (visible on desktop, hidden on mobile) */}
        <div className="md:col-span-4 xl:col-span-3 hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-8 xl:col-span-6">
          <main className="w-full space-y-6">
            <CreatePostWrapper />
            <PostsListContainer type="image" title="Images" />
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