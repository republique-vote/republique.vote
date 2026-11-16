import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// Pages of the bill on the websites of both chambers
export function OfficialSources({
  assemblyUrl,
  senateUrl,
}: {
  assemblyUrl: string | null;
  senateUrl: string | null;
}) {
  const links = [
    { href: assemblyUrl, label: "Voir sur assemblee-nationale.fr" },
    // The open data still gives some links over http
    {
      href: senateUrl?.replace("http://", "https://"),
      label: "Voir sur senat.fr",
    },
  ].filter((link): link is { href: string; label: string } =>
    Boolean(link.href)
  );

  if (links.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 space-y-2 border border-border p-4">
      <h2 className="font-medium text-sm">Sources officielles</h2>
      {links.map((link) => (
        <Button
          asChild
          className="w-full justify-start"
          key={link.href}
          variant="outline"
        >
          <a href={link.href} rel="noopener noreferrer" target="_blank">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            {link.label}
          </a>
        </Button>
      ))}
    </section>
  );
}
