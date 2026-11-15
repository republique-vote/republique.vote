"use client";

import { parseApiResponse } from "@republique/core";
import type { RequestSuccess } from "@zkpassport/sdk";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ZkPassportFlow } from "@/components/zkpassport/zkpassport-flow";
import type { CitizenIdentity } from "@/services/zkpassport/identity";

type VerifyResponse =
  | {
      verified: true;
      documentId: string;
      identity: CitizenIdentity;
      identityKey: string;
    }
  | { verified: false; queryResultErrors: unknown };

export function ZkPassportTest() {
  const [response, setResponse] = useState<VerifyResponse | null>(null);

  const verifyOnServer = async ({ proofs, result }: RequestSuccess) => {
    const res = await fetch("/api/dev/zkpassport/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofs, result }),
    });
    setResponse(await parseApiResponse<VerifyResponse>(res));
  };

  return (
    <div className="mt-8">
      <ZkPassportFlow onProof={verifyOnServer}>
        {response ? <ResultView response={response} /> : null}
      </ZkPassportFlow>
    </div>
  );
}

function ResultView({ response }: { response: VerifyResponse }) {
  if (!response.verified) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Preuve rejetée</AlertTitle>
        <AlertDescription>
          <pre className="mt-2 overflow-x-auto text-xs">
            {JSON.stringify(response.queryResultErrors, null, 2)}
          </pre>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="success">
      <AlertTitle>
        Preuve valide : citoyen français majeur, carte d'identité
      </AlertTitle>
      <AlertDescription>
        <p className="mt-2">
          Identifiant de la carte (doit être identique d'un scan à l'autre) :
        </p>
        <code className="mt-1 block break-all text-xs">
          {response.documentId}
        </code>
        <p className="mt-4">
          Données lues sur la puce (affichées uniquement sur cette page de test,
          jamais conservées) :
        </p>
        <pre className="mt-1 overflow-x-auto text-xs">
          {JSON.stringify(response.identity, null, 2)}
        </pre>
        <p className="mt-4">
          Clé d'identité (doit survivre à un renouvellement de carte) :
        </p>
        <code className="mt-1 block break-all text-xs">
          {response.identityKey}
        </code>
      </AlertDescription>
    </Alert>
  );
}
