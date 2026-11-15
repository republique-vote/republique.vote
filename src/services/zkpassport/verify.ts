import type { ProofResult, QueryResult } from "@zkpassport/sdk";
import { ZKPassport } from "@zkpassport/sdk";
import { env } from "env";
import {
  type CitizenIdentity,
  computeIdentityKey,
  readCitizenIdentity,
} from "@/services/zkpassport/identity";
import {
  requireFrenchAdultIdCard,
  ZKPASSPORT_NULLIFIER_TYPE,
  ZKPASSPORT_SCOPE,
} from "@/services/zkpassport/query";

export type CitizenVerification =
  | {
      verified: true;
      documentId: string;
      identity: CitizenIdentity;
      identityKey: string;
    }
  | { verified: false; queryResultErrors: unknown };

// Proofs are bound to the domain the browser requested them from
const zkPassport = new ZKPassport(new URL(env.AUTH_BASE_URL).hostname);

export async function verifyCitizenProof(
  proofs: ProofResult[],
  result: QueryResult
): Promise<CitizenVerification> {
  // Recreated server-side so a tampered query cannot pass
  const { query } = requireFrenchAdultIdCard(zkPassport.createQuery()).done();

  const { verified, uniqueIdentifier, queryResultErrors } =
    await zkPassport.verify({
      proofs,
      originalQuery: query,
      queryResult: result,
      scope: ZKPASSPORT_SCOPE,
      uniqueIdentifierType: ZKPASSPORT_NULLIFIER_TYPE,
      verifierMode: "local",
    });

  if (!(verified && uniqueIdentifier)) {
    return { verified: false, queryResultErrors: queryResultErrors ?? null };
  }

  const identity = readCitizenIdentity(result);

  return {
    verified: true,
    documentId: uniqueIdentifier,
    identity,
    identityKey: computeIdentityKey(identity, env.IDENTITY_KEY_SECRET),
  };
}
