import { NullifierType, type QueryBuilder } from "@zkpassport/sdk";

// Drives the unique identifier: changing it gives every citizen a new identity
export const ZKPASSPORT_SCOPE = "citizen";

// Salted identifiers cannot be recomputed from chip data, even by the issuing State
export const ZKPASSPORT_NULLIFIER_TYPE = NullifierType.SALTED;

// Shown to the citizen in the app before they accept the request
export const ZKPASSPORT_PURPOSE =
  "Prouver que vous êtes un citoyen français majeur. Vos nom, prénoms, date de naissance et sexe servent uniquement à empêcher les doublons et ne sont jamais conservés.";

// Shared by the browser request and the server verification so a tampered
// query cannot pass. Only national ID cards are accepted: a citizen holds a
// single valid one, while a passport would yield a second identifier. The
// identity attributes feed the identity key that catches renewed or
// lost-and-replaced cards.
export function requireFrenchAdultIdCard(
  builder: QueryBuilder | QueryBuilder<"offline">
): QueryBuilder {
  return (
    builder
      .eq("nationality", "FRA")
      .eq("document_type", "id_card")
      .gte("age", 18)
      .disclose("lastname")
      // "firstname" stops at the first given name, "fullname" keeps them all
      .disclose("fullname")
      .disclose("birthdate")
      .disclose("gender")
      .facematch("strict")
  );
}
