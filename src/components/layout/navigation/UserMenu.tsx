"use client";

import * as React from "react";
import Link from "next/link";
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { logout } from '@/store/slices/authSlice';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export default function UserMenu() {
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
        <Link href="/login" className="text-sm underline underline-offset-4">Login</Link>
        <Link href="/register" className="text-sm underline underline-offset-4">Register</Link>
      </div>
    );
  }

  return (
    <NavigationMenu className="flex items-center  ">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="p-0 bg-transparent hover:bg-transparent focus:bg-transparent flex justify-center items-center">
            <Avatar className="p-2">
              <AvatarImage
                src={user.avatar || '/user.png'}
                alt={user.username || user.email}
                className="h-8 w-8 rounded-full"
              />
              <AvatarFallback>{user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div className="items-center hidden sm:flex">
              {user.username || user.email}
            </div>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid md:w-[200px] w-[100px] gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <button onClick={() => dispatch(logout())} className="flex-row items-center gap-2 w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                    Logout
                  </button>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
