import { Card } from "@codegouvfr/react-dsfr/Card";
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
			<div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mt-4w")}>
				<div className={fr.cx("fr-col-12", "fr-col-md-4")}>
					<Card
						title="Transparent"
						desc="Le dépouillement est vérifiable mathématiquement par n'importe qui, sans se déplacer."
						enlargeLink
						linkProps={{
							href: "#"
						}}
					/>
				</div>
				<div className={fr.cx("fr-col-12", "fr-col-md-4")}>
					<Card
						title="Anonyme"
						desc="Votre identité est vérifiée via FranceConnect, mais votre vote reste impossible à relier à vous."
						enlargeLink
						linkProps={{
							href: "#"
						}}
					/>
				</div>
				<div className={fr.cx("fr-col-12", "fr-col-md-4")}>
					<Card
						title="Vérifiable"
						desc="Chaque citoyen peut vérifier que son vote a bien été pris en compte dans le résultat final."
						enlargeLink
						linkProps={{
							href: "#"
						}}
					/>
				</div>
			</div>
		</>
	);
}
