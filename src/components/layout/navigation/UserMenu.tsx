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
        <Avatar className="rounded-full flex items-center justify-center">
          <AvatarImage
            src={user.avatar || "/user.png"}
            alt={user.username || user.email}
            className="h-7 w-7 rounded-full flex-shrink-0"
          />
          <AvatarFallback>
            {user.username?.[0]?.toUpperCase() ||
              user.email?.[0]?.toUpperCase() ||
              "?"}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:block text-sm font-medium">{user.firstName}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 hidden md:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer p-0">
              <Link href="/profile" className="flex items-center gap-2 w-full px-2 py-1.5">
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </Link>
          </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer p-0">
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer"
          >
            <LogOutIcon className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
