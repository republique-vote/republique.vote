import type { ProofResult, QueryResult } from "@zkpassport/sdk";
import type { BetterAuthPlugin, GenericEndpointContext } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { env } from "env";
import { z } from "zod/v4";
import {
  type CitizenProof,
  linkCitizen,
  resolveCitizen,
} from "@/services/zkpassport/citizen";
import { computeIdentityKey } from "@/services/zkpassport/identity";
import { TEST_CITIZENS } from "@/services/zkpassport/test-citizens";
import { verifyCitizenProof } from "@/services/zkpassport/verify";

async function signInCitizen(ctx: GenericEndpointContext, proof: CitizenProof) {
  const resolution = await resolveCitizen(proof);

  if (resolution.kind === "conflict") {
    throw new APIError("CONFLICT", { message: "identity_conflict" });
  }

  let userId: string;
  if (resolution.kind === "existing") {
    userId = resolution.userId;
  } else {
    // Better Auth requires a name and a unique email: neither is real,
    // the account must not hold any identity
    const id = crypto.randomUUID();
    const created = await ctx.context.internalAdapter.createUser({
      name: "Citoyen",
      email: `${id}@citoyen.republique.vote`,
      emailVerified: false,
    });
    await linkCitizen(created.id, proof);
    userId = created.id;
  }

  const user = await ctx.context.internalAdapter.findUserById(userId);
  if (!user) {
    throw new APIError("INTERNAL_SERVER_ERROR", { message: "user_not_found" });
  }

  const session = await ctx.context.internalAdapter.createSession(userId);
  await setSessionCookie(ctx, { session, user });

  return ctx.json({ success: true });
}

export const zkPassportAuth = () =>
  ({
    id: "zkpassport",
    endpoints: {
      zkPassportSignIn: createAuthEndpoint(
        "/zkpassport/sign-in",
        {
          method: "POST",
          body: z.object({
            proofs: z.array(z.record(z.string(), z.unknown())),
            result: z.record(z.string(), z.unknown()),
          }),
        },
        async (ctx) => {
          const verification = await verifyCitizenProof(
            ctx.body.proofs as unknown as ProofResult[],
            ctx.body.result as QueryResult
          );

          if (!verification.verified) {
            throw new APIError("BAD_REQUEST", { message: "invalid_proof" });
          }

          // The identity itself goes no further than this function
          return signInCitizen(ctx, {
            documentId: verification.documentId,
            identityKey: verification.identityKey,
          });
        }
      ),
      zkPassportTestSignIn: createAuthEndpoint(
        "/zkpassport/test-sign-in",
        {
          method: "POST",
          body: z.object({ citizenId: z.string() }),
        },
        async (ctx) => {
          if (process.env.NODE_ENV === "production") {
            throw new APIError("NOT_FOUND");
          }

          const testCitizen = TEST_CITIZENS.find(
            (c) => c.id === ctx.body.citizenId
          );
          if (!testCitizen) {
            throw new APIError("BAD_REQUEST", { message: "unknown_citizen" });
          }

          return await signInCitizen(ctx, {
            documentId: testCitizen.documentId,
            identityKey: computeIdentityKey(
              testCitizen.identity,
              env.IDENTITY_KEY_SECRET
            ),
          });
        }
      ),
    },
  }) satisfies BetterAuthPlugin;
