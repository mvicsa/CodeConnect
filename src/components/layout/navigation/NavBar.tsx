"use client";

import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import navItems from "@/config/nav.config";
import NavItem from "@/components/layout/navigation/NavItem";
import { activeMenuProps } from "./nav.types";
import { Bell } from "lucide-react";
import NotificationPage from "@/components/notification";
export default function NavBar({
  activeIndex,
  setActiveIndex,
}: activeMenuProps) {
  return (
    <NavigationMenu className="hidden lg:flex mx-auto items-center align-middle">
      <NavigationMenuList>
        {navItems.map((item, index) => {
          return (
            <NavItem
              key={index}
              item={item}
              index={index}
              isActive={activeIndex === index}
              setActiveIndex={setActiveIndex}
            />
          );
        })}
        <NotificationPage />
      </NavigationMenuList>
    </NavigationMenu>
  );
}
