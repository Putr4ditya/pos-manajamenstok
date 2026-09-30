export type Role = "owner" | "cashier";

/** The logged-in account. One account has exactly one role. */
export interface Session {
  username: string;
  name: string;
  role: Role;
}

export type Category = "Coffee" | "Non-Coffee" | "Makanan" | "Snack";

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  active: boolean;
  /** False while the menu is marked as not available (e.g. ingredients ran out). */
  available: boolean;
}

/** A raw material and its current stock. */
export interface StockItem {
  id: string;
  name: string;
  unit: string;
  /** Stock on hand right now: today's opening + today's incoming - today's stock out. */
  stock: number;
  minimum: number;
  /** Usage recorded by the most recent closings (up to 7), oldest first. */
  usage: number[];
}

export type StockStatus = "normal" | "attention" | "threshold";

export interface CartLine {
  productId: string;
  name: string;
  category: Category;
  price: number;
  qty: number;
}

export type DiscountType = "none" | "percent" | "fixed";

export interface Discount {
  type: DiscountType;
  value: number;
}

export type PaymentMethod = "CASH" | "QRIS" | "DEBIT" | "CREDIT" | "OTHER";

export interface Totals {
  subtotal: number;
  discountAmount: number;
  taxBase: number;
  taxAmount: number;
  total: number;
}

export interface Transaction extends Totals {
  id: string;
  date: string;
  time: string;
  cashier: string;
  items: CartLine[];
  discount: Discount;
  taxRate: number;
  method: PaymentMethod;
  paid: number;
  change: number;
  /** Seeded transactions are already counted in the baseline sales data. */
  seeded?: boolean;
}

export interface ClosingLine {
  stockItemId: string;
  name: string;
  unit: string;
  opening: number;
  incoming: number;
  used: number;
  /** System expected closing stock: opening + incoming - used. */
  closing: number;
  /** Physical count, only recorded when it was checked. */
  physical?: number;
}

export interface Closing {
  /** One closing per day, so the id is the closing date. */
  id: string;
  date: string;
  lines: ClosingLine[];
}

/** Raw material taken out of stock during the day, recorded by the Cashier. */
export interface StockOut {
  id: string;
  date: string;
  time: string;
  stockItemId: string;
  name: string;
  unit: string;
  qty: number;
  purpose: string;
  note: string;
  by: string;
}

export interface MenuRequest {
  id: string;
  productId: string;
  productName: string;
  action: "unavailable" | "available";
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface ProductSales {
  productId: string;
  name: string;
  category: Category;
  qty: number;
  revenue: number;
}

export interface DailySales {
  date: string;
  transactions: number;
  discount: number;
  items: ProductSales[];
}

export interface Settings {
  shopName: string;
  taxRate: number;
  receiptFooter: string;
}
