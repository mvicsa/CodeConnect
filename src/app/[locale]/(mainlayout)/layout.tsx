
import { MainNavBar } from "@/components/layout/navigation/MainNavBar";
import React from "react";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mt-24 mb-24 lg:mb-0">
      <MainNavBar />
      {children}
    </div>
  );
}