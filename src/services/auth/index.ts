import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { env } from "env";
import { db } from "@/db";
import * as schema from "@/db/schemas/auth";
import { zkPassportAuth } from "@/services/auth/zkpassport-plugin";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_BASE_URL,
  plugins: [nextCookies(), zkPassportAuth()],
});
