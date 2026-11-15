import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-bold text-3xl tracking-tight">Se connecter</h1>
      <p className="mt-3 max-w-lg text-lg text-muted-foreground leading-relaxed">
        Identifiez-vous pour accéder aux votes et participer.
      </p>
      <LoginForm />
    </div>
  );
}
