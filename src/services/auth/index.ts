import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { env } from "env";
import { db } from "@/db";
import * as schema from "@/db/schemas/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_BASE_URL,
  plugins: [
    nextCookies(),
    genericOAuth({
      config: [
        {
          providerId: "franceconnect",
          clientId: env.FC_CLIENT_ID,
          clientSecret: env.FC_CLIENT_SECRET,
          authorizationUrl: env.FC_AUTHORIZATION_URL,
          tokenUrl: env.FC_TOKEN_URL,
          userInfoUrl: env.FC_USERINFO_URL,
          scopes: ["openid", "profile", "email"],
          pkce: false,
          authorizationUrlParams: () => ({
            acr_values: "eidas1",
            nonce: randomBytes(16).toString("hex"),
          }),
          mapProfileToUser: (profile) => ({
            name: `${profile.given_name} ${profile.family_name}`,
            email: profile.email,
            image: undefined,
          }),
        },
      ],
    }),
  ],
});
