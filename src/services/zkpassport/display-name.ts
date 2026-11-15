"use client";

import type { QueryResult } from "@zkpassport/sdk";
import { useSyncExternalStore } from "react";

// The server never stores a name: the one shown in the header lives in this
// browser only, taken from the proof the browser already holds
const STORAGE_KEY = "republique.displayName";
const CHANGE_EVENT = "republique:display-name";
const WORD_START = /(^|[\s-])\p{L}/gu;
const WHITESPACE = /\s+/;

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(WORD_START, (match) => match.toUpperCase());
}

// French convention: first given name, then the last name in capitals
export function formatDisplayName(givenNames: string, lastname: string) {
  const firstName = givenNames.trim().split(WHITESPACE)[0] ?? "";
  return `${toTitleCase(firstName)} ${lastname.trim().toUpperCase()}`.trim();
}

// fullname is "<given names> <lastname>"
export function displayNameFromProof(result: QueryResult) {
  const fullname = result.fullname?.disclose?.result?.trim();
  const lastname = result.lastname?.disclose?.result?.trim();
  if (!(fullname && lastname)) {
    return null;
  }
  const givenNames = fullname.endsWith(lastname)
    ? fullname.slice(0, -lastname.length).trim()
    : fullname;
  return formatDisplayName(givenNames, lastname);
}

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function saveDisplayName(name: string | null) {
  try {
    if (name) {
      localStorage.setItem(STORAGE_KEY, name);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode): the header falls back
  }
  notify();
}

function readDisplayName() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useDisplayName() {
  return useSyncExternalStore(subscribe, readDisplayName, () => null);
}
