import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll, option, voteRecord } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;

  const p = await db.query.poll.findFirst({
    where: eq(poll.id, pollId),
  });

  if (!p) {
    return new Response("poll not found", { status: 404 });
  }

  const options = await db
    .select({ id: option.id, label: option.label })
    .from(option)
    .where(eq(option.pollId, pollId))
    .orderBy(option.position);

  const optionMap = new Map(options.map((o) => [o.id, o.label]));

  const votes = await db
    .select({
      sequence: voteRecord.sequence,
      optionId: voteRecord.optionId,
      blindToken: voteRecord.blindToken,
      hash: voteRecord.hash,
      previousHash: voteRecord.previousHash,
      createdAt: voteRecord.createdAt,
    })
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId))
    .orderBy(desc(voteRecord.sequence))
    .limit(50);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://republique.vote";
  const boardUrl = `${baseUrl}/polls/${pollId}/board`;
  const feedUrl = `${baseUrl}/api/poll/${pollId}/board/feed`;

  const items = votes.map((vote) => {
    const optionLabel = escapeXml(optionMap.get(vote.optionId) || vote.optionId);
    const prevHash = vote.previousHash || "genèse";

    return `    <item>
      <title>Vote #${vote.sequence} — ${optionLabel}</title>
      <description><![CDATA[Empreinte : ${vote.hash}
Empreinte précédente : ${prevHash}
Jeton : ${vote.blindToken}]]></description>
      <pubDate>${new Date(vote.createdAt).toUTCString()}</pubDate>
      <guid isPermaLink="false">${vote.hash}</guid>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cahier de vote — ${escapeXml(p.title)}</title>
    <link>${boardUrl}</link>
    <description>Registre public des votes pour : ${escapeXml(p.title)}</description>
    <language>fr</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
