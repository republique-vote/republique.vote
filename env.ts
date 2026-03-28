import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1),
    AUTH_BASE_URL: z.url(),
    FC_CLIENT_ID: z.string().min(1),
    FC_CLIENT_SECRET: z.string().min(1),
    FC_ISSUER: z.string().min(1),
    FC_AUTHORIZATION_URL: z.url(),
    FC_TOKEN_URL: z.url(),
    FC_USERINFO_URL: z.url(),
    DATABASE_URL: z
      .url()
      .default("postgresql://postgres:postgres@localhost:5432/vote"),
    REDIS_URL: z.url().default("redis://localhost:6379"),
    CRON_SECRET: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.CI,
  emptyStringAsUndefined: true,
});
