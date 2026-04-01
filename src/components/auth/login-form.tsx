"use client";

import { useSearchParams } from "next/navigation";
import { FranceConnectButton } from "@/components/auth/franceconnect-button";
import { signIn } from "@/services/auth/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const rawContinue = searchParams.get("continue") || "/";
  const continueUrl =
    rawContinue.startsWith("/") && !rawContinue.startsWith("//")
      ? rawContinue
      : "/";

  const handleFranceConnect = () => {
    signIn.oauth2({
      providerId: "franceconnect",
      callbackURL: continueUrl,
    });
  };

  return (
    <div className="mt-8 rounded-sm border border-border bg-card p-6">
      <FranceConnectButton onClick={handleFranceConnect} />
      <p className="mt-4 text-center text-muted-foreground text-xs leading-relaxed">
        En développement, un simulateur FranceConnect sera utilisé avec des
        comptes de test fictifs.
      </p>
    </div>
  );
}
