
import { MainNavBar } from "@/components/layout/navigation/MainNavBar";
import React from "react";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <MainNavBar />
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16">
        {children}
      </div>
    </>
  );
}