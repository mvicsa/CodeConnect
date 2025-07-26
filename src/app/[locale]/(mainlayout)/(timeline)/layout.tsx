
import Container from "@/components/Container";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import CreatePostWrapper from "@/components/post/CreatePostWrapper";
import SuggestedUsers from "@/components/SuggestedUsers";
import BlockStatusChecker from "@/components/BlockStatusChecker";
import React from "react";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Container>
      <BlockStatusChecker />
      <div className="grid grid-cols-12 gap-4">
        {/* Left Sidebar (visible on desktop, hidden on mobile) */}
        <div className="md:col-span-4 xl:col-span-3 hidden md:block">
            <Sidebar />
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-8 xl:col-span-6">
            <main className="w-full space-y-6">
                <CreatePostWrapper />
                {children}
            </main>
        </div>

        {/* Right Sidebar - Suggested Users */}
        <div className="lg:col-span-3 hidden xl:block ">
            <SuggestedUsers />
        </div>
        </div>
    </Container>
  );
}