// Kandel and Moles readability score, the French adaptation of Flesch:
// 207 - 1.015 x (words per sentence) - 73.6 x (syllables per word).
// Higher is easier. An approximation, but enough to compare prompt versions.

const SENTENCE_END = /[.!?…]+/;
const WORD = /[\p{L}'’-]+/gu;
const VOWEL_GROUP = /[aeiouyàâäéèêëîïôöùûüœæ]+/g;
const SILENT_FINAL_E = /[^aeiouyàâäéèêëîïôöùûü]es?$/;

function countSyllables(word: string) {
  const lower = word.toLowerCase();
  let count = lower.match(VOWEL_GROUP)?.length ?? 0;
  // A final "e" or "es" after a consonant is not pronounced: "table", "tables"
  if (count > 1 && SILENT_FINAL_E.test(lower)) {
    count--;
  }
  return Math.max(count, 1);
}

export function readabilityScore(text: string) {
  const sentences = text
    .split(SENTENCE_END)
    .filter((sentence) => sentence.trim().length > 0);
  const words = text.match(WORD) ?? [];
  if (sentences.length === 0 || words.length === 0) {
    return 0;
  }
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const score =
    207 -
    1.015 * (words.length / sentences.length) -
    73.6 * (syllables / words.length);
  return Math.round(score);
}

export function readabilityLabel(score: number) {
  if (score >= 80) {
    return "facile";
  }
  if (score >= 60) {
    return "assez facile";
  }
  if (score >= 40) {
    return "difficile";
  }
  return "très difficile";
}

// Whole summary as one text. Older summaries have no simple sentence, and a
// change without final punctuation still counts as its own sentence.
export function summaryReadability(summary: {
  changes: string[];
  context?: string;
  simpleSentence?: string;
  summary: string;
}) {
  const parts = [
    summary.simpleSentence,
    summary.summary,
    summary.context,
    ...summary.changes,
  ];
  return readabilityScore(
    parts.filter((part): part is string => Boolean(part)).join(". ")
  );
}
