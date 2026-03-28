"use client";

import { RSABSSA } from "@cloudflare/blindrsa-ts";

const suite = RSABSSA.SHA384.PSS.Randomized();

export function generateToken(): Uint8Array {
  const token = new Uint8Array(32);
  crypto.getRandomValues(token);
  return token;
}

function importPublicKey(publicKeyB64: string) {
  const keyData = Uint8Array.from(atob(publicKeyB64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "spki",
    keyData,
    { name: "RSA-PSS", hash: "SHA-384" },
    true,
    ["verify"]
  );
}

export async function blindToken(
  token: Uint8Array,
  publicKeyB64: string
): Promise<{ blindedMsg: Uint8Array; inv: Uint8Array }> {
  const publicKey = await importPublicKey(publicKeyB64);
  const { blindedMsg, inv } = await suite.blind(publicKey, token);
  return { blindedMsg, inv };
}

export async function finalizeSignature(
  publicKeyB64: string,
  token: Uint8Array,
  blindSig: Uint8Array,
  inv: Uint8Array
): Promise<Uint8Array> {
  const publicKey = await importPublicKey(publicKeyB64);
  return suite.finalize(publicKey, token, blindSig, inv);
}

export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
