/** The prototype runs on a fixed demo date so all mock data stays consistent. */
export const TODAY = "2026-09-29";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTHS_LONG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAYS_LONG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

function toUtc(date: string) {
  const { y, m, d } = parts(date);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date: string, days: number) {
  const next = toUtc(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

/** Inclusive list of dates from `from` to `to`. */
export function dateRange(from: string, to: string) {
  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);
  return dates;
}

export function dayOfWeek(date: string) {
  return toUtc(date).getUTCDay();
}

/** 29 Sep 2026 */
export function formatDate(date: string) {
  const { y, m, d } = parts(date);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** 29 September 2026 */
export function formatDateLong(date: string) {
  const { y, m, d } = parts(date);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** Selasa, 29 September 2026 */
export function formatDateFull(date: string) {
  return `${DAYS_LONG[dayOfWeek(date)]}, ${formatDateLong(date)}`;
}

/** Sel */
export function dayLabel(date: string) {
  return DAYS_SHORT[dayOfWeek(date)];
}

/** 29 Sep */
export function shortLabel(date: string) {
  const { m, d } = parts(date);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}
