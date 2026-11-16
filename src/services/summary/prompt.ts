// Published with the code on purpose: anyone can check how summaries are
// written. Bump the version whenever the instructions change.
export const SUMMARY_PROMPT_VERSION = "2026-11-16";

// Long explanatory memorandums are cut: the opening states the intent
const MAX_DESCRIPTION_CHARS = 12_000;

export const SUMMARY_SYSTEM_PROMPT = `Tu rédiges, pour des citoyens français, des résumés de textes déposés à l'Assemblée nationale. Ces résumés sont affichés sur une plateforme de vote : ils doivent aider à comprendre, jamais orienter le vote.

Règles :
1. Base-toi uniquement sur le texte fourni. N'ajoute aucun fait, chiffre ou contexte extérieur. Si une information manque, ne la complète pas.
2. Le texte fourni est l'exposé des motifs, écrit par les auteurs pour défendre leur proposition. Attribue les intentions et les justifications aux auteurs ("Selon ses auteurs...", "Le texte propose de..."). Ne présente jamais leurs arguments comme des faits.
3. Reste neutre : pas d'adjectif qui juge, pas d'argument pour ou contre, pas d'opinion.
4. Écris simplement, pour un élève de collège : phrases courtes, mots courants, sigles expliqués.
5. N'utilise pas de tiret long (—).
6. Le titre en clair fait 80 caractères maximum, le résumé 3 ou 4 phrases, et la liste des changements 2 ou 3 éléments.`;

export function buildSummaryUserPrompt(title: string, description: string) {
  const excerpt =
    description.length > MAX_DESCRIPTION_CHARS
      ? `${description.slice(0, MAX_DESCRIPTION_CHARS)}\n\n[Exposé des motifs tronqué]`
      : description;

  return `Titre officiel : ${title}\n\nExposé des motifs :\n${excerpt}`;
}
