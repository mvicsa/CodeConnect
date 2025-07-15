"use client";

import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import navItems from "@/config/nav.config";
import NavItem from "@/components/layout/navigation/NavItem";
import { activeMenuProps } from "./nav.types";

export default function MobileMenu({
  activeIndex,
  setActiveIndex,
}: activeMenuProps) {
  return (
    <nav className="fixed flex justify-center bottom-0 left-0 w-full bg-background h-16 z-50 border-t lg:hidden">
      <NavigationMenu>
        <NavigationMenuList className="flex flex-row justify-between items-center">
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
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
