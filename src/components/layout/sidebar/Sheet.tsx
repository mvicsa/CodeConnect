
'use client';

import { usePathname, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Menu,
  Code2,
  Images,
  Video,
  Presentation,
} from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function SheetD() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsRtl(document.documentElement.dir === 'rtl');
    }
  }, []);

  const navLinks = [
    { name: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
    { name: "Coding", href: "/coding", icon: <Code2 className="w-5 h-5" /> },
    { name: "Images", href: "/images", icon: <Images className="w-5 h-5" /> },
    { name: "Videos", href: "/videos", icon: <Video className="w-5 h-5" /> },
    { name: "Meeting", href: "/meeting", icon: <Presentation className="w-5 h-5" /> },
    // { name: "Bookmarks", href: "/bookmarks", icon: <Bookmark className="w-5 h-5" /> },
    // { name: "About", href: "/about", icon: <Info className="w-5 h-5" /> },
  ];

  // Remove locale prefix from pathname for matching
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)(\/|$)/, '/');

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden cursor-pointer"
          >
            <Menu className="w-6 h-6" />
            <span className="sr-only">Open Sidebar Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side={isRtl ? 'right' : 'left'} className="w-[280px] bg-background">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-muted-foreground">Categories</SheetTitle>
          </SheetHeader>
          <nav className="space-y-2 px-4">
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
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out
                  ${isActive
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'hover:bg-accent/70 hover:shadow-sm text-foreground'}`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}