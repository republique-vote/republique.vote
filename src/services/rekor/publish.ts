import { createHash, createSign, generateKeyPairSync } from "node:crypto";
import type {
  LogEntry,
  ProposedHashedRekordEntry,
} from "@sigstore/rekor-types";
import { db } from "@/db";
import { rekorEntry } from "@/db/schema";

interface RekorPublishParams {
  merkleRoot: string;
  pollId: string;
  sequence: number;
}

// Generate a signing key pair once at startup (ephemeral per deploy)
// The public key is included in each Rekor entry so anyone can verify
const { publicKey, privateKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256",
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const REKOR_URL = "https://rekor.sigstore.dev/api/v1/log/entries";

export async function publishToRekor({
  pollId,
  merkleRoot,
  sequence,
}: RekorPublishParams) {
  const data = JSON.stringify({ pollId, merkleRoot, sequence });
  const hash = createHash("sha256").update(data).digest("hex");

  const sign = createSign("SHA256");
  sign.update(data);
  const signature = sign.sign(privateKey, "base64");

  const entry: ProposedHashedRekordEntry = {
    kind: "hashedrekord",
    apiVersion: "0.0.1",
    spec: {
      data: {
        hash: { algorithm: "sha256", value: hash },
      },
      signature: {
        content: signature,
        publicKey: {
          content: Buffer.from(publicKey).toString("base64"),
        },
      },
    },
  };

  const response = await fetch(REKOR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Rekor API ${response.status}: ${error}`);
  }

  const result = (await response.json()) as Record<string, LogEntry>;
  const logIndex = Number(Object.values(result)[0]?.logIndex);

  if (!Number.isNaN(logIndex)) {
    await db.insert(rekorEntry).values({
      pollId,
      sequence,
      merkleRoot,
      logIndex,
    });
  }

  console.log(
    `[rekor] Merkle root published: ${pollId} #${sequence} (logIndex: ${logIndex})`
  );

  return { logIndex };
}
