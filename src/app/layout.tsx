import { Figtree } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SWRProvider } from "./swr-provider";
import { HeaderAuthItem } from "@/components/auth/header-auth-item";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { HeaderNav } from "@/components/header-nav";
import { InfoIcon } from "lucide-react";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="fr" className={cn("font-sans", figtree.variable)} suppressHydrationWarning>
			<head>
				<title>republique.vote — Le vote, partout, pour tous. Par le peuple, pour le peuple.</title>
				<meta name="description" content="Plateforme de vote en ligne transparente pour les citoyens français" />
			</head>
			<body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<TooltipProvider>
				<SWRProvider>
					{/* Notice banner */}
					<div className="bg-accent/50 border-b border-border">
						<div className="max-w-[1200px] mx-auto px-6 py-2 flex items-center gap-2 text-sm text-accent-foreground/80">
							<InfoIcon className="h-3.5 w-3.5 shrink-0" />
							<span>republique.vote est un projet de recherche <a href="https://github.com/republique-vote/republique.vote" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">open source</a>. Ce site n&apos;est pas un service officiel du gouvernement français.</span>
						</div>
					</div>

					{/* Header */}
					<header className="bg-card border-b border-border">
						<div className="max-w-[1200px] mx-auto px-6">
							{/* Top row: brand + quick access */}
							<div className="flex items-center justify-between min-h-[116px]">
								<div className="flex items-center gap-4">
									<BrandLogo />
									<div className="h-12 w-px bg-border" />
									<Link href="/" className="flex flex-col">
										<span className="text-xl font-bold text-foreground">republique.vote</span>
										<span className="text-sm text-muted-foreground">Le vote, partout, pour tous. Par le peuple, pour le peuple.</span>
									</Link>
								</div>
								<div className="flex items-center">
									<ThemeToggle />
									<HeaderAuthItem />
								</div>
							</div>
						</div>
						{/* Navigation row */}
						<div className="border-t border-border">
							<div className="max-w-[1200px] mx-auto px-6">
								<HeaderNav />
							</div>
						</div>
						{/* Accent line under header */}
						<div className="accent-line" />
					</header>

					{/* Main content */}
					<main className="max-w-[1200px] mx-auto px-6 py-10 flex-1 w-full">
						{children}
					</main>

					{/* Footer */}
					<footer className="mt-auto pt-8">
						{/* Accent line above footer */}
						<div className="accent-line" />
						<div className="max-w-[1200px] mx-auto px-6">
							{/* Body: brand left + content right */}
							<div className="flex flex-col md:flex-row md:items-center py-6">
								{/* Brand — left, fixed width like DSFR ~130px */}
								<div className="shrink-0 md:w-[200px]">
									<BrandLogo />
								</div>
								{/* Content — right, pushed to right like DSFR */}
								<div className="md:flex-[0_1_50%] md:ml-auto mt-4 md:mt-0">
									<p className="text-sm text-muted-foreground leading-relaxed">
										Proof of concept <a href="https://github.com/republique-vote/republique.vote" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">open source</a> de vote en ligne transparent pour les citoyens français.
										Chaque vote est signé, publié publiquement et vérifiable par tous.
									</p>
								</div>
							</div>
							{/* Bottom — inside container like DSFR */}
							<div className="border-t border-border py-4">
								<ul className="flex flex-wrap items-center text-xs text-muted-foreground list-none p-0 m-0">
									<li>Accessibilité : non conforme</li>
									<li className="before:content-['|'] before:mx-3 before:text-border">
										<ThemeToggle variant="footer" />
									</li>
									<li className="before:content-['|'] before:mx-3 before:text-border">
										<Link href="/polls" className="hover:text-primary transition-colors">Votes</Link>
									</li>
									<li className="before:content-['|'] before:mx-3 before:text-border">
										<a href="https://github.com/republique-vote/republique.vote" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Code source</a>
									</li>
								</ul>
								<p className="text-xs text-muted-foreground mt-4">
									Le code source de ce site est publié sous{" "}
									<a href="https://github.com/republique-vote/republique.vote/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">licence AGPL-3.0</a>
								</p>
							</div>
						</div>
					</footer>
				</SWRProvider>
				</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
