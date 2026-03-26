"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderAuthItem } from "@/components/auth/header-auth-item";
import { navLinks } from "@/constants/nav";

export function MobileMenu() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	return (
		<div className="md:hidden">
			<Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu">
				{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
			</Button>

			{open && (
				<div className="absolute top-full left-0 right-0 z-50 bg-card border-b border-border">
					{/* Navigation */}
					<nav className="flex flex-col border-b border-border">
						{navLinks.map((link) => {
							const isActive = link.exact
								? pathname === link.href
								: pathname.startsWith(link.href);

							return (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setOpen(false)}
									className={`text-sm py-3 px-6 border-l-2 transition-colors ${
										isActive
											? "border-primary text-primary font-semibold bg-accent/50"
											: "border-transparent text-foreground hover:bg-accent/30"
									}`}
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
