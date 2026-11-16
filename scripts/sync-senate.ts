import "dotenv-flow/config";
import { syncSenateVotes } from "../src/services/senate/sync";
import { syncSenateNominativeVotes } from "../src/services/senate/votes";

async function main() {
  console.log("[senate] Syncing public votes of the Senate...");
  const updated = await syncSenateVotes();
  console.log(`[senate] Senate vote added to ${updated} bills`);
  const withSenators = await syncSenateNominativeVotes();
  console.log(`[senate] Senators' votes added to ${withSenators} polls`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[senate] Senate sync failed:", err);
  process.exit(1);
});
