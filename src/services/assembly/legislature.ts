const PUBLICATION_URL =
  "https://www.assemblee-nationale.fr/dyn/opendata/list-publication/publication_j";

const DEFAULT_LEGISLATURE = "17";
const LEGISLATURE_REGEX = /L(\d+)/;

export async function detectLegislature(): Promise<string> {
  try {
    const res = await fetch(PUBLICATION_URL);
    if (!res.ok) {
      return DEFAULT_LEGISLATURE;
    }

    const text = await res.text();
    const match = LEGISLATURE_REGEX.exec(text);
    if (match) {
      return match[1];
    }
  } catch {
    // Feed unavailable (weekends, holidays)
  }

  return DEFAULT_LEGISLATURE;
}
