import "dotenv-flow/config";
import postgres from "postgres";
import { env } from "../env";

const sql = postgres(env.DATABASE_URL);

// The fictional polls of the first demo were mistaken for real ones next to
// the bills of the Assemblée: remove them from existing databases. Real
// content comes from the syncs and from seed-referendums.ts
const DEMO_POLLS = ["poll-1", "poll-2", "poll-3"];

async function seed() {
  // Children first; rerunning after a failure finishes the job
  await sql`DELETE FROM vote_record WHERE poll_id IN ${sql(DEMO_POLLS)}`;
  await sql`DELETE FROM rekor_entry WHERE poll_id IN ${sql(DEMO_POLLS)}`;
  await sql`DELETE FROM blind_signature_request WHERE poll_id IN ${sql(DEMO_POLLS)}`;
  await sql`DELETE FROM poll_key_pair WHERE poll_id IN ${sql(DEMO_POLLS)}`;
  await sql`DELETE FROM option WHERE poll_id IN ${sql(DEMO_POLLS)}`;
  const removed = await sql`DELETE FROM poll WHERE id IN ${sql(DEMO_POLLS)}`;
  console.log(`Seed: ${removed.count} demo polls removed`);
  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
