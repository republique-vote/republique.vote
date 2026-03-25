"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil", exact: true },
  { href: "/polls", label: "Votes", exact: false },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0">
      {links.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm py-4 px-4 border-b-2 transition-colors ${
              isActive
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-foreground hover:text-primary hover:border-primary"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
