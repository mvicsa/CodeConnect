
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Bookmark,
  List,
  Headphones,
  Film,
  Tag,
  HelpCircle,
  Info,
  Menu,
} from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function SheetD() {
  const pathname = usePathname();
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsRtl(document.documentElement.dir === 'rtl');
    }
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Reading List', href: '/reading-list', icon: <Bookmark className="w-5 h-5" /> },
    { name: 'Listings', href: '/listings', icon: <List className="w-5 h-5" /> },
    { name: 'Podcasts', href: '/podcasts', icon: <Headphones className="w-5 h-5" /> },
    { name: 'Videos', href: '/videos', icon: <Film className="w-5 h-5" /> },
    { name: 'Tags', href: '/tags', icon: <Tag className="w-5 h-5" /> },
    { name: 'FAQ', href: '/faq', icon: <HelpCircle className="w-5 h-5" /> },
    { name: 'About', href: '/about', icon: <Info className="w-5 h-5" /> },
  ];

  return (
       
   <>
      {/* Mobile Sheet Trigger - Button visible on small screens */}
      <div className="sm:hidden fixed top-[4.3rem] z-[1000] px-6">
        {/* {console.log('Sidebar Sheet Trigger Rendered')} Debugging log */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={`p-3 rounded-lg bg-background border border-gray-300 hover:bg-accent/70 transition-all duration-200 shadow-lg fixed
              ${isRtl ? 'left-3' : 'right-3'}`}
            >
              <Menu className="w-6 h-6" />
              <span className="sr-only">Open Sidebar Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side={isRtl ? 'right' : 'left'} className="w-[280px] pt-16 bg-background">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold text-primary">DEV</SheetTitle>
            </SheetHeader>
            <nav className="space-y-2 mt-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out
                  ${pathname === link.href
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'hover:bg-accent/70 hover:shadow-sm text-foreground'}`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              ))}
            </nav>
            <SheetFooter className="mt-6">
              <SheetClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
              </>
);
}