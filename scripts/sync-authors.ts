import "dotenv-flow/config";
import { syncAuthors } from "../src/services/assembly/authors";

async function main() {
  console.log("[assembly] Syncing bill authors and cosignatories...");
  const filled = await syncAuthors();
  console.log(`[assembly] Authors added to ${filled} polls`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[assembly] Author sync failed:", err);
  process.exit(1);
});
