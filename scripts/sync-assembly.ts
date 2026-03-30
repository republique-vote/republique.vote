import "dotenv-flow/config";
import { syncScrutins } from "../src/services/assembly/scrutins";
import { syncDossiers } from "../src/services/assembly/sync";

async function main() {
  console.log("[assembly] Starting manual sync...");

  const newDossiers = await syncDossiers();
  console.log(`[assembly] ${newDossiers} new legislative files imported`);

  const matchedScrutins = await syncScrutins();
  console.log(`[assembly] ${matchedScrutins} scrutins matched`);

  console.log("[assembly] Sync complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("[assembly] Sync failed:", err);
  process.exit(1);
});
