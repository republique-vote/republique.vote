import "dotenv-flow/config";
import { syncAuthors } from "../src/services/assembly/authors";
import { syncScrutins } from "../src/services/assembly/scrutins";
import { syncDossiers } from "../src/services/assembly/sync";
import { syncScrutinVotes } from "../src/services/assembly/votes";

async function main() {
  console.log("[assembly] Starting manual sync...");

  const newDossiers = await syncDossiers();
  console.log(`[assembly] ${newDossiers} new legislative files imported`);

  const matchedScrutins = await syncScrutins();
  console.log(`[assembly] ${matchedScrutins} scrutins matched`);

  const pollsWithAuthors = await syncAuthors();
  console.log(`[assembly] Authors added to ${pollsWithAuthors} polls`);

  const pollsWithVotes = await syncScrutinVotes();
  console.log(`[assembly] Nominative votes added to ${pollsWithVotes} polls`);

  console.log("[assembly] Sync complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("[assembly] Sync failed:", err);
  process.exit(1);
});
