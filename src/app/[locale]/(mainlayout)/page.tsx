import ClientCounter from "@/components/ClientCounter";
import Logo from "@/components/Logo";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import NotificationPage from "@/components/notification";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import CreatePostWrapper from "@/components/post/CreatePostWrapper";
import PostsListContainer from "@/components/post/PostsListContainer";
import { useTranslations } from "next-intl";
import Container from "@/components/Container";

export default function Home() {
  const t = useTranslations();

  return (
    <>
      <div className="flex justify-center">
        <Logo />
      </div>
      <h1 className="text-2xl font-bold text-center mt-3">
        {t('title')}
      </h1>
      <p className="text-center mt-4">
        {t('description')}
      </p>
      <p className="text-center mt-2 mb-4">

        <Heart />

        Share your code, learn from others. Join the community!
      </p>
      <div className="bg-warning text-warning-foreground px-3 py-1 rounded-2xl mt-2">Hello</div>
      <div className="bg-danger text-danger-foreground px-3 py-1 rounded-2xl mt-2">Hello</div>
      <div className="bg-info text-info-foreground px-3 py-1 rounded-2xl mt-2">Hello</div>
      <div className="bg-success text-success-foreground px-3 py-1 rounded-2xl mt-2">Hello</div>
      { /* Test Rediux Toolkit */}
      <ClientCounter />
      <div className="flex justify-center gap-3 mt-6">
        <Button>Button</Button>
        <Button variant="secondary">Button</Button>
        <LanguageSwitcher />
        <ThemeSwitcher />
        <NotificationPage />
      
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

    </>
    </Container>
  );
}
