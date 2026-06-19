// Unified Arabic (Maghrebi/Algerian) date formatting for Munasabati Pro.
// Use these helpers everywhere instead of toLocaleDateString / toLocaleString.

export const MAGHREBI_MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
] as const;

export const MAGHREBI_MONTHS_SHORT = [
  "جان", "فيف", "مار", "أفر", "ماي", "جوان",
  "جويل", "أوت", "سبت", "أكت", "نوف", "ديس",
] as const;

export const AR_WEEKDAYS_LONG = [
  "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
] as const;

export const AR_WEEKDAYS_SHORT = [
  "أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت",
] as const;

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    // Treat bare YYYY-MM-DD as local noon to avoid TZ drift.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "15 جانفي 2026" */
export function formatDateLong(value: Date | string | number | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return `${d.getDate()} ${MAGHREBI_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "15/03/2026" */
export function formatDateShort(value: Date | string | number | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "15 جانفي 2026 — 14:30" */
export function formatDateTime(value: Date | string | number | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return `${formatDateLong(d)} — ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "جانفي 2026" */
export function formatMonthYear(year: number, monthIndex: number): string {
  return `${MAGHREBI_MONTHS[monthIndex]} ${year}`;
}

export function monthShort(monthIndex: number): string {
  return MAGHREBI_MONTHS_SHORT[monthIndex] ?? "";
}

export function weekdayLong(dayIndex: number): string {
  return AR_WEEKDAYS_LONG[dayIndex] ?? "";
}

export function weekdayShort(dayIndex: number): string {
  return AR_WEEKDAYS_SHORT[dayIndex] ?? "";
}
