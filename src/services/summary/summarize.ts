import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod/v4";
import {
  buildSummaryUserPrompt,
  SUMMARY_SYSTEM_PROMPT,
} from "@/services/summary/prompt";

export const billSummarySchema = z.object({
  simpleSentence: z
    .string()
    .describe(
      "Une seule phrase très simple, 20 mots maximum, qu'un enfant de 10 ans comprend, qui dit ce que le texte veut changer"
    ),
  plainTitle: z
    .string()
    .describe(
      "Titre en clair, 80 caractères maximum, sans « Proposition de loi visant à », qui commence par un verbe à l'infinitif"
    ),
  summary: z
    .string()
    .describe(
      "3 à 5 phrases courtes en FALC : ce que propose le texte, puis pourquoi selon ses auteurs"
    ),
  context: z
    .string()
    .describe(
      "Pour comprendre : 2 ou 3 phrases simples sur comment ça marche aujourd'hui et ce qui manque selon le texte. Chaîne vide si la situation actuelle n'est pas sûre"
    ),
  changes: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe(
      "2 ou 3 phrases courtes commençant par un verbe à l'infinitif, chacune décrivant un changement concret que le texte propose"
    ),
});

export type BillSummary = z.infer<typeof billSummarySchema>;

// Free tier friendly: the provider reads GOOGLE_GENERATIVE_AI_API_KEY, and
// swapping provider only means changing this model
export const DEFAULT_SUMMARY_MODEL =
  process.env.SUMMARY_MODEL ?? "gemini-flash-lite-latest";

export async function summarizeBill({
  model = DEFAULT_SUMMARY_MODEL,
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
