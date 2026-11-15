import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1),
    AUTH_BASE_URL: z.url(),
    DATABASE_URL: z
      .url()
      .default("postgresql://postgres:postgres@localhost:5432/vote"),
    REDIS_URL: z.url().default("redis://localhost:6379"),
    CRON_SECRET: z.string().min(1).optional(),
    GITHUB_TOKEN: z.string().min(1).optional(),
    GITHUB_MERKLE_REPO: z.string().min(1).optional(),
    IDENTITY_KEY_SECRET: z.string().min(32),
  },
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.CI,
  emptyStringAsUndefined: true,
});
