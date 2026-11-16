import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// French civic time, whatever the timezone of the server or the browser: both
// must print the same string, or React hydration breaks
const PARIS = "Europe/Paris";
// Some dates only give the day, e.g. official votes: no time to show
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function formatDate(dateStr: string) {
  const pattern = DAY_ONLY.test(dateStr)
    ? "d MMMM yyyy"
    : "d MMMM yyyy 'à' HH:mm";
  return format(new TZDate(dateStr, PARIS), pattern, { locale: fr });
}

export function formatDateShort(dateStr: string) {
  return format(new TZDate(dateStr, PARIS), "dd/MM/yyyy HH:mm", {
    locale: fr,
  });
}

export function formatDay(dateStr: string) {
  return format(new TZDate(dateStr, PARIS), "d MMM yyyy", { locale: fr });
}
