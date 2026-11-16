import "dotenv-flow/config";
import { syncCongress } from "../src/services/assembly/congress";
import { syncJourneys } from "../src/services/assembly/journey";
import { syncScrutins } from "../src/services/assembly/scrutins";
import { importDossierById } from "../src/services/assembly/sync";
import { syncScrutinVotes } from "../src/services/assembly/votes";
import { syncSenateVotes } from "../src/services/senate/sync";
import { syncSenateNominativeVotes } from "../src/services/senate/votes";

// Constitutional revisions adopted by the Congrès before the current
// legislature, imported once with every vote on them
const REVISIONS = [
  // Liberté de recourir à l'interruption volontaire de grossesse, 2024
  { legislature: "16", dossier: "DLR5L16N49095" },
];

async function main() {
  for (const { legislature, dossier } of REVISIONS) {
    const imported = await importDossierById(legislature, dossier);
    console.log(
      `[congress] ${dossier} ${imported ? "imported" : "already there"}`
    );
    await syncScrutins(legislature, new Set([dossier]));
    await syncScrutinVotes(legislature);
    await syncJourneys(legislature);
    const congress = await syncCongress(legislature);
    console.log(`[congress] Congrès vote added to ${congress} bills`);
  }
  await syncSenateVotes();
  await syncSenateNominativeVotes();
  console.log("[congress] Done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[congress] Import failed:", err);
  process.exit(1);
});
