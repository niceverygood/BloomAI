import clsx, { type ClassValue } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return format(new Date(d), "yyyy.MM.dd", { locale: ko });
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return format(new Date(d), "M월 d일 (EEE) HH:mm", { locale: ko });
}

export function fmtTime(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return format(new Date(d), "HH:mm", { locale: ko });
}

export function fromNow(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ko });
}
