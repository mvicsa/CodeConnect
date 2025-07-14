"use client";

import { Home, PenSquare, Users, LogIn, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils"; 

export function AppSidebar2() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={cn(
        "bg-base-200 dark:bg-base-100 border-r border-base-300 min-h-screen transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold">
          {isOpen ? "CodeConnect" : "💡"}
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-sm btn-ghost"
        >
          <Menu size={20} />
        </button>
      </div>

      <nav className="px-2 space-y-2">
        <SidebarLink href="/dashboard" icon={<Home size={20} />} isOpen={isOpen}>
          Dashboard
        </SidebarLink>
        <SidebarLink href="/articles" icon={<PenSquare size={20} />} isOpen={isOpen}>
          Articles
        </SidebarLink>
        <SidebarLink href="/community" icon={<Users size={20} />} isOpen={isOpen}>
          Community
        </SidebarLink>
        <SidebarLink href="/login" icon={<LogIn size={20} />} isOpen={isOpen}>
          Login
        </SidebarLink>
      </nav>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  children,
  isOpen,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-base-300 text-base-content transition-colors"
    >
      {icon}
      {isOpen && <span className="truncate">{children}</span>}
    </Link>
  );
}
