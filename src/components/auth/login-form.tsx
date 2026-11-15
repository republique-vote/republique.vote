"use client";

import type { RequestSuccess } from "@zkpassport/sdk";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { FranceConnectUnavailable } from "@/components/auth/franceconnect-unavailable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ZkPassportFlow } from "@/components/zkpassport/zkpassport-flow";
import {
  displayNameFromProof,
  formatDisplayName,
  saveDisplayName,
} from "@/services/zkpassport/display-name";
import type { CitizenIdentity } from "@/services/zkpassport/identity";
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

// Read at sign-in time rather than with useSearchParams, which would force
// the whole form to render client-side only on a static page
function redirectAfterSignIn() {
  const rawContinue =
    new URLSearchParams(window.location.search).get("continue") || "/";
  const continueUrl =
    rawContinue.startsWith("/") && !rawContinue.startsWith("//")
      ? rawContinue
      : "/";
  // Full reload so every component picks up the new session
  window.location.assign(continueUrl);
}

export function LoginForm() {
  const signInWithProof = async ({ proofs, result }: RequestSuccess) => {
    await postSignIn("/zkpassport/sign-in", { proofs, result });
    saveDisplayName(displayNameFromProof(result));
    redirectAfterSignIn();
  };

  return (
    // Two columns on desktop: the available method next to the others
    <div className="mt-8 grid items-start gap-4 md:grid-cols-2">
      <section className="space-y-4 border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 font-medium text-sm">
          Carte d'identité
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="cursor-help" type="button">
                <Badge variant="outline">
                  Application ZKPassport
                  <HelpCircle />
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Application open source qui lit la puce de votre carte
                d'identité et produit une preuve mathématique : nous apprenons
                que vous êtes un citoyen français majeur, sans recevoir votre
                carte.
              </p>
            </TooltipContent>
          </Tooltip>
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
      <div className="space-y-4">
        <FranceConnectUnavailable />
        {process.env.NODE_ENV === "production" ? null : <TestCitizens />}
      </div>
    </div>
  );
}

function TestCitizens() {
  const [error, setError] = useState<string | null>(null);

  const signInAs = async (citizenId: string, identity: CitizenIdentity) => {
    setError(null);
    try {
      await postSignIn("/zkpassport/test-sign-in", { citizenId });
      saveDisplayName(
        formatDisplayName(identity.givenNames, identity.lastname)
      );
      redirectAfterSignIn();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-3 border border-border border-dashed p-4">
      <p className="flex items-center gap-2 font-medium text-sm">
        Citoyens fictifs
        <Badge variant="outline">Développement</Badge>
      </p>
      <div className="flex flex-wrap gap-2">
        {TEST_CITIZENS.map((citizen) => (
          <Button
            key={citizen.id}
            onClick={() => signInAs(citizen.id, citizen.identity)}
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
