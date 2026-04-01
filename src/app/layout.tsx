import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import { HeaderAuthItem } from "@/components/auth/header-auth-item";
import { BrandLogo } from "@/components/brand-logo";
import { DemoBanner } from "@/components/demo-banner";
import { HeaderNav } from "@/components/header-nav";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SWRProvider } from "./swr-provider";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default:
      "Plateforme de vote en ligne transparente et vérifiable pour les citoyens français",
    template: "%s | republique.vote",
  },
  description:
    "Plateforme de vote en ligne transparente pour les citoyens français. Chaque vote est anonyme, publié publiquement et vérifiable par tous.",
  metadataBase: new URL("https://republique.vote"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "republique.vote",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={cn("font-sans", figtree.variable)}
      lang="fr"
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <SWRProvider>
              <DemoBanner />

              {/* Header */}
              <header className="relative border-border border-b bg-card">
                <div className="mx-auto max-w-[1200px] px-6">
                  {/* Top row: brand + quick access */}
                  <div className="flex min-h-[56px] items-center justify-between gap-2 md:min-h-[116px]">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="hidden shrink-0 md:block">
                        <BrandLogo />
                      </div>
                      <div className="hidden h-12 w-px shrink-0 bg-border md:block" />
                      <Link className="flex min-w-0 flex-col" href="/">
                        <span className="truncate font-bold text-foreground text-lg md:text-xl">
                          republique.vote
                        </span>
                        <span className="hidden text-muted-foreground text-sm md:block">
                          Le vote, partout, pour tous. Par le peuple, pour le
                          peuple.
                        </span>
                      </Link>
                    </div>
                    {/* Desktop: quick access */}
                    <div className="hidden shrink-0 items-center md:flex">
                      <ThemeToggle />
                      <HeaderAuthItem />
                    </div>
                    {/* Mobile: burger menu */}
                    <MobileMenu />
                  </div>
                </div>
                {/* Navigation row (desktop only) */}
                <div className="hidden border-border border-t md:block">
                  <div className="mx-auto max-w-[1200px] px-6">
                    <HeaderNav />
                  </div>
                </div>
                {/* Accent line under header */}
                <div className="accent-line" />
              </header>

              {/* Main content */}
              <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
                {children}
              </main>

              {/* Footer */}
              <footer className="mt-auto pt-8">
                {/* Accent line above footer */}
                <div className="accent-line" />
                <div className="mx-auto max-w-[1200px] px-6">
                  {/* Body: brand left + content right */}
                  <div className="flex flex-col py-6 md:flex-row md:items-center">
                    {/* Brand — left, fixed width like DSFR ~130px */}
                    <div className="shrink-0 md:w-[200px]">
                      <BrandLogo />
                    </div>
                    {/* Content — right, pushed to right like DSFR */}
                    <div className="mt-4 md:mt-0 md:ml-auto md:flex-[0_1_50%]">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Proof of concept{" "}
                        <a
                          className="underline transition-colors hover:text-foreground"
                          href="https://github.com/republique-vote/republique.vote"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          open source
                        </a>{" "}
                        de vote en ligne transparent pour les citoyens français.
                        Chaque vote est signé, publié publiquement et vérifiable
                        par tous.
                      </p>
                    </div>
                  </div>
                  {/* Bottom — inside container like DSFR */}
                  <div className="border-border border-t py-4">
                    <ul className="m-0 flex list-none flex-wrap items-center p-0 text-muted-foreground text-xs">
                      <li>Accessibilité : non conforme</li>
                      <li className="before:mx-3 before:text-border before:content-['|']">
                        <ThemeToggle variant="footer" />
                      </li>
                      <li className="before:mx-3 before:text-border before:content-['|']">
                        <Link
                          className="transition-colors hover:text-primary"
                          href="/polls"
                        >
                          Votes
                        </Link>
                      </li>
                      <li className="before:mx-3 before:text-border before:content-['|']">
                        <a
                          className="transition-colors hover:text-primary"
                          href="https://github.com/republique-vote/republique.vote"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Code source
                        </a>
                      </li>
                    </ul>
                    <p className="mt-4 text-muted-foreground text-xs">
                      Le code source de ce site est publié sous{" "}
                      <a
                        className="underline transition-colors hover:text-primary"
                        href="https://github.com/republique-vote/republique.vote/blob/main/LICENSE"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        licence AGPL-3.0
                      </a>
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
