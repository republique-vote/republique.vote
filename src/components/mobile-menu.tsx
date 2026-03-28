"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HeaderAuthItem } from "@/components/auth/header-auth-item";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/constants/nav";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 md:hidden">
      <HeaderAuthItem compact />
      <Button
        aria-label="Menu"
        onClick={() => setOpen(!open)}
        size="icon"
        variant="ghost"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="absolute top-full right-0 left-0 z-50 border-border border-b bg-card">
          {/* Navigation */}
          <nav className="flex flex-col border-border border-b">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);

              return (
                <Link
                  className={`border-l-2 px-6 py-3 text-sm transition-colors ${
                    isActive
                      ? "border-primary bg-accent/50 font-semibold text-primary"
                      : "border-transparent text-foreground hover:bg-accent/30"
                  }`}
                  href={link.href}
                  key={link.href}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Quick access */}
          <div className="flex items-center justify-between px-6 py-3">
            <ThemeToggle />
            <HeaderAuthItem />
          </div>
        </div>
      )}
    </div>
  );
}
