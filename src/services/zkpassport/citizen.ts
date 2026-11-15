import { eq } from "drizzle-orm";
import { db } from "@/db";
import { citizen, retiredDocument } from "@/db/schema";

export interface CitizenProof {
  documentId: string;
  identityKey: string;
}

export type CitizenResolution =
  | { kind: "existing"; userId: string }
  | { kind: "new" }
  | { kind: "conflict" };

// Decides which account a verified card opens:
// - known card: its account
// - new card of a known identity (renewal, lost card): the newest card wins
// - card already replaced by a newer one: two cards of one identity are in
//   use, so the account is frozen until a human resolves it
export async function resolveCitizen({
  documentId,
  identityKey,
}: CitizenProof): Promise<CitizenResolution> {
  const retired = await db.query.retiredDocument.findFirst({
    where: eq(retiredDocument.documentId, documentId),
  });

  if (retired) {
    await db
      .update(citizen)
      .set({ conflict: true, updatedAt: new Date() })
      .where(eq(citizen.userId, retired.userId));
    return { kind: "conflict" };
  }

  const byDocument = await db.query.citizen.findFirst({
    where: eq(citizen.documentId, documentId),
  });

  if (byDocument) {
    return byDocument.conflict
      ? { kind: "conflict" }
      : { kind: "existing", userId: byDocument.userId };
  }

  const byIdentity = await db.query.citizen.findFirst({
    where: eq(citizen.identityKey, identityKey),
  });

  if (!byIdentity) {
    return { kind: "new" };
  }

  if (byIdentity.conflict) {
    return { kind: "conflict" };
  }

  await db.transaction(async (tx) => {
    await tx.insert(retiredDocument).values({
      documentId: byIdentity.documentId,
      userId: byIdentity.userId,
    });
    await tx
      .update(citizen)
      .set({ documentId, updatedAt: new Date() })
      .where(eq(citizen.userId, byIdentity.userId));
  });

  return { kind: "existing", userId: byIdentity.userId };
}

export async function linkCitizen(userId: string, proof: CitizenProof) {
  await db.insert(citizen).values({ userId, ...proof });
}
