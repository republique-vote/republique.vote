import "dotenv-flow/config";
import { seedHistoricalReferendums } from "../src/services/referendum/history";

async function main() {
  const created = await seedHistoricalReferendums();
  console.log(`[referendum] ${created} historical referendums created`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[referendum] Seed failed:", err);
  process.exit(1);
});
