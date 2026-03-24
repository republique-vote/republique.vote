"use client";

import { signIn } from "@/lib/auth-client";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

export default function LoginPage() {
	const handleFranceConnect = () => {
		signIn.oauth2({
			providerId: "franceconnect",
			callbackURL: "/",
		});
	};

	return (
		<>
			<StartDsfrOnHydration />
			<h1>Se connecter</h1>
			<p className="fr-text--lead fr-mt-3w">
				Identifiez-vous pour accéder aux scrutins et voter.
			</p>
			<div className="fr-mt-4w">
				<button
					className="fr-btn fr-btn--lg"
					onClick={handleFranceConnect}
				>
					S&apos;identifier avec FranceConnect
				</button>
				<p className="fr-text--sm fr-mt-2w" style={{ color: "#666" }}>
					En développement, un simulateur FranceConnect sera utilisé avec des
					comptes de test fictifs.
				</p>
			</div>
		</>
	);
}
