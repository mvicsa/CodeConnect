"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  Bookmark,
  List,
  Headphones,
  Film,
  Tag,
  HelpCircle,
  Info,

} from "lucide-react";


export function Sidebar() {
  const pathname = usePathname();
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsRtl(document.documentElement.dir === "rtl");
    }
  }, []);

  const navLinks = [
    { name: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
    {
      name: "Reading List",
      href: "/reading-list",
      icon: <Bookmark className="w-5 h-5" />,
    },
    { name: "Listings", href: "/listings", icon: <List className="w-5 h-5" /> },
    {
      name: "Podcasts",
      href: "/podcasts",
      icon: <Headphones className="w-5 h-5" />,
    },
    { name: "Videos", href: "/videos", icon: <Film className="w-5 h-5" /> },
    { name: "Tags", href: "/tags", icon: <Tag className="w-5 h-5" /> },
    { name: "FAQ", href: "/faq", icon: <HelpCircle className="w-5 h-5" /> },
    { name: "About", href: "/about", icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Desktop Sidebar - Fixed, starts below navbar */}
      <aside
        className={`hidden lg:block fixed top-16 w-64 h-[calc(100vh-4rem)] bg-background p-4 overflow-y-auto z-40
        ${
          isRtl ? "right-0 border-l border-r-0" : "left-0 border-r border-l-0"
        }`}
      >
        <div className="mb-2 p-2">
          <h1 className="text-2xl font-bold">DEV</h1>
        </div>
        <nav className="space-y-1">
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
      </aside>
    </>
  );
}

{
  /* Mobile Sheet Trigger - Button visible on small screens */
}
{
  /* {console.log('Sidebar Sheet Trigger Rendered')} Debugging log */
}
// <div className=" cv___cv bg-red-200 fixed top-[5.5rem] z-[1000] px-6">
//   <Sheet>
//     <SheetTrigger asChild>
//       <button
//         className={`p-3 rounded-md bg-red-500 text-white border border-gray-300 hover:bg-red-600 transition-colors shadow-lg fixed
//         ${isRtl ? 'left-16' : 'right-16'}`}
//       >
//         <Menu className="w-6 h-6" />
//         <span className="sr-only">Open Sidebar Menu</span>
//       </button>
//     </SheetTrigger>
//     <SheetContent side={isRtl ? 'right' : 'left'} className="w-[250px] pt-16 bg-background">
//       <div className="mb-8 p-2">
//         <h1 className="text-2xl font-bold">DEV</h1>
//       </div>
//       <nav className="space-y-1">
//         {navLinks.map((link) => (
//           <Link
//             key={link.name}
//             href={link.href}
//             className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
//               pathname === link.href
//                 ? 'bg-accent text-accent-foreground'
//                 : 'hover:bg-accent/50'
//             }`}
//           >
//             {link.icon}
//             <span>{link.name}</span>
//           </Link>
//         ))}
//       </nav>
//     </SheetContent>
//   </Sheet>
// </div>
