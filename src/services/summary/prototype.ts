import type { BillSummary } from "@/services/summary/summarize";

// Prototype output, kept out of git (tmp/ is ignored) until the summaries
// are judged good enough to be stored in the database
export const PROTOTYPE_FILE = "tmp/summaries-prototype.json";

export interface PrototypeEntry {
  description: string;
  durationMs: number;
  error: string | null;
  pollId: string;
  sourceUrl: string | null;
  summary: BillSummary | null;
  title: string;
}

export interface PrototypeFile {
  entries: PrototypeEntry[];
  generatedAt: string;
  model: string;
  promptVersion: string;
}
