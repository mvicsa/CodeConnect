"use client";

import * as React from "react";
import UserMenu from "./UserMenu";
import NavBar from "./NavBar";
import BrandWithSearch from "./BrandWithSearch";
import MobileMenuWithIcon from "./MobileMenuWithIcon";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Container from "@/components/Container";

export function MainNavBar() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

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
