import "dotenv-flow/config";
import { syncJourneys } from "../src/services/assembly/journey";

async function main() {
  console.log("[assembly] Syncing the path of each bill in Parliament...");
  const updated = await syncJourneys();
  console.log(`[assembly] Path updated for ${updated} bills`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[assembly] Path sync failed:", err);
  process.exit(1);
});
