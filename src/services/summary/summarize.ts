import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod/v4";
import {
  buildSummaryUserPrompt,
  SUMMARY_SYSTEM_PROMPT,
} from "@/services/summary/prompt";

export const billSummarySchema = z.object({
  plainTitle: z
    .string()
    .describe(
      "Titre en clair, 80 caractères maximum, sans « Proposition de loi visant à », qui commence par un verbe à l'infinitif"
    ),
  summary: z
    .string()
    .describe(
      "3 ou 4 phrases qui expliquent ce que propose le texte et pourquoi selon ses auteurs"
    ),
  changes: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe(
      "2 ou 3 phrases courtes, chacune décrivant un changement concret que le texte propose"
    ),
});

export type BillSummary = z.infer<typeof billSummarySchema>;

// Free tier friendly: the provider reads GOOGLE_GENERATIVE_AI_API_KEY, and
// swapping provider only means changing this model
const DEFAULT_MODEL = "gemini-flash-lite-latest";

export async function summarizeBill({
  model = DEFAULT_MODEL,
  title,
  description,
}: {
  model?: string;
  title: string;
  description: string;
}): Promise<BillSummary> {
  const { output } = await generateText({
    model: google(model),
    system: SUMMARY_SYSTEM_PROMPT,
    prompt: buildSummaryUserPrompt(title, description),
    output: Output.object({ schema: billSummarySchema }),
    temperature: 0.2,
    // Retries with backoff, which also covers the free tier rate limit
    maxRetries: 5,
  });

  return output;
}
