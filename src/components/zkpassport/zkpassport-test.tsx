"use client";

import { parseApiResponse } from "@republique/core";
import { type RequestSuccess, ZKPassport } from "@zkpassport/sdk";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { CitizenIdentity } from "@/services/zkpassport/identity";
import {
  requireFrenchAdultIdCard,
  ZKPASSPORT_NULLIFIER_TYPE,
  ZKPASSPORT_PURPOSE,
  ZKPASSPORT_SCOPE,
} from "@/services/zkpassport/query";

interface VerifyResponse {
  identity: CitizenIdentity | null;
  identityKey: string | null;
  queryResultErrors: unknown;
  uniqueIdentifier: string | null;
  verified: boolean;
}

type Step =
  | { kind: "loading" }
  | { kind: "waiting"; url: string }
  | { kind: "received" }
  | { kind: "generating" }
  | { kind: "verifying" }
  | { kind: "done"; response: VerifyResponse }
  | { kind: "rejected" }
  | { kind: "error"; message: string };

const STEP_LABELS: Partial<Record<Step["kind"], string>> = {
  loading: "Préparation de la requête…",
  received: "Requête reçue sur le téléphone. Acceptez-la dans l'application.",
  generating: "Génération de la preuve sur le téléphone…",
  verifying: "Vérification de la preuve sur le serveur…",
};

async function verifyOnServer({ proofs, result }: RequestSuccess) {
  const res = await fetch("/api/dev/zkpassport/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proofs, result }),
  });
  return parseApiResponse<VerifyResponse>(res);
}

export function ZkPassportTest() {
  // Remounting the request with a new key starts a fresh one
  const [attempt, setAttempt] = useState(0);
  return (
    <ZkPassportRequest
      key={attempt}
      onRestart={() => setAttempt((n) => n + 1)}
    />
  );
}

function ZkPassportRequest({ onRestart }: { onRestart: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    let requestId: string | undefined;
    const zkPassport = new ZKPassport();
    const update = (next: Step) => {
      if (!cancelled) {
        setStep(next);
      }
    };

    const start = async () => {
      const builder = await zkPassport.request({
        name: "republique.vote",
        purpose: ZKPASSPORT_PURPOSE,
        scope: ZKPASSPORT_SCOPE,
        uniqueIdentifierType: ZKPASSPORT_NULLIFIER_TYPE,
        verifierMode: "local",
      });
      const request = requireFrenchAdultIdCard(builder).done();
      requestId = request.requestId;

      request.onRequestReceived(() => update({ kind: "received" }));
      request.onGeneratingProof(() => update({ kind: "generating" }));
      request.onReject(() => update({ kind: "rejected" }));
      request.onError((message) => update({ kind: "error", message }));
      request.onSuccess(async (success) => {
        update({ kind: "verifying" });
        try {
          update({ kind: "done", response: await verifyOnServer(success) });
        } catch (err) {
          update({ kind: "error", message: (err as Error).message });
        }
      });

      update({ kind: "waiting", url: request.url });
    };

    start().catch((err: Error) =>
      update({ kind: "error", message: err.message })
    );

    return () => {
      cancelled = true;
      if (requestId) {
        zkPassport.cancelRequest(requestId);
      }
    };
  }, []);

  return (
    <div className="mt-8 space-y-6">
      <StepView step={step} />
      {step.kind === "waiting" ? null : (
        <Button onClick={onRestart} type="button" variant="outline">
          Recommencer
        </Button>
      )}
    </div>
  );
}

function StepView({ step }: { step: Step }) {
  if (step.kind === "waiting") {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Scannez ce QR code avec l'application ZKPassport, puis scannez votre
          carte d'identité.
        </p>
        <div className="inline-block border border-border bg-white p-4">
          <QRCode size={240} value={step.url} />
        </div>
        <p className="text-sm">
          Sur téléphone :{" "}
          <a className="text-primary underline" href={step.url}>
            ouvrir dans ZKPassport
          </a>
        </p>
      </div>
    );
  }

  if (step.kind === "done") {
    return <ResultView response={step.response} />;
  }

  if (step.kind === "rejected") {
    return (
      <Alert variant="warning">
        <AlertTitle>Requête refusée sur le téléphone</AlertTitle>
      </Alert>
    );
  }

  if (step.kind === "error") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{step.message}</AlertDescription>
      </Alert>
    );
  }

  return <p className="text-muted-foreground">{STEP_LABELS[step.kind]}</p>;
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
          Identifiant unique (doit être identique d'un scan à l'autre) :
        </p>
        <code className="mt-1 block break-all text-xs">
          {response.uniqueIdentifier}
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
          {response.identityKey ?? "IDENTITY_KEY_SECRET manquant"}
        </code>
      </AlertDescription>
    </Alert>
  );
}
