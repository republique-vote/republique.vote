import { Card } from "@codegouvfr/react-dsfr/Card";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";
import { StartDsfrOnHydration } from "../dsfr-bootstrap";

export default function Page() {
	return (
		<>
			<StartDsfrOnHydration />
			<h1>Votez en ligne, vérifiez le dépouillement</h1>
			<p className={fr.cx("fr-text--lead", "fr-mt-3w")}>
				republique.vote est une plateforme de vote en ligne transparente
				pour les citoyens français. Chaque vote est chiffré, publié
				publiquement et vérifiable par tous.
			</p>
			<Button
				className={fr.cx("fr-mt-3w")}
				linkProps={{ href: "/polls" }}
				size="large"
			>
				Voir les votes en cours
			</Button>
			<div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mt-6w")}>
				<div className={fr.cx("fr-col-12", "fr-col-md-4")}>
					<Card
						title="Transparent"
						desc="Le dépouillement est vérifiable mathématiquement par n'importe qui, sans se déplacer."
						enlargeLink
						linkProps={{
							href: "/polls"
						}}
					/>
				</div>
				<div className={fr.cx("fr-col-12", "fr-col-md-4")}>
					<Card
						title="Anonyme"
						desc="Votre identité est vérifiée via FranceConnect, mais votre vote reste impossible à relier à vous."
						enlargeLink
						linkProps={{
							href: "/polls"
						}}
					/>
				</div>
				<div className={fr.cx("fr-col-12", "fr-col-md-4")}>
					<Card
						title="Vérifiable"
						desc="Chaque citoyen peut vérifier que son vote a bien été pris en compte dans le résultat final."
						enlargeLink
						linkProps={{
							href: "/polls"
						}}
					/>
				</div>
			</div>
		</>
	);
}
