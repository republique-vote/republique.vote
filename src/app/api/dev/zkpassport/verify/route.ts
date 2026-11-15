import type { ProofResult, QueryResult } from "@zkpassport/sdk";
import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { verifyCitizenProof } from "@/services/zkpassport/verify";

// Feasibility check only: verifies a proof without creating any session.
// Echoing the identity back is only acceptable on this local test page.
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

  try {
    return successResponse(await verifyCitizenProof(body.proofs, body.result));
  } catch (err) {
    console.error("zkpassport verify error:", err);
    return errorResponse("verification_failed", 500);
  }
}
