"use client";
import Logo from "@/components/Logo";
import Link from "next/link";
import React from "react";
import { NavBarSearchInput } from "./NavBarSearchInput";
import { SheetD } from "../sidebar/Sheet";

export default function BrandWithSearch() {

  return (
    <div
      className="flex items-center justify-start gap-4 px-1 py-2 rounded-md"
    >
      <SheetD />
      <Link href="/" className="flex items-center">
        <Logo className="h-10 w-auto" />
      </Link>
      <NavBarSearchInput />
    </div>
  );
}
