import { RSABSSA } from "@cloudflare/blindrsa-ts";
import { db } from "@/db";
import { pollKeyPair } from "@/db/schema";
import { eq } from "drizzle-orm";

const suite = RSABSSA.SHA384.PSS.Randomized();

export async function generateKeyPair() {
  const { publicKey, privateKey } = await suite.generateKey({
    publicExponent: Uint8Array.from([1, 0, 1]),
    modulusLength: 2048,
  });

  const publicKeyBytes = await crypto.subtle.exportKey("spki", publicKey);
  const privateKeyBytes = await crypto.subtle.exportKey("pkcs8", privateKey);

  return {
    publicKey: Buffer.from(publicKeyBytes).toString("base64"),
    privateKey: Buffer.from(privateKeyBytes).toString("base64"),
  };
}

export async function getOrCreateKeyPair(pollId: string) {
  const existing = await db.query.pollKeyPair.findFirst({
    where: eq(pollKeyPair.pollId, pollId),
  });

  if (existing) {
    return { publicKey: existing.publicKey, privateKey: existing.privateKey };
  }

  const keys = await generateKeyPair();

  await db.insert(pollKeyPair).values({
    pollId,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  });

  return keys;
}

async function importPrivateKey(privateKeyB64: string) {
  const keyData = Buffer.from(privateKeyB64, "base64");
  return crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSA-PSS", hash: "SHA-384" },
    false,
    ["sign"],
  );
}

async function importPublicKey(publicKeyB64: string) {
  const keyData = Buffer.from(publicKeyB64, "base64");
  return crypto.subtle.importKey(
    "spki",
    keyData,
    { name: "RSA-PSS", hash: "SHA-384" },
    true,
    ["verify"],
  );
}

export async function signBlindedToken(
  blindedMessage: Uint8Array,
  privateKeyB64: string,
): Promise<Uint8Array> {
  const privateKey = await importPrivateKey(privateKeyB64);
  return suite.blindSign(privateKey, blindedMessage);
}

export async function verifySignature(
  token: Uint8Array,
  signature: Uint8Array,
  publicKeyB64: string,
): Promise<boolean> {
  try {
    const publicKey = await importPublicKey(publicKeyB64);
    await suite.verify(publicKey, signature, token);
    return true;
  } catch {
    return false;
  }
}
