import "dotenv-flow/config";
import { syncSenateVotes } from "../src/services/senate/sync";

async function main() {
  console.log("[senate] Syncing public votes of the Senate...");
  const updated = await syncSenateVotes();
  console.log(`[senate] Senate vote added to ${updated} bills`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[senate] Senate sync failed:", err);
  process.exit(1);
});
