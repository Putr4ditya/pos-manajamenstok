import { decimal } from "./format";
import type { Closing, StockItem, StockStatus } from "./types";

/** Items forecast to reach their threshold within this many days need attention. */
const ATTENTION_DAYS = 3;

export function avgUsage(item: StockItem) {
  if (item.usage.length === 0) return 0;
  return item.usage.reduce((sum, n) => sum + n, 0) / item.usage.length;
}

/** Estimated days until stock reaches the minimum; 0 when already there, null when there is no usage pattern. */
export function daysToThreshold(item: StockItem): number | null {
  if (item.stock <= item.minimum) return 0;
  const avg = avgUsage(item);
  if (avg <= 0) return null;
  return Math.max(1, Math.round((item.stock - item.minimum) / avg));
}

export function stockStatus(item: StockItem): StockStatus {
  const days = daysToThreshold(item);
  if (days === 0) return "threshold";
  if (days !== null && days <= ATTENTION_DAYS) return "attention";
  return "normal";
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  normal: "Normal",
  attention: "Perlu Perhatian",
  threshold: "Mencapai Ambang Batas",
};

/** Owner-facing message. Always speaks about "ambang batas", never "habis". */
export function forecastText(item: StockItem) {
  const status = stockStatus(item);
  if (status === "threshold") return "Stok sudah mencapai ambang batas minimum.";
  if (status === "attention") {
    return `Diperkirakan mencapai ambang batas dalam ±${daysToThreshold(item)} hari.`;
  }
  return "Stok masih aman.";
}

export function predictionText(item: StockItem) {
  const days = daysToThreshold(item);
  if (days === 0) return "Sudah mencapai ambang batas";
  if (days === null) return "Belum ada pola penggunaan";
  return `±${days} hari menuju ambang batas`;
}

/** Average daily usage rounded to the nearest half, e.g. "1,5". */
export function avgUsageLabel(item: StockItem) {
  return decimal(Math.round(avgUsage(item) * 2) / 2);
}

const STATUS_ORDER: Record<StockStatus, number> = { threshold: 0, attention: 1, normal: 2 };

export function sortByUrgency(items: StockItem[]) {
  return [...items].sort((a, b) => STATUS_ORDER[stockStatus(a)] - STATUS_ORDER[stockStatus(b)]);
}

/**
 * Opening stock for today, before today's incoming and recorded stock out, so
 * opening + incoming - stock out always equals the stock shown in the stock list.
 */
export function todayOpening(item: StockItem, incoming: number, out: number) {
  return item.stock - incoming + out;
}

export function closingNeedsReview(closing: Closing) {
  return closing.lines.some((line) => line.physical !== undefined && line.physical !== line.closing);
}

/** Raw material names are unique regardless of letter case and surrounding spaces. */
export function findStockByName(items: StockItem[], name: string) {
  const key = name.trim().toLowerCase();
  return items.find((item) => item.name.trim().toLowerCase() === key);
}
