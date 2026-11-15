import type { ProofResult, QueryResult } from "@zkpassport/sdk";
import { ZKPassport } from "@zkpassport/sdk";
import { env } from "env";
import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  computeIdentityKey,
  readCitizenIdentity,
} from "@/services/zkpassport/identity";
import {
  requireFrenchAdultIdCard,
  ZKPASSPORT_NULLIFIER_TYPE,
  ZKPASSPORT_SCOPE,
} from "@/services/zkpassport/query";

// Feasibility check only: verifies a proof without creating any session
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return errorResponse("not_found", 404);
  }

  const body = (await request.json()) as {
    proofs?: ProofResult[];
    result?: QueryResult;
  };

  if (!(body.proofs && body.result)) {
    return errorResponse("missing_proofs", 400);
  }

  // The SDK binds proofs to the domain the browser requested them from
  const zkPassport = new ZKPassport(request.nextUrl.hostname);
  const { query } = requireFrenchAdultIdCard(zkPassport.createQuery()).done();

  try {
    const { verified, uniqueIdentifier, queryResultErrors } =
      await zkPassport.verify({
        proofs: body.proofs,
        originalQuery: query,
        queryResult: body.result,
        scope: ZKPASSPORT_SCOPE,
        uniqueIdentifierType: ZKPASSPORT_NULLIFIER_TYPE,
        verifierMode: "local",
      });

    if (!verified) {
      return successResponse({
        verified,
        uniqueIdentifier: null,
        identity: null,
        identityKey: null,
        queryResultErrors: queryResultErrors ?? null,
      });
    }

    // Echoing the identity back is only acceptable on this local test page
    const identity = readCitizenIdentity(body.result);
    const identityKey = env.IDENTITY_KEY_SECRET
      ? computeIdentityKey(identity, env.IDENTITY_KEY_SECRET)
      : null;

    return successResponse({
      verified,
      uniqueIdentifier: uniqueIdentifier ?? null,
      identity,
      identityKey,
      queryResultErrors: null,
    });
  } catch (err) {
    console.error("zkpassport verify error:", err);
    return errorResponse("verification_failed", 500);
  }
}
