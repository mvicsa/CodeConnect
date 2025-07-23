"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import NavBar from "./NavBar";
import BrandWithSearch from "./BrandWithSearch";
import MobileMenuWithIcon from "./MobileMenuWithIcon";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Container from "@/components/Container";
import NotificationPage from "@/components/notification";
import navItems from "@/config/nav.config";

export function MainNavBar() {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

    // Update activeIndex based on current pathname
  React.useEffect(() => {
    // Normalize pathname: remove locale prefix, trailing slash, query, and hash
    let normalizedPath = pathname.split("?")[0].split("#")[0];
    // Remove locale prefix (e.g., /en, /ar)
    normalizedPath = normalizedPath.replace(/^\/(en|ar)(\/|$)/, "/");
    // Remove trailing slash (except for root)
    if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath.slice(0, -1);
    }

    const index = navItems.findIndex(item => {
      // Normalize nav item href
      let href = item.href;
      if (href.length > 1 && href.endsWith("/")) {
        href = href.slice(0, -1);
      }
      if (href === "/") {
        return normalizedPath === "/";
      }
      // Match exact or nested route (e.g., /tags or /tags/sometag)
      return normalizedPath === href || normalizedPath.startsWith(href + "/");
    });
    setActiveIndex(index !== -1 ? index : null);
  }, [pathname]);

  return (
    <nav className="w-full fixed top-0 z-50 bg-background border-b">
      <Container>
        <div className="flex justify-between lg:grid grid-cols-12 h-16 items-center gap-4">
          <div className="lg:col-span-4">
            <MobileMenuWithIcon
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
            <BrandWithSearch />
          </div>
          <div className="col-span-4 hidden lg:flex">
            <NavBar activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
          </div>
          <div className="lg:col-span-4 flex justify-end gap-2">
            <div
              className="flex flex-row justify-center items-center gap-2"
            >
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
            <UserMenu />
          </div>
        </div>
      </Container>
    </nav>
  );
}
