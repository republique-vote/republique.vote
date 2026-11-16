import "dotenv-flow/config";
import { syncScrutinVotes } from "../src/services/assembly/votes";

async function main() {
  console.log("[assembly] Syncing nominative votes of official scrutins...");
  const filled = await syncScrutinVotes();
  console.log(`[assembly] Nominative votes added to ${filled} polls`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[assembly] Vote sync failed:", err);
  process.exit(1);
});
