"use client";

import { Maximize, Minimize, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/common/Input";
import { ConfirmDialog } from "@/components/common/Modal";
import { CategoryTabs, type CategoryFilter } from "@/components/pos/CategoryTabs";
import { MenuRequestModal } from "@/components/pos/MenuRequestModal";
import { ORDER_PANEL_WIDTH, OrderPanel } from "@/components/pos/OrderPanel";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { ProductCard } from "@/components/pos/ProductCard";
import { calcTotals } from "@/lib/calc";
import { cn, rupiah } from "@/lib/format";
import { CASHIER_NAME, CATEGORIES } from "@/lib/mock-data";
import {
  addTransaction,
  nextInvoiceId,
  setFocusMode,
  submitMenuRequest,
  toast,
  useFocusMode,
  useStore,
} from "@/lib/store";
import type { CartLine, Discount, PaymentMethod, Product, Transaction } from "@/lib/types";

const NO_DISCOUNT: Discount = { type: "none", value: 0 };

export default function PosPage() {
  const { products, transactions, menuRequests, settings, session } = useStore();
  const cashier = session?.name ?? CASHIER_NAME;
  const focusMode = useFocusMode();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState<Discount>(NO_DISCOUNT);
  const [paying, setPaying] = useState(false);
  const [completed, setCompleted] = useState<Transaction | null>(null);
  const [requesting, setRequesting] = useState<Product | null>(null);
  // On phones the order panel is a full-screen sheet opened from the bottom bar.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const totals = calcTotals(cart, discount, settings.taxRate);
  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const hasPendingRequest = (product: Product) =>
    menuRequests.some((request) => request.status === "pending" && request.productId === product.id);

  const active = products.filter((product) => product.active);
  const counts = {
    all: active.length,
    ...Object.fromEntries(CATEGORIES.map((c) => [c, active.filter((product) => product.category === c).length])),
  } as Record<CategoryFilter, number>;
  const visible = active.filter(
    (product) =>
      (category === "all" || product.category === category) &&
      product.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function addToCart(product: Product) {
    setCart((lines) => {
      const existing = lines.find((line) => line.productId === product.id);
      if (existing) {
        return lines.map((line) => (line === existing ? { ...line, qty: line.qty + 1 } : line));
      }
      return [
        ...lines,
        { productId: product.id, name: product.name, category: product.category, price: product.price, qty: 1 },
      ];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((lines) =>
      lines
        .map((line) => (line.productId === productId ? { ...line, qty: line.qty + delta } : line))
        .filter((line) => line.qty > 0),
    );
  }

  function clearOrder() {
    setCart([]);
    setDiscount(NO_DISCOUNT);
  }

  function pay(method: PaymentMethod, paid: number) {
    const transaction = addTransaction({ cashier, items: cart, discount, method, paid });
    setCompleted(transaction);
    clearOrder();
    toast("Transaksi berhasil");
  }

  function closePayment() {
    setPaying(false);
    setCompleted(null);
  }

  const panel = (onClose?: () => void) => (
    <OrderPanel
      invoiceId={nextInvoiceId(transactions)}
      cashier={cashier}
      lines={cart}
      discount={discount}
      taxRate={settings.taxRate}
      totals={totals}
      onChangeQty={changeQty}
      onDiscountChange={setDiscount}
      onClear={() => setClearing(true)}
      onPay={() => {
        setSheetOpen(false);
        setPaying(true);
      }}
      onClose={onClose}
    />
  );

  return (
    <>
      <div className={cn(itemCount > 0 && "pb-16 md:pb-0")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Menu</h1>
          {/* Search on the right, with the focus mode button next to it. */}
          <div className="flex w-full items-center gap-2 sm:w-80">
            <Input
              className="min-w-0 flex-1"
              placeholder="Cari menu..."
              prefix={<Search className="size-4" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setFocusMode(!focusMode)}
              title={focusMode ? "Keluar mode fokus" : "Mode fokus"}
              aria-label={focusMode ? "Keluar mode fokus" : "Mode fokus"}
              aria-pressed={focusMode}
              className={cn(
                "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors",
                focusMode
                  ? "border-primary bg-accent text-primary"
                  : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {focusMode ? <Minimize className="size-4.5" /> : <Maximize className="size-4.5" />}
            </button>
          </div>
        </div>
        <CategoryTabs value={category} onChange={setCategory} counts={counts} />

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              inCart={cart.find((line) => line.productId === product.id)?.qty ?? 0}
              pendingRequest={hasPendingRequest(product)}
              onAdd={() => addToCart(product)}
              onRemove={() => changeQty(product.id, -1)}
              onRequestChange={() => setRequesting(product)}
            />
          ))}
        </div>
        {visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-muted">
            Tidak ada menu yang cocok.
          </p>
        )}
      </div>

      {/* Tablet and desktop: order panel along the full height of the right edge. */}
      <aside className={cn("fixed inset-y-0 right-0 z-10 hidden border-l border-line bg-surface md:block", ORDER_PANEL_WIDTH)}>
        {panel()}
      </aside>

      {/* Phone: a bar above the bottom navigation opens the order panel as a sheet. */}
      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="fixed inset-x-3 bottom-[4.25rem] z-20 flex h-12 cursor-pointer items-center justify-between rounded-full bg-primary px-5 font-semibold text-white shadow-lg md:hidden"
        >
          <span>{itemCount} item · Lihat Pesanan</span>
          <span className="tabular-nums">{rupiah(totals.total)}</span>
        </button>
      )}
      {sheetOpen && <div className="fixed inset-0 z-30 bg-surface md:hidden">{panel(() => setSheetOpen(false))}</div>}

      {paying && (
        <PaymentModal
          total={totals.total}
          completed={completed}
          settings={settings}
          onPay={pay}
          onClose={closePayment}
        />
      )}

      {clearing && (
        <ConfirmDialog
          title="Kosongkan Pesanan"
          message={`Hapus semua item (${itemCount}) dari pesanan ini?`}
          confirmLabel="Kosongkan"
          cancelLabel="Batal"
          danger
          onCancel={() => setClearing(false)}
          onConfirm={() => {
            clearOrder();
            setClearing(false);
          }}
        />
      )}

      {requesting && (
        <MenuRequestModal
          product={requesting}
          action={requesting.available ? "unavailable" : "available"}
          onClose={() => setRequesting(null)}
          onSubmit={(reason) => {
            submitMenuRequest({
              productId: requesting.id,
              productName: requesting.name,
              action: requesting.available ? "unavailable" : "available",
              reason,
            });
            setRequesting(null);
            toast("Permintaan berhasil dikirim. Menunggu persetujuan Owner.");
          }}
        />
      )}
    </>
  );
}
