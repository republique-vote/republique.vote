import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Eye, UserCheck } from "lucide-react";

export default function Page() {
	return (
		<>
			{/* Hero */}
			<section className="py-8 md:py-14">
				<h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight max-w-3xl">
					Votez en ligne, vérifiez le dépouillement
				</h1>
				<p className="text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed">
					republique.vote est une plateforme de vote en ligne transparente
					pour les citoyens français. Chaque vote est signé, publié
					publiquement et vérifiable par tous.
				</p>
				<div className="mt-8 flex gap-3">
					<Button size="lg" asChild>
						<Link href="/polls">
							Voir les votes en cours
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</section>

			{/* Features */}
			<section className="py-8 border-t border-border">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="group">
						<div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
							<Eye className="h-6 w-6 text-primary" />
						</div>
						<h3 className="text-lg font-bold mb-2">Transparent</h3>
						<p className="text-sm text-muted-foreground leading-relaxed">
							Le dépouillement est vérifiable mathématiquement par n&apos;importe qui, sans se déplacer.
						</p>
					</div>
					<div className="group">
						<div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
							<ShieldCheck className="h-6 w-6 text-primary" />
						</div>
						<h3 className="text-lg font-bold mb-2">Anonyme</h3>
						<p className="text-sm text-muted-foreground leading-relaxed">
							Votre identité est vérifiée via FranceConnect, mais votre vote reste impossible à relier à vous.
						</p>
					</div>
					<div className="group">
						<div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
							<UserCheck className="h-6 w-6 text-primary" />
						</div>
						<h3 className="text-lg font-bold mb-2">Vérifiable</h3>
						<p className="text-sm text-muted-foreground leading-relaxed">
							Chaque citoyen peut vérifier que son vote a bien été pris en compte dans le résultat final.
						</p>
					</div>
				</div>
			</section>
		</>
	);
}
