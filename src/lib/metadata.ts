import type { Metadata } from "next";
import removeMarkdown from "remove-markdown";

const TYPE_LABELS: Record<string, string> = {
  law: "Loi",
  referendum: "Référendum",
  election: "Élection",
};

interface MetadataOptions {
  description?: string;
  ogType?: "website" | "article";
  pollType?: string;
  title: string;
}

export function constructMetadata({
  title,
  description,
  ogType = "website",
  pollType,
}: MetadataOptions): Metadata {
  const plainDescription = description
    ? removeMarkdown(description).slice(0, 160)
    : undefined;

  const seoTitle =
    pollType && TYPE_LABELS[pollType]
      ? `${title} — ${TYPE_LABELS[pollType]}`
      : title;

  const ogParams = new URLSearchParams({ title });
  if (pollType) {
    ogParams.set("type", pollType);
  }

  return {
    title: seoTitle,
    description: plainDescription,
    openGraph: {
      title: seoTitle,
      description: plainDescription,
      type: ogType,
      images: [`/api/og?${ogParams}`],
    },
  };
}

export { TYPE_LABELS };
