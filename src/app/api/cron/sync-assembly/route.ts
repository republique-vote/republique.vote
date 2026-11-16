import { env } from "env";
import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { syncAuthors } from "@/services/assembly/authors";
import { syncScrutins } from "@/services/assembly/scrutins";
import { syncDossiers } from "@/services/assembly/sync";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return errorResponse("unauthorized", 401);
  }

  const newDossiers = await syncDossiers();
  const matchedScrutins = await syncScrutins();
  const pollsWithAuthors = await syncAuthors();

  console.log(
    `[assembly] Synchro: ${newDossiers} nouveaux dossiers, ${matchedScrutins} scrutins matchés, auteurs ajoutés à ${pollsWithAuthors} votes (${new Date().toISOString()})`
  );

  return successResponse({ newDossiers, matchedScrutins, pollsWithAuthors });
}
