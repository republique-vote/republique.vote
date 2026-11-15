"use client";

import type { RequestSuccess } from "@zkpassport/sdk";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FranceConnectUnavailable } from "@/components/auth/franceconnect-unavailable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ZkPassportFlow } from "@/components/zkpassport/zkpassport-flow";
import { TEST_CITIZENS } from "@/services/zkpassport/test-citizens";

const ERROR_MESSAGES: Record<string, string> = {
  identity_conflict:
    "Deux cartes d'identité différentes sont utilisées pour la même identité. L'accès à ce compte est suspendu le temps d'une vérification.",
  invalid_proof: "La preuve n'a pas pu être vérifiée. Réessayez.",
};

async function postSignIn(path: string, body: unknown) {
  const res = await fetch(`/api/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    const code = data?.message ?? "";
    throw new Error(ERROR_MESSAGES[code] ?? "La connexion a échoué.");
  }
}

function useContinueUrl() {
  const searchParams = useSearchParams();
  const rawContinue = searchParams.get("continue") || "/";
  return rawContinue.startsWith("/") && !rawContinue.startsWith("//")
    ? rawContinue
    : "/";
}

export function LoginForm() {
  const continueUrl = useContinueUrl();

  const signInWithProof = async ({ proofs, result }: RequestSuccess) => {
    await postSignIn("/zkpassport/sign-in", { proofs, result });
    // Full reload so every component picks up the new session
    window.location.assign(continueUrl);
  };

  return (
    <div className="mt-8 space-y-4">
      <section className="space-y-6 border border-border bg-card p-6">
        <h2 className="font-medium text-sm">
          Carte d'identité{" "}
          <span className="font-normal text-muted-foreground">
            avec l'application ZKPassport
          </span>
        </h2>
        <ZkPassportFlow onProof={signInWithProof}>
          <p className="text-muted-foreground">Connexion en cours…</p>
        </ZkPassportFlow>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Votre nom, vos prénoms, votre date de naissance et votre sexe servent
          uniquement à empêcher les comptes en double : ils ne sont jamais
          conservés. Votre vote reste impossible à relier à votre identité.
        </p>
      </section>
      <FranceConnectUnavailable />
      {process.env.NODE_ENV === "production" ? null : (
        <TestCitizens continueUrl={continueUrl} />
      )}
    </div>
  );
}

function TestCitizens({ continueUrl }: { continueUrl: string }) {
  const [error, setError] = useState<string | null>(null);

  const signInAs = async (citizenId: string) => {
    setError(null);
    try {
      await postSignIn("/zkpassport/test-sign-in", { citizenId });
      window.location.assign(continueUrl);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-3 border border-border border-dashed p-4">
      <p className="font-medium text-sm">Citoyens fictifs (développement)</p>
      <div className="flex flex-wrap gap-2">
        {TEST_CITIZENS.map((citizen) => (
          <Button
            key={citizen.id}
            onClick={() => signInAs(citizen.id)}
            size="sm"
            type="button"
            variant="outline"
          >
            {citizen.description}
          </Button>
        ))}
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Connexion refusée</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
