"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { cn, rupiah } from "@/lib/format";
import type { CartLine, Discount, DiscountType, PaymentMethod, Totals } from "@/lib/types";

/** Width of the fixed order panel, and the matching space the page content leaves for it. */
export const ORDER_PANEL_WIDTH = "md:w-80 lg:w-96 xl:w-[32rem]";
export const ORDER_PANEL_GUTTER = "md:pr-80 lg:pr-96 xl:pr-[32rem]";

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  DEBIT: "Debit",
  CREDIT: "Kredit",
  OTHER: "Lainnya",
};

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: "none", label: "Tidak ada" },
  { value: "percent", label: "Persentase" },
  { value: "fixed", label: "Nominal" },
];

const STEP_BUTTON =
  "flex size-8 cursor-pointer items-center justify-center rounded-full border border-line text-ink hover:bg-background";

interface OrderPanelProps {
  /** Invoice number this order will get once it is paid. */
  invoiceId: string;
  cashier: string;
  lines: CartLine[];
  discount: Discount;
  taxRate: number;
  totals: Totals;
  /** Adds `delta` to a line's quantity; the line is removed when it reaches zero. */
  onChangeQty: (productId: string, delta: number) => void;
  onDiscountChange: (discount: Discount) => void;
  onClear: () => void;
  /** Opens the payment dialog, where the method is chosen. */
  onPay: () => void;
  /** Shown on phones, where the panel opens as a full-screen sheet. */
  onClose?: () => void;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/** The current order: items, payment summary, and the Bayar action. */
export function OrderPanel({
  invoiceId,
  cashier,
  lines,
  discount,
  taxRate,
  totals,
  onChangeQty,
  onDiscountChange,
  onClear,
  onPay,
  onClose,
}: OrderPanelProps) {
  const [editingDiscount, setEditingDiscount] = useState(false);
  const empty = lines.length === 0;
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const hasDiscount = totals.discountAmount > 0;

  return (
    <section className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Pesanan Baru</h2>
          <p className="mt-0.5 truncate text-xs text-muted">
            {invoiceId} · {cashier}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="cursor-pointer rounded-full p-1.5 text-muted hover:bg-background hover:text-ink"
          >
            <X className="size-5" />
          </button>
        )}
      </header>

      <div className="flex items-center justify-between px-5 pt-4 text-sm">
        <h3 className="font-semibold">
          Item Dipesan <span className="ml-1 font-normal text-muted">{itemCount}</span>
        </h3>
        {!empty && (
          <button type="button" onClick={onClear} className="cursor-pointer text-muted hover:text-danger">
            Kosongkan
          </button>
        )}
      </div>

      {empty ? (
        <div className="flex min-h-24 flex-1 flex-col items-center justify-center gap-2 px-5 text-center text-sm text-muted">
          <ShoppingBag className="size-8 text-accent-line" />
          Belum ada item.
          <br />
          Pilih menu untuk memulai pesanan.
        </div>
      ) : (
        <ul className="mt-1 min-h-24 flex-1 divide-y divide-line overflow-y-auto px-5">
          {lines.map((line) => (
            <li key={line.productId} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{line.name}</p>
                <p className="text-xs tabular-nums text-muted">{rupiah(line.price)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Kurangi ${line.name}`}
                  className={STEP_BUTTON}
                  onClick={() => onChangeQty(line.productId, -1)}
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums">{line.qty}</span>
                <button
                  type="button"
                  aria-label={`Tambah ${line.name}`}
                  className={STEP_BUTTON}
                  onClick={() => onChangeQty(line.productId, 1)}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <p className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                {rupiah(line.qty * line.price)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-4 border-t border-line px-5 py-4 text-sm">
        <div className="space-y-2.5 rounded-2xl bg-background p-4">
          <SummaryRow label="Subtotal" value={rupiah(totals.subtotal)} />

          <div className="flex items-center justify-between text-muted">
            <span>Diskon{discount.type === "percent" && hasDiscount && ` ${discount.value}%`}</span>
            <span className="flex items-center gap-2">
              {hasDiscount && <span className="tabular-nums">-{rupiah(totals.discountAmount)}</span>}
              <button
                type="button"
                aria-expanded={editingDiscount}
                onClick={() => setEditingDiscount((open) => !open)}
                className="cursor-pointer font-medium text-primary hover:underline"
              >
                {editingDiscount ? "Selesai" : hasDiscount ? "Ubah" : "Tambah diskon"}
              </button>
            </span>
          </div>
          {editingDiscount && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1 rounded-full bg-surface p-1">
                {DISCOUNT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => onDiscountChange({ type: type.value, value: type.value === "percent" ? 10 : 0 })}
                    className={cn(
                      "h-8 cursor-pointer rounded-full text-xs font-medium transition-colors",
                      discount.type === type.value ? "bg-primary text-white" : "text-muted hover:text-ink",
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {discount.type !== "none" && (
                <label className="flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-ink focus-within:border-secondary">
                  {discount.type === "fixed" && <span className="text-muted">Rp</span>}
                  <input
                    type="number"
                    min={0}
                    max={discount.type === "percent" ? 100 : undefined}
                    aria-label={discount.type === "percent" ? "Diskon dalam persen" : "Diskon dalam rupiah"}
                    placeholder="0"
                    value={discount.value || ""}
                    onChange={(event) => {
                      const value = Math.max(Number(event.target.value) || 0, 0);
                      onDiscountChange({ ...discount, value: discount.type === "percent" ? Math.min(value, 100) : value });
                    }}
                    className="w-full min-w-0 bg-transparent tabular-nums outline-none"
                  />
                  {discount.type === "percent" && <span className="text-muted">%</span>}
                </label>
              )}
            </div>
          )}

          <SummaryRow label={`Pajak ${taxRate}%`} value={rupiah(totals.taxAmount)} />

          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-semibold">Total Bayar</span>
            <span className="text-2xl font-semibold tabular-nums">{rupiah(totals.total)}</span>
          </div>
        </div>

        <Button size="lg" className="w-full" disabled={empty} onClick={onPay}>
          Bayar{!empty && ` · ${rupiah(totals.total)}`}
        </Button>
      </div>
    </section>
  );
}
