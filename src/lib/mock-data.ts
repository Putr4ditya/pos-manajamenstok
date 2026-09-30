import { calcTotals } from "./calc";
import { addDays, dayOfWeek, TODAY } from "./date";
import type {
  CartLine,
  Category,
  Closing,
  DailySales,
  Discount,
  PaymentMethod,
  Product,
  Settings,
  StockItem,
  Transaction,
} from "./types";

export const CATEGORIES: Category[] = ["Coffee", "Non-Coffee", "Makanan", "Snack"];

/** Units offered when registering a raw material. Hardcoded until they are managed in the database. */
export const UNITS = ["pcs", "botol", "karung", "box", "kg", "liter", "pack"];

/** Reasons offered when recording stock out. Hardcoded until they are managed in the database. */
export const STOCK_OUT_PURPOSES = ["Produksi minuman", "Produksi makanan", "Rusak / kedaluwarsa", "Lainnya"];

/** The name used by the Cashier role in this demo. */
export const CASHIER_NAME = "Cashier A";

/** Tax rate the historical (baseline) sales were recorded with. */
export const BASELINE_TAX_RATE = 11;

export const SETTINGS: Settings = {
  shopName: "Coffee Shop",
  taxRate: 11,
  receiptFooter: "Terima Kasih",
};

export const PRODUCTS: Product[] = [
  { id: "americano", name: "Americano", category: "Coffee", price: 20000, active: true, available: true },
  { id: "iced-latte", name: "Iced Latte", category: "Coffee", price: 25000, active: true, available: true },
  { id: "cappuccino", name: "Cappuccino", category: "Coffee", price: 24000, active: true, available: true },
  { id: "matcha-latte", name: "Matcha Latte", category: "Non-Coffee", price: 28000, active: true, available: true },
  { id: "chocolate", name: "Chocolate", category: "Non-Coffee", price: 25000, active: true, available: true },
  { id: "rice-bowl", name: "Rice Bowl", category: "Makanan", price: 35000, active: true, available: true },
  { id: "french-fries", name: "French Fries", category: "Snack", price: 22000, active: true, available: true },
  { id: "croissant", name: "Croissant", category: "Snack", price: 20000, active: true, available: false },
];

// ---------------------------------------------------------------------------
// Raw materials — [name, unit, stock, minimum, usage of the last 7 closings]
// ---------------------------------------------------------------------------

type StockSeed = [string, string, number, number, number[]];

const STOCK_SEED: StockSeed[] = [
  ["Coffee", "karung", 12, 3, [1, 1, 1, 2, 1, 1, 1]],
  ["Matcha", "box", 2, 3, [1, 0, 1, 1, 0, 1, 1]],
  ["Milk Oatside", "botol", 8, 5, [1, 2, 1, 2, 1, 2, 2]],
  ["Sugar", "karung", 10, 3, [0, 1, 0, 1, 0, 0, 1]],
  ["Chocolate", "box", 6, 2, [0, 1, 0, 0, 1, 0, 0]],
  ["Syrup", "botol", 8, 2, [1, 0, 1, 0, 1, 0, 1]],
  ["Potatoes", "kg", 10, 3, [1, 1, 1, 1, 1, 1, 1]],
  ["Cooking Oil", "botol", 5, 2, [0, 1, 0, 0, 1, 0, 0]],
  ["Sauce", "botol", 8, 2, [1, 0, 0, 1, 0, 1, 0]],
  ["Cup", "pcs", 500, 100, [80, 85, 90, 110, 105, 82, 88]],
];

export const STOCK: StockItem[] = STOCK_SEED.map(([name, unit, stock, minimum, usage]) => ({
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  unit,
  stock,
  minimum,
  usage,
}));

// ---------------------------------------------------------------------------
// Closing history — derived backwards from current stock so every day chains
// into the next (yesterday's closing = today's opening = today's stock).
// ---------------------------------------------------------------------------

/** Deliveries received, keyed by `${stockItemId}@${daysAgo}`. */
const PAST_INCOMING: Record<string, number> = {
  "coffee@1": 2,
  "cup@3": 200,
};

/** Difference between physical count and system expected, same key. */
const PAST_DIFFERENCE: Record<string, number> = {
  "milk-oatside@2": -1,
};

function buildClosings(): Closing[] {
  const closings: Closing[] = [];
  const nextOpening = new Map(STOCK.map((item) => [item.id, item.stock]));

  for (let daysAgo = 1; daysAgo <= 3; daysAgo++) {
    const date = addDays(TODAY, -daysAgo);
    const lines = STOCK.map((item) => {
      const key = `${item.id}@${daysAgo}`;
      const used = item.usage[item.usage.length - daysAgo];
      const incoming = PAST_INCOMING[key] ?? 0;
      const difference = PAST_DIFFERENCE[key];
      const carried = nextOpening.get(item.id)!;
      const closing = difference === undefined ? carried : carried - difference;
      const opening = closing - incoming + used;
      nextOpening.set(item.id, opening);
      return {
        stockItemId: item.id,
        name: item.name,
        unit: item.unit,
        opening,
        incoming,
        used,
        closing,
        physical: difference === undefined ? undefined : carried,
      };
    });
    closings.push({ id: date, date, lines });
  }
  return closings;
}

export const CLOSINGS: Closing[] = buildClosings();

// ---------------------------------------------------------------------------
// Baseline sales — 30 days. Today's figures are fixed; earlier days vary
// deterministically around them (no Math.random, so every render agrees).
// ---------------------------------------------------------------------------

const TODAY_QTY: Record<string, number> = {
  "iced-latte": 24, americano: 18, cappuccino: 15, "matcha-latte": 11,
  "rice-bowl": 10, "french-fries": 5, chocolate: 3, croissant: 2,
};

const TODAY_META = { transactions: 52, discount: 60000 };

function pseudoRandom(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function buildBaselineSales(): DailySales[] {
  const days: DailySales[] = [];
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = addDays(TODAY, -daysAgo);
    const weekend = [0, 6].includes(dayOfWeek(date));
    const items = PRODUCTS.map((product) => {
      const base = TODAY_QTY[product.id] ?? 0;
      const factor = (0.8 + 0.45 * pseudoRandom(`${date}${product.id}`)) * (weekend ? 1.2 : 1);
      const qty = daysAgo === 0 ? base : Math.round(base * factor);
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        qty,
        revenue: qty * product.price,
      };
    });
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const gross = items.reduce((sum, item) => sum + item.revenue, 0);
    const meta =
      daysAgo === 0
        ? TODAY_META
        : {
            transactions: Math.round(totalQty / 1.7),
            discount: Math.round((gross * (0.02 + 0.02 * pseudoRandom(date))) / 1000) * 1000,
          };
    days.push({ date, ...meta, items });
  }
  return days;
}

export const BASELINE_SALES: DailySales[] = buildBaselineSales();

/** Transactions already recorded today; new invoices continue this numbering. */
export const BASELINE_TRANSACTIONS_TODAY = TODAY_META.transactions;

export function stockOutId(sequence: number) {
  return `STK-${TODAY.replace(/-/g, "")}-${String(sequence).padStart(3, "0")}`;
}

export function invoiceId(sequence: number) {
  return `INV-${TODAY.replace(/-/g, "")}-${String(sequence).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Recent transactions (already part of the baseline)
// ---------------------------------------------------------------------------

type SeedLine = [productId: string, qty: number];

function seedTransaction(
  sequence: number,
  time: string,
  seedLines: SeedLine[],
  method: PaymentMethod,
  discount: Discount = { type: "none", value: 0 },
  cash?: number,
): Transaction {
  const items: CartLine[] = seedLines.map(([productId, qty]) => {
    const product = PRODUCTS.find((p) => p.id === productId)!;
    return { productId, name: product.name, category: product.category, price: product.price, qty };
  });
  const totals = calcTotals(items, discount, BASELINE_TAX_RATE);
  const paid = cash ?? totals.total;
  return {
    id: invoiceId(sequence),
    date: TODAY,
    time,
    cashier: CASHIER_NAME,
    items,
    discount,
    taxRate: BASELINE_TAX_RATE,
    method,
    paid,
    change: paid - totals.total,
    seeded: true,
    ...totals,
  };
}

export const TRANSACTIONS: Transaction[] = [
  seedTransaction(52, "13:47", [["iced-latte", 1], ["americano", 2]], "CASH", undefined, 100000),
  seedTransaction(51, "13:02", [["cappuccino", 1], ["french-fries", 1]], "QRIS"),
  seedTransaction(50, "12:20", [["rice-bowl", 2], ["matcha-latte", 1]], "DEBIT", { type: "percent", value: 10 }),
  seedTransaction(49, "11:05", [["americano", 1]], "QRIS"),
  seedTransaction(48, "10:12", [["iced-latte", 2], ["croissant", 1]], "CASH", undefined, 100000),
];
