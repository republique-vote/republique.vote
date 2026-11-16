"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => undefined;

// False during server rendering and hydration, true right after: lets the
// first client render match the server HTML
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}
