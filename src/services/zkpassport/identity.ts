import { createHmac } from "node:crypto";
import type { QueryResult } from "@zkpassport/sdk";

export interface CitizenIdentity {
  birthdate: string;
  gender: string;
  givenNames: string;
  lastname: string;
}

const NON_LETTERS = /[^A-Z]+/g;
const DIACRITICS = /\p{Diacritic}/gu;
const HALF_DAY_MS = 12 * 60 * 60 * 1000;

// "Jean-François  d'Arc" and "JEAN FRANCOIS D ARC" must give the same key
function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toUpperCase()
    .replace(NON_LETTERS, " ")
    .trim();
}

// The SDK builds the birthdate at midnight in an unknown timezone: shifting
// by half a day before reading the UTC date always lands on the right day
function normalizeDate(value: Date | string) {
  const date = new Date(new Date(value).getTime() + HALF_DAY_MS);
  return date.toISOString().slice(0, 10);
}

// Reads the attributes disclosed by a verified proof. verify() already
// checked they match the data committed by the proof.
export function readCitizenIdentity(result: QueryResult): CitizenIdentity {
  const fullname = result.fullname?.disclose?.result;
  const lastname = result.lastname?.disclose?.result;
  const birthdate = result.birthdate?.disclose?.result;
  const gender = result.gender?.disclose?.result;

  if (!(fullname && lastname && birthdate && gender)) {
    throw new Error("missing_identity_attributes");
  }

  // The SDK builds fullname as "<given names> <lastname>"
  const normalizedFullname = normalizeName(fullname);
  const normalizedLastname = normalizeName(lastname);
  const givenNames = normalizedFullname.endsWith(normalizedLastname)
    ? normalizedFullname.slice(0, -normalizedLastname.length).trim()
    : normalizedFullname;

  return {
    lastname: normalizedLastname,
    givenNames,
    birthdate: normalizeDate(birthdate),
    gender: gender.toUpperCase(),
  };
}

// Stable across renewals, lost cards and document types for the same person.
// Only this key is meant to be stored, never the identity itself.
export function computeIdentityKey(identity: CitizenIdentity, secret: string) {
  return createHmac("sha256", secret)
    .update(
      [
        identity.lastname,
        identity.givenNames,
        identity.birthdate,
        identity.gender,
      ].join("|")
    )
    .digest("hex");
}
