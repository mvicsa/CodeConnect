import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu } from "lucide-react";
import React from "react";
import MobileMenu from "./MobileMenu";
import { activeMenuProps } from "./nav.types";

export default function MobileMenuWithIcon({
  activeIndex,
  setActiveIndex,
}: activeMenuProps) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem className="relative w-[50px]">
          <NavigationMenuTrigger className="md:hidden p-2">
            {/* <HamburgerButton setMenuOpen={setMenuOpen} menuOpen={menuOpen} /> */}
            <Menu size={24} />
          </NavigationMenuTrigger>

          <NavigationMenuContent>
            <MobileMenu
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
