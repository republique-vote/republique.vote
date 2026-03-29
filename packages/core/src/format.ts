import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(dateStr: string) {
  return format(new Date(dateStr), "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

export function formatDateShort(dateStr: string) {
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: fr });
}
