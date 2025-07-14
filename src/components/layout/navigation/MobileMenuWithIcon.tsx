import React from "react";
import MobileMenu from "./MobileMenu";
import { activeMenuProps } from "./nav.types";

export default function MobileMenuWithIcon({
  activeIndex,
  setActiveIndex,
}: activeMenuProps) {
  return (
     <MobileMenu 
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          );
        }
