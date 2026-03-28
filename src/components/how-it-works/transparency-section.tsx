import { GitBranch, ShieldCheck } from "lucide-react";

export function TransparencySection() {
  return (
    <section className="border-border border-t py-8">
      <h2 className="mb-2 font-bold text-2xl">
        Comment on prouve qu&apos;on ne triche pas ?
      </h2>
      <p className="mb-8 max-w-2xl text-muted-foreground leading-relaxed">
        Imaginons que quelqu&apos;un nous accuse d&apos;avoir modifié les votes
        pendant la nuit. Comment prouver que c&apos;est faux ? En envoyant une
        copie de l&apos;empreinte du cahier à des gens qu&apos;on ne contrôle
        pas, à chaque vote. Si on change quoi que ce soit après coup,
        l&apos;empreinte ne correspond plus et tout le monde le voit.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-border p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center bg-accent">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 font-bold">Le notaire (Sigstore)</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            À chaque vote, on envoie l&apos;empreinte du cahier à un « notaire
            numérique » appelé{" "}
            <a
              className="font-medium text-primary underline hover:text-primary/80"
              href="https://docs.sigstore.dev/logging/overview/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Sigstore
            </a>
            . C&apos;est un service public et gratuit, géré par la Linux
            Foundation (Google, Red Hat, GitHub...). Le notaire écrit
            l&apos;empreinte dans son propre cahier avec la date et
            l&apos;heure, puis il tamponne. Une fois tamponné, personne ne peut
            modifier ou effacer cette ligne. Ni nous, ni le notaire.
          </p>
          <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
            Vous pouvez vérifier chaque tampon vous-même sur{" "}
            <a
              className="font-medium text-primary underline hover:text-primary/80"
              href="https://search.sigstore.dev"
              rel="noopener noreferrer"
              target="_blank"
            >
              search.sigstore.dev
            </a>
            .
          </p>
        </div>
        <div className="border border-border p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center bg-accent">
            <GitBranch className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 font-bold">Le tableau public (GitHub)</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            En plus du notaire, on affiche l&apos;empreinte du cahier sur un{" "}
            <a
              className="font-medium text-primary underline hover:text-primary/80"
              href="https://github.com/republique-vote/merkle-proofs"
              rel="noopener noreferrer"
              target="_blank"
            >
              tableau public sur GitHub
            </a>
            . C&apos;est comme un panneau d&apos;affichage dans la rue :
            n&apos;importe qui peut le lire, personne ne peut effacer ce qui a
            déjà été écrit, et chaque mise à jour est datée. Si on essayait de
            modifier un ancien affichage, tout le monde verrait la modification
            dans l&apos;historique.
          </p>
        </div>
      </div>
    </section>
  );
}
