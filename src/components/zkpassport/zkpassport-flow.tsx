"use client";

import { type RequestSuccess, ZKPassport } from "@zkpassport/sdk";
import { type ReactNode, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  requireFrenchAdultIdCard,
  ZKPASSPORT_NULLIFIER_TYPE,
  ZKPASSPORT_PURPOSE,
  ZKPASSPORT_SCOPE,
} from "@/services/zkpassport/query";

type Step =
  | { kind: "loading" }
  | { kind: "waiting"; url: string }
  | { kind: "received" }
  | { kind: "generating" }
  | { kind: "verifying" }
  | { kind: "done" }
  | { kind: "rejected" }
  | { kind: "error"; message: string };

const STEP_LABELS: Partial<Record<Step["kind"], string>> = {
  loading: "Préparation de la requête…",
  received: "Requête reçue sur le téléphone. Acceptez-la dans l'application.",
  generating: "Génération de la preuve sur le téléphone…",
  verifying: "Vérification de la preuve…",
};

interface ZkPassportFlowProps {
  // Shown once onProof resolved
  children?: ReactNode;
  // Sends the proof to the server; a thrown error message is shown to the user
  onProof: (success: RequestSuccess) => Promise<void>;
}

export function ZkPassportFlow(props: ZkPassportFlowProps) {
  // Remounting the request with a new key starts a fresh one
  const [attempt, setAttempt] = useState(0);
  return (
    <ZkPassportRequest
      key={attempt}
      onRestart={() => setAttempt((n) => n + 1)}
      {...props}
    />
  );
}

function ZkPassportRequest({
  children,
  onProof,
  onRestart,
}: ZkPassportFlowProps & { onRestart: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "loading" });
  // The request is created once: read the latest callback without restarting it
  const onProofRef = useRef(onProof);
  onProofRef.current = onProof;

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
          await onProofRef.current(success);
          update({ kind: "done" });
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
    <div className="space-y-6">
      {step.kind === "done" ? children : <StepView step={step} />}
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
