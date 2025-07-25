"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  Video,
  Images,
  Home,
  Presentation,
  Zap,
  Logs,
} from "lucide-react";
import TrendingTags from "@/components/TrendingTags";

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale as string || 'en';

  const navLinks = [
    { name: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
    { name: "Coding", href: "/coding", icon: <Code2 className="w-5 h-5" /> },
    { name: "Images", href: "/images", icon: <Images className="w-5 h-5" /> },
    { name: "Videos", href: "/videos", icon: <Video className="w-5 h-5" /> },
    { name: "Meeting", href: "/meeting", icon: <Presentation className="w-5 h-5" /> },
    { name: "Discover Sparks", href: "/sparks", icon: <Zap className="w-5 h-5" /> },
  ];

  // Remove locale prefix from pathname for matching
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)(\/|$)/, '/');

  return (
    <>
      <aside className="space-y-6">
        <div>
        <div className="flex items-center gap-2 mb-3">
            <Logs className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-muted-foreground">Categories</h3>
          </div>
          <nav className="space-y-1 -ms-3 mb-6">
            {navLinks.map((link) => {
              // Create locale-aware href
              const localeAwareHref = link.href === '/' ? `/${locale}` : `/${locale}${link.href}`;
              
              // Check if this link is active
              const isActive = link.href === '/' 
                ? pathWithoutLocale === '/' 
                : pathWithoutLocale.startsWith(link.href);
              
              return (
                <Link
                  key={link.name}
                  href={localeAwareHref}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div>
          <TrendingTags limit={5} />
        </div>
      </aside>
    </>
  );
}