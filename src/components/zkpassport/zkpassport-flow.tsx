"use client";

import { type RequestSuccess, ZKPassport } from "@zkpassport/sdk";
import { type ReactNode, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
      {step.kind === "waiting" || step.kind === "loading" ? null : (
        <Button onClick={onRestart} type="button" variant="outline">
          Recommencer
        </Button>
      )}
    </div>
  );
}

function StepView({ step }: { step: Step }) {
  if (step.kind === "waiting") {
    return <WaitingView url={step.url} />;
  }

  // Same layout as the QR code view, so nothing moves once the request is ready
  if (step.kind === "loading") {
    return <WaitingView />;
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

// QR code plus its padding and border
const QR_BOX_SIZE = 274;

// Both layouts are rendered and CSS picks one: a touch-first device is most
// likely the phone that holds the app. Deciding in CSS rather than JS means
// the server HTML is already right, with no switch after hydration.
function WaitingView({ url }: { url?: string }) {
  const qrCode = url ? (
    <div className="inline-block border border-border bg-white p-4">
      <QRCode size={240} value={url} />
    </div>
  ) : (
    <Skeleton borderRadius="0" height={QR_BOX_SIZE} width={QR_BOX_SIZE} />
  );

  return (
    <>
      <div className="pointer-coarse:block hidden space-y-4">
        <p className="text-muted-foreground">
          Ouvrez l'application ZKPassport, puis scannez votre carte d'identité.
        </p>
        {url ? (
          <Button asChild className="w-full" size="lg">
            <a href={url}>Ouvrir ZKPassport</a>
          </Button>
        ) : (
          <Skeleton borderRadius="0" height="2.25rem" />
        )}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            ZKPassport est installé sur un autre téléphone ?
          </summary>
          <div className="mt-4">{qrCode}</div>
        </details>
      </div>
      <div className="pointer-coarse:hidden space-y-4">
        <p className="text-muted-foreground">
          Scannez ce QR code avec l'application ZKPassport sur votre téléphone,
          puis scannez votre carte d'identité.
        </p>
        {qrCode}
      </div>
    </>
  );
}
