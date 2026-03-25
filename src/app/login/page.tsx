"use client";

import { signIn } from "@/services/auth/client";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function LoginPage() {
	const handleFranceConnect = () => {
		signIn.oauth2({
			providerId: "franceconnect",
			callbackURL: "/",
		});
	};

	return (
		<div className="max-w-lg">
			<h1 className="text-3xl font-bold tracking-tight">Se connecter</h1>
			<p className="text-lg text-muted-foreground mt-3 leading-relaxed">
				Identifiez-vous pour accéder aux votes et participer.
			</p>
			<div className="mt-8 p-6 border border-border rounded-sm bg-card">
				<Button size="lg" onClick={handleFranceConnect} className="w-full">
					<LogIn className="mr-2 h-4 w-4" />
					S&apos;identifier avec FranceConnect
				</Button>
				<p className="text-xs text-muted-foreground mt-4 leading-relaxed">
					En développement, un simulateur FranceConnect sera utilisé avec des
					comptes de test fictifs.
				</p>
			</div>
		</div>
	);
}
