"use client";

import * as React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOutIcon, UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useState } from "react";
import Link from "next/link";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center gap-2 !px-1 cursor-pointer hover:bg-card rounded-lg whitespace-nowrap">
          <Avatar className="w-7 h-7 rounded-full flex items-center justify-center">
            <AvatarImage className="rounded-full" src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium">John Doe</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 hidden md:block ${open ? "rotate-180" : ""}`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/profile" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/logout" className="flex items-center gap-2">
            <LogOutIcon className="w-4 h-4" />
            <span>Logout</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
