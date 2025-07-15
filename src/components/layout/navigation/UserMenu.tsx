"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOutIcon, UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { logout } from "@/store/slices/authSlice";
import { useState } from "react";
import Link from "next/link";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { user, initialized } = useSelector((state: RootState) => state.auth);

  if (!initialized) {
    // While auth is being checked, show nothing (or a spinner if you want)
    return null;
  }

  if (!user) {
    // Not logged in: show login/register
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="text-sm underline underline-offset-4">
          Login
        </Link>
        <Link href="/register" className="text-sm underline underline-offset-4">
          Register
        </Link>
      </div>
    );
  }
  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center gap-2 !px-1 cursor-pointer hover:bg-card rounded-lg whitespace-nowrap">
        <Avatar className="w-7 h-7 rounded-full flex items-center justify-center">
          <AvatarImage
            src={user.avatar || "/user.png"}
            alt={user.username || user.email}
            className="h-8 w-8 rounded-full"
          />
          <AvatarFallback>
            {user.username?.[0]?.toUpperCase() ||
              user.email?.[0]?.toUpperCase() ||
              "?"}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:block text-sm font-medium">{user.username}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 hidden md:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/profile" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-2"
          >
            <LogOutIcon className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
