import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// French civic time, whatever the timezone of the server or the browser: both
// must print the same string, or React hydration breaks
const PARIS = "Europe/Paris";

export function formatDate(dateStr: string) {
  return format(new TZDate(dateStr, PARIS), "d MMMM yyyy 'à' HH:mm", {
    locale: fr,
  });
}

export function formatDateShort(dateStr: string) {
  return format(new TZDate(dateStr, PARIS), "dd/MM/yyyy HH:mm", {
    locale: fr,
  });
}

export function formatDay(dateStr: string) {
  return format(new TZDate(dateStr, PARIS), "d MMM yyyy", { locale: fr });
}
