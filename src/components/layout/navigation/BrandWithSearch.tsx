import Logo from "@/components/Logo";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import Link from "next/link";
import React from "react";
import { NavBarSearchInput } from "./NavBarSearchInput";

export default function BrandWithSearch() {
  return (
    <NavigationMenu className="flex items-center justify-start gap-4 px-1 py-2  rounded-md">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <Logo className="h-10 w-auto" />
      </Link>
      {/* Search input */}
      <NavBarSearchInput />
    </NavigationMenu>
  );
}
