"use client";

import { LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
      <Button className="w-full" onClick={handleFranceConnect} size="lg">
        <LogIn className="mr-2 h-4 w-4" />
        S&apos;identifier avec FranceConnect
      </Button>
      <p className="mt-4 text-muted-foreground text-xs leading-relaxed">
        En développement, un simulateur FranceConnect sera utilisé avec des
        comptes de test fictifs.
      </p>
    </div>
  );
}
