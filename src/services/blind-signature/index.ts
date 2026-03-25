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

  const publicJwk = await crypto.subtle.exportKey("jwk", publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", privateKey);

  return {
    publicKey: JSON.stringify(publicJwk),
    privateKey: JSON.stringify(privateJwk),
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

async function importPrivateKey(privateKeyJson: string) {
  const jwk = JSON.parse(privateKeyJson);
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-PSS", hash: "SHA-384" },
    true,
    ["sign"],
  );
}

async function importPublicKey(publicKeyJson: string) {
  const jwk = JSON.parse(publicKeyJson);
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-PSS", hash: "SHA-384" },
    true,
    ["verify"],
  );
}

export async function signBlindedToken(
  blindedMessage: Uint8Array,
  privateKeyJson: string,
): Promise<Uint8Array> {
  const privateKey = await importPrivateKey(privateKeyJson);
  return suite.blindSign(privateKey, blindedMessage);
}

export async function verifySignature(
  token: Uint8Array,
  signature: Uint8Array,
  publicKeyJson: string,
): Promise<boolean> {
  try {
    const publicKey = await importPublicKey(publicKeyJson);
    await suite.verify(publicKey, signature, token);
    return true;
  } catch {
    return false;
  }
}

export async function getPublicKeySpki(publicKeyJson: string): Promise<string> {
  const publicKey = await importPublicKey(publicKeyJson);
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  return Buffer.from(spki).toString("base64");
}
