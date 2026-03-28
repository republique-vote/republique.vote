import { ArrowRight, Eye, ShieldCheck, UserCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <>
      {/* Hero */}
      <section className="py-8 md:py-14">
        <h1 className="max-w-3xl font-bold text-3xl leading-tight tracking-tight md:text-5xl">
          Votez en ligne, vérifiez le dépouillement
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          republique.vote est une plateforme de vote en ligne transparente pour
          les citoyens français. Chaque vote est signé, publié publiquement et
          vérifiable par tous.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href="/polls">
              Voir les votes en cours
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-border border-t py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="group">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-bold text-lg">Transparent</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Le dépouillement est vérifiable mathématiquement par
              n&apos;importe qui, sans se déplacer.
            </p>
          </div>
          <div className="group">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-bold text-lg">Anonyme</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Votre identité est vérifiée via FranceConnect, mais votre vote
              reste impossible à relier à vous.
            </p>
          </div>
          <div className="group">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-bold text-lg">Vérifiable</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Chaque citoyen peut vérifier que son vote a bien été pris en
              compte dans le résultat final.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
