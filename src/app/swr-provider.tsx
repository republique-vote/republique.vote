"use client";

import { SWRConfig } from "swr";
import { fetcher, swrConfig } from "@/services/swr";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        ...swrConfig,
        fetcher,
      }}
    >
      {children}
    </SWRConfig>
  );
}
