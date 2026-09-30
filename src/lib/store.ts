"use client";

import { useSyncExternalStore } from "react";
import { authenticate } from "./auth";
import { calcTotals } from "./calc";
import { TODAY } from "./date";
import {
  BASELINE_TRANSACTIONS_TODAY,
  CLOSINGS,
  invoiceId,
  PRODUCTS,
  SETTINGS,
  STOCK,
  stockOutId,
  TRANSACTIONS,
} from "./mock-data";
import { findStockByName, todayOpening } from "./stock";
import type {
  CartLine,
  Closing,
  Discount,
  MenuRequest,
  PaymentMethod,
  Product,
  Session,
  Settings,
  StockItem,
  StockOut,
  Transaction,
} from "./types";

/**
 * Local mock store for the prototype. Pages read with `useStore()` and change
 * data through the exported actions — the same seams a REST API would replace.
 */
export interface AppState {
  /** The logged-in account, or null when nobody is logged in. */
  session: Session | null;
  products: Product[];
  stock: StockItem[];
  closings: Closing[];
  transactions: Transaction[];
  menuRequests: MenuRequest[];
  settings: Settings;
  /** Stock received today, per stock item id. */
  todayIncoming: Record<string, number>;
  /** Stock out recorded today, newest first. */
  stockOuts: StockOut[];
  /** Stock taken out today, per stock item id; counted as usage at closing. */
  todayOut: Record<string, number>;
  /** Cashier's saved (unfinished) closing input, per stock item id. */
  closingDraft: Record<string, number> | null;
}

const STORAGE_KEY = "coffee-shop-pos-demo-v2";

const initialState: AppState = {
  session: null,
  products: PRODUCTS,
  stock: STOCK,
  closings: CLOSINGS,
  transactions: TRANSACTIONS,
  menuRequests: [],
  settings: SETTINGS,
  todayIncoming: {},
  stockOuts: [],
  todayOut: {},
  closingDraft: null,
};

let state = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function getState(): AppState {
  if (!loaded) {
    loaded = true;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) state = { ...initialState, ...JSON.parse(saved) };
    } catch {
      // Storage unavailable — the demo simply starts from the mock data.
    }
  }
  return state;
}

function setState(update: (current: AppState) => AppState) {
  state = update(getState());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore: state still lives in memory for this session.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStore() {
  return useSyncExternalStore(subscribe, getState, () => initialState);
}

const noopSubscribe = () => () => {};

/** False during server render and hydration, true once running in the browser. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

/** Current clock time as "HH:MM". */
function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// --- Login -------------------------------------------------------------------

/** Logs in with username or email; returns the session, or null when the credentials are wrong. */
export function login(identifier: string, password: string): Session | null {
  const session = authenticate(identifier, password);
  if (session) setState((s) => ({ ...s, session }));
  return session;
}

export function logout() {
  setState((s) => ({ ...s, session: null }));
}

// --- Settings ----------------------------------------------------------------

export function updateSettings(settings: Settings) {
  setState((s) => ({ ...s, settings }));
}

export function resetDemo() {
  // Resetting the demo data keeps the current account logged in.
  setState((s) => ({ ...initialState, session: s.session }));
}

// --- Products ----------------------------------------------------------------

export function saveProduct(product: Omit<Product, "id"> & { id?: string }) {
  setState((s) => {
    if (product.id) {
      return { ...s, products: s.products.map((p) => (p.id === product.id ? { ...p, ...product } : p)) };
    }
    return { ...s, products: [...s.products, { ...product, id: newId("product") }] };
  });
}

export function deleteProduct(productId: string) {
  setState((s) => ({
    ...s,
    products: s.products.filter((p) => p.id !== productId),
    menuRequests: s.menuRequests.filter((r) => r.productId !== productId),
  }));
}

// --- Stock & closing ---------------------------------------------------------

export interface StockInput {
  name: string;
  unit: string;
  qty: number;
  minimum: number;
}

/**
 * Records incoming stock typed in by name. A name that is already registered
 * is topped up (its unit is kept); an unknown name registers a new raw material.
 */
export function receiveStock(input: StockInput) {
  setState((s) => {
    const existing = findStockByName(s.stock, input.name);
    const id = existing?.id ?? newId("stock");
    return {
      ...s,
      stock: existing
        ? s.stock.map((item) =>
            item.id === id ? { ...item, stock: item.stock + input.qty, minimum: input.minimum } : item,
          )
        : [
            ...s.stock,
            { id, name: input.name, unit: input.unit, stock: input.qty, minimum: input.minimum, usage: [] },
          ],
      todayIncoming: { ...s.todayIncoming, [id]: (s.todayIncoming[id] ?? 0) + input.qty },
    };
  });
}

/** Owner's manual correction of a raw material: name, unit, stock on hand, and threshold. */
export function updateStockItem(id: string, changes: Pick<StockItem, "name" | "unit" | "stock" | "minimum">) {
  setState((s) => ({
    ...s,
    stock: s.stock.map((item) => (item.id === id ? { ...item, ...changes } : item)),
  }));
}

/** Removes a raw material from the list. Closing history keeps its past lines. */
export function deleteStockItem(id: string) {
  const without = (record: Record<string, number>) =>
    Object.fromEntries(Object.entries(record).filter(([key]) => key !== id));
  setState((s) => ({
    ...s,
    stock: s.stock.filter((item) => item.id !== id),
    todayIncoming: without(s.todayIncoming),
    todayOut: without(s.todayOut),
    closingDraft: s.closingDraft && without(s.closingDraft),
  }));
}

/** Takes raw material out of stock; the quantity counts toward today's usage at closing. */
export function recordStockOut(input: Pick<StockOut, "stockItemId" | "qty" | "purpose" | "note" | "by">) {
  setState((s) => {
    const item = s.stock.find((candidate) => candidate.id === input.stockItemId);
    if (!item) return s;
    const record: StockOut = {
      ...input,
      id: stockOutId(s.stockOuts.length + 1),
      date: TODAY,
      time: nowTime(),
      name: item.name,
      unit: item.unit,
    };
    return {
      ...s,
      stock: s.stock.map((i) => (i.id === item.id ? { ...i, stock: i.stock - input.qty } : i)),
      stockOuts: [record, ...s.stockOuts],
      todayOut: { ...s.todayOut, [item.id]: (s.todayOut[item.id] ?? 0) + input.qty },
    };
  });
}

export function saveClosingDraft(used: Record<string, number>) {
  setState((s) => ({ ...s, closingDraft: used }));
}

/** Opening + Incoming - Used = Closing; the closing becomes the new current stock. */
export function completeClosing(used: Record<string, number>) {
  setState((s) => {
    const lines = s.stock.map((item) => {
      const incoming = s.todayIncoming[item.id] ?? 0;
      const out = s.todayOut[item.id] ?? 0;
      const opening = todayOpening(item, incoming, out);
      // Stock out is already part of today's usage.
      const usedQty = Math.max(used[item.id] ?? 0, out);
      return {
        stockItemId: item.id,
        name: item.name,
        unit: item.unit,
        opening,
        incoming,
        used: usedQty,
        closing: opening + incoming - usedQty,
      };
    });
    const closing: Closing = { id: TODAY, date: TODAY, lines };
    const byItem = new Map(lines.map((line) => [line.stockItemId, line]));
    return {
      ...s,
      closingDraft: null,
      todayIncoming: {},
      todayOut: {},
      closings: [closing, ...s.closings.filter((c) => c.id !== closing.id)],
      stock: s.stock.map((item) => {
        const line = byItem.get(item.id)!;
        return { ...item, stock: line.closing, usage: [...item.usage, line.used].slice(-7) };
      }),
    };
  });
}

// --- POS ---------------------------------------------------------------------

export interface NewTransaction {
  cashier: string;
  items: CartLine[];
  discount: Discount;
  method: PaymentMethod;
  paid: number;
}

/** Invoice number the next completed transaction will get. */
export function nextInvoiceId(transactions: Transaction[]) {
  const madeToday = transactions.filter((t) => !t.seeded && t.date === TODAY).length;
  return invoiceId(BASELINE_TRANSACTIONS_TODAY + madeToday + 1);
}

export function addTransaction(input: NewTransaction): Transaction {
  const current = getState();
  const totals = calcTotals(input.items, input.discount, current.settings.taxRate);
  const transaction: Transaction = {
    ...input,
    ...totals,
    id: nextInvoiceId(current.transactions),
    date: TODAY,
    time: nowTime(),
    taxRate: current.settings.taxRate,
    change: input.paid - totals.total,
  };
  setState((s) => ({ ...s, transactions: [transaction, ...s.transactions] }));
  return transaction;
}

// --- Menu change requests ----------------------------------------------------

export function submitMenuRequest(input: Pick<MenuRequest, "productId" | "productName" | "action" | "reason">) {
  setState((s) => ({
    ...s,
    menuRequests: [
      { ...input, id: newId("request"), status: "pending", createdAt: TODAY },
      ...s.menuRequests,
    ],
  }));
}

export function resolveMenuRequest(requestId: string, approve: boolean) {
  setState((s) => {
    const request = s.menuRequests.find((r) => r.id === requestId);
    if (!request) return s;
    return {
      ...s,
      menuRequests: s.menuRequests.map((r) =>
        r.id === requestId ? { ...r, status: approve ? "approved" : "rejected" } : r,
      ),
      products: !approve
        ? s.products
        : s.products.map((p) =>
            p.id === request.productId ? { ...p, available: request.action === "available" } : p,
          ),
    };
  });
}

// --- Toasts ------------------------------------------------------------------

export interface Toast {
  id: number;
  message: string;
  tone: "success" | "info";
}

const NO_TOASTS: Toast[] = [];
let toasts = NO_TOASTS;
let toastId = 0;
const toastListeners = new Set<() => void>();

function setToasts(next: Toast[]) {
  toasts = next;
  toastListeners.forEach((listener) => listener());
}

export function toast(message: string, tone: Toast["tone"] = "success") {
  const id = ++toastId;
  setToasts([...toasts, { id, message, tone }]);
  setTimeout(() => setToasts(toasts.filter((t) => t.id !== id)), 3200);
}

export function useToasts() {
  return useSyncExternalStore(
    (listener) => {
      toastListeners.add(listener);
      return () => {
        toastListeners.delete(listener);
      };
    },
    () => toasts,
    () => NO_TOASTS,
  );
}

// --- Focus mode --------------------------------------------------------------

let focusMode = false;
const focusListeners = new Set<() => void>();

/** Focus mode hides the header and all navigation, leaving only the page. Not persisted. */
export function setFocusMode(on: boolean) {
  focusMode = on;
  focusListeners.forEach((listener) => listener());
}

export function useFocusMode() {
  return useSyncExternalStore(
    (listener) => {
      focusListeners.add(listener);
      return () => {
        focusListeners.delete(listener);
      };
    },
    () => focusMode,
    () => false,
  );
}
