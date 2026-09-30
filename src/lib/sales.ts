import { addDays, dateRange, TODAY } from "./date";
import { BASELINE_SALES, BASELINE_TAX_RATE } from "./mock-data";
import type { Category, ProductSales, Transaction } from "./types";

export type Period = "today" | "7d" | "30d";

export const PERIOD_LABEL: Record<Period, string> = {
  today: "Hari Ini",
  "7d": "7 Hari Terakhir",
  "30d": "30 Hari Terakhir",
};

export function periodRange(period: Period) {
  const days = period === "today" ? 1 : period === "7d" ? 7 : 30;
  return { from: addDays(TODAY, -(days - 1)), to: TODAY };
}

export interface SalesFilter {
  from: string;
  to: string;
  category: Category | "all";
}

export interface DailyPoint {
  date: string;
  net: number;
  transactions: number;
}

export interface SalesSummary {
  gross: number;
  discount: number;
  tax: number;
  net: number;
  transactions: number;
  itemsSold: number;
  products: ProductSales[];
  daily: DailyPoint[];
}

/**
 * Combines the baseline (historical) sales with transactions made in the POS
 * during the demo, so a new sale shows up everywhere sales are reported.
 */
export function summarizeSales(transactions: Transaction[], filter: SalesFilter): SalesSummary {
  const daily = new Map<string, DailyPoint>(
    dateRange(filter.from, filter.to).map((date) => [date, { date, net: 0, transactions: 0 }]),
  );
  const products = new Map<string, ProductSales>();
  const summary = { gross: 0, discount: 0, tax: 0, transactions: 0, itemsSold: 0 };

  function add(date: string, lines: ProductSales[], discount: number, tax: number | null, count: number | null) {
    const totalGross = lines.reduce((sum, line) => sum + line.revenue, 0);
    const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);
    const selected = lines.filter((line) => filter.category === "all" || line.category === filter.category);
    const gross = selected.reduce((sum, line) => sum + line.revenue, 0);
    const qty = selected.reduce((sum, line) => sum + line.qty, 0);
    if (qty === 0 || totalGross === 0) return;

    // With a category filter, discount and tax are shared proportionally.
    const share = gross / totalGross;
    const lineDiscount = discount * share;
    const lineTax = tax === null ? ((gross - lineDiscount) * BASELINE_TAX_RATE) / 100 : tax * share;
    const lineCount = count === null ? 1 : filter.category === "all" ? count : Math.round((count * qty) / totalQty);

    summary.gross += gross;
    summary.discount += lineDiscount;
    summary.tax += lineTax;
    summary.transactions += lineCount;
    summary.itemsSold += qty;

    const point = daily.get(date)!;
    point.net += gross - lineDiscount + lineTax;
    point.transactions += lineCount;

    for (const line of selected) {
      const existing = products.get(line.productId);
      if (existing) {
        existing.qty += line.qty;
        existing.revenue += line.revenue;
      } else {
        products.set(line.productId, { ...line });
      }
    }
  }

  for (const day of BASELINE_SALES) {
    if (daily.has(day.date)) add(day.date, day.items, day.discount, null, day.transactions);
  }

  for (const trx of transactions) {
    if (trx.seeded || !daily.has(trx.date)) continue;
    const lines = trx.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      qty: item.qty,
      revenue: item.qty * item.price,
    }));
    add(trx.date, lines, trx.discountAmount, trx.taxAmount, null);
  }

  const discount = Math.round(summary.discount);
  const tax = Math.round(summary.tax);
  return {
    gross: summary.gross,
    discount,
    tax,
    net: summary.gross - discount + tax,
    transactions: summary.transactions,
    itemsSold: summary.itemsSold,
    products: [...products.values()].filter((product) => product.qty > 0),
    daily: [...daily.values()].map((point) => ({ ...point, net: Math.round(point.net) })),
  };
}

export function topProducts(products: ProductSales[], count = 3) {
  return [...products].sort((a, b) => b.qty - a.qty).slice(0, count);
}

export function leastProducts(products: ProductSales[], count = 3) {
  return [...products].sort((a, b) => a.qty - b.qty).slice(0, count);
}
