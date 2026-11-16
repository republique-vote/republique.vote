import "dotenv-flow/config";
import { syncAuthors } from "../src/services/assembly/authors";
import { syncJourneys } from "../src/services/assembly/journey";
import { syncScrutins } from "../src/services/assembly/scrutins";
import { syncDossiers } from "../src/services/assembly/sync";
import { syncScrutinVotes } from "../src/services/assembly/votes";
import { syncSenateVotes } from "../src/services/senate/sync";
import { syncSenateNominativeVotes } from "../src/services/senate/votes";

async function main() {
  console.log("[assembly] Starting manual sync...");

  const newDossiers = await syncDossiers();
  console.log(`[assembly] ${newDossiers} new legislative files imported`);

  const matchedScrutins = await syncScrutins();
  console.log(`[assembly] ${matchedScrutins} scrutins matched`);

  const updatedJourneys = await syncJourneys();
  console.log(`[assembly] Path updated for ${updatedJourneys} bills`);

  const pollsWithAuthors = await syncAuthors();
  console.log(`[assembly] Authors added to ${pollsWithAuthors} polls`);

  const pollsWithVotes = await syncScrutinVotes();
  console.log(`[assembly] Nominative votes added to ${pollsWithVotes} polls`);

  const billsWithSenateVote = await syncSenateVotes();
  console.log(`[senate] Senate vote added to ${billsWithSenateVote} bills`);

  const pollsWithSenators = await syncSenateNominativeVotes();
  console.log(`[senate] Senators' votes added to ${pollsWithSenators} polls`);

  console.log("[assembly] Sync complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("[assembly] Sync failed:", err);
  process.exit(1);
});
