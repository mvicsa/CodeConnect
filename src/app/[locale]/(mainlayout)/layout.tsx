
import { MainNavBar } from "@/components/layout/navigation/MainNavBar";
import React from "react";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mt-24 mb-24 lg:mb-12">
      <MainNavBar />
      {children}
    </div>
  );
}