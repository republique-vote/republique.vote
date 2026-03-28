"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/constants/nav";

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0 overflow-x-auto">
      {navLinks.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm transition-colors ${
              isActive
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-foreground hover:border-primary hover:text-primary"
            }`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
