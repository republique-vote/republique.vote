import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="max-w-lg">
      <h1 className="font-bold text-3xl tracking-tight">Se connecter</h1>
      <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
        Identifiez-vous pour accéder aux votes et participer.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
