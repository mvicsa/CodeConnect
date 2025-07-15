"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  List,
  Info,
  Code2,
  Video,
  Images,
  Home,
} from "lucide-react";
import Tags from "@/components/Tags";

export function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
    { name: "Coding", href: "/coding", icon: <Code2 className="w-5 h-5" /> },
    { name: "Images", href: "/images", icon: <Images className="w-5 h-5" /> },
    { name: "Videos", href: "/videos", icon: <Video className="w-5 h-5" /> },
    { name: "Bookmarks", href: "/bookmarks", icon: <Bookmark className="w-5 h-5" /> },
    { name: "About", href: "/about", icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <>
      <aside
        className="space-y-6"
      >
        <div>
          <h2 className="text-lg font-medium mb-2 text-muted-foreground">Categories</h2>
          <nav className="space-y-1 -ms-3 mb-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <h2 className="text-lg font-medium mb-2 text-muted-foreground">Trending Tags</h2>
          <Tags tags={["Coding", "Images", "Videos", "Bookmarks", "About"]} />
        </div>
      </aside>
    </>
  );
}