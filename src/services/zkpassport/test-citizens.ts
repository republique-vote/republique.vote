import type { CitizenIdentity } from "@/services/zkpassport/identity";

export interface TestCitizen {
  description: string;
  documentId: string;
  id: string;
  identity: CitizenIdentity;
}

const ANGELA: CitizenIdentity = {
  lastname: "DUBOIS",
  givenNames: "ANGELA CLAIRE LOUISE",
  birthdate: "1962-08-24",
  gender: "F",
};

// Fictional citizens for local development, where scanning a real card is
// not practical. They go through the same account resolution as real proofs.
export const TEST_CITIZENS: TestCitizen[] = [
  {
    id: "angela",
    description: "Angela Dubois",
    documentId: "test-card-angela-2015",
    identity: ANGELA,
  },
  {
    id: "angela-renewed",
    description: "Angela Dubois, carte renouvelée",
    documentId: "test-card-angela-2030",
    identity: ANGELA,
  },
  {
    id: "pierre",
    description: "Pierre Mercier",
    documentId: "test-card-pierre",
    identity: {
      lastname: "MERCIER",
      givenNames: "PIERRE",
      birthdate: "1969-03-17",
      gender: "M",
    },
  },
  {
    id: "melissandre",
    description: "Mélissandre Trois-Dupré",
    documentId: "test-card-melissandre",
    identity: {
      lastname: "TROIS DUPRE",
      givenNames: "MELISSANDRE JULIETTE",
      birthdate: "1981-02-04",
      gender: "F",
    },
  },
];
