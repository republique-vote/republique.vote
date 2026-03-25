import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { env } from "env";

export const auth = betterAuth({
  database: new Database("auth.db"),
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
