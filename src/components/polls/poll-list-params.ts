import type { PollListSort, PollType } from "@/services/poll/list";

// Filters of the poll list, kept in French in the URL since visitors see and
// share it: /polls?statut=termines&type=loi&page=3
export type PollTabValue = "open" | "closed" | "all";

export interface PollListFilters {
  page: number;
  sort: PollListSort;
  tab: PollTabValue;
  type: PollType | null;
}

const TABS: Record<string, PollTabValue> = {
  "en-cours": "open",
  termines: "closed",
  tous: "all",
};
const TYPES: Record<string, PollType> = {
  loi: "law",
  referendum: "referendum",
  election: "election",
};
const SORTS: Record<string, PollListSort> = {
  recents: "recent",
  "plus-votes": "votes",
};

function keyOf<T>(map: Record<string, T>, value: T) {
  return Object.keys(map).find((key) => map[key] === value);
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Unknown values fall back to the defaults rather than an error
export function parsePollListParams(params: RawParams): PollListFilters {
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return {
    tab: TABS[first(params.statut) ?? ""] ?? "open",
    type: TYPES[first(params.type) ?? ""] ?? null,
    sort: SORTS[first(params.tri) ?? ""] ?? "recent",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

// Defaults are left out to keep the URL short
export function pollListQuery(filters: PollListFilters) {
  const params = new URLSearchParams();
  if (filters.tab !== "open") {
    params.set("statut", keyOf(TABS, filters.tab) ?? "");
  }
  if (filters.type) {
    params.set("type", keyOf(TYPES, filters.type) ?? "");
  }
  if (filters.sort !== "recent") {
    params.set("tri", keyOf(SORTS, filters.sort) ?? "");
  }
  if (filters.page > 1) {
    params.set("page", filters.page.toString());
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

// Status expected by the list API for each tab
export function tabStatus(tab: PollTabValue) {
  return tab === "all" ? null : tab;
}
