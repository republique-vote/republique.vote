import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { option, poll, voteRecord } from "@/db/schema";
import { verifyChain } from "@/services/poll/merkle";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const format = request.nextUrl.searchParams.get("format") || "json";

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
      blindSignature: voteRecord.blindSignature,
      hash: voteRecord.hash,
      previousHash: voteRecord.previousHash,
      createdAt: voteRecord.createdAt,
    })
    .from(voteRecord)
    .where(eq(voteRecord.pollId, pollId))
    .orderBy(voteRecord.sequence);

  if (format === "csv") {
    const header =
      "sequence,choix,empreinte,empreinte_precedente,jeton,signature,date";
    const rows = votes.map((v) =>
      [
        v.sequence.toString(),
        escapeCsv(optionMap.get(v.optionId) || v.optionId),
        v.hash,
        v.previousHash || "",
        escapeCsv(v.blindToken),
        escapeCsv(v.blindSignature),
        v.createdAt,
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cahier-${pollId}.csv"`,
      },
    });
  }

  const integrity = await verifyChain(pollId);

  const data = {
    poll: { id: p.id, title: p.title, merkleRoot: p.merkleRoot },
    chainValid: integrity.valid,
    totalVotes: votes.length,
    exportedAt: new Date().toISOString(),
    options: options.map((o) => ({ id: o.id, label: o.label })),
    votes: votes.map((v) => ({
      sequence: v.sequence,
      optionId: v.optionId,
      optionLabel: optionMap.get(v.optionId) || v.optionId,
      blindToken: v.blindToken,
      blindSignature: v.blindSignature,
      hash: v.hash,
      previousHash: v.previousHash,
      createdAt: v.createdAt,
    })),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="cahier-${pollId}.json"`,
    },
  });
}
