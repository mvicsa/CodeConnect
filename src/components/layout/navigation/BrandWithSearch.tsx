"use client";
import Logo from "@/components/Logo";
import Link from "next/link";
import React from "react";
import { NavBarSearchInput } from "./NavBarSearchInput";
import { SheetD } from "../sidebar/Sheet";
import { useParams } from "next/navigation";

export default function BrandWithSearch() {
  const params = useParams();
  const locale = params?.locale as string || 'en';

  return (
    <div
      className="flex items-center justify-start gap-4 px-1 py-2 rounded-md"
    >
      <SheetD />
      <Link href={`/${locale}`} className="flex items-center">
        <Logo className="h-10 w-auto" />
      </Link>
      <NavBarSearchInput />
    </div>
  );
}
