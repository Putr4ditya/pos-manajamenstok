import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn, rupiah } from "@/lib/format";
import type { CartLine, Discount, DiscountType, Totals } from "@/lib/types";
import { CartItem } from "./CartItem";

interface CartProps {
  lines: CartLine[];
  discount: Discount;
  taxRate: number;
  totals: Totals;
  onChangeQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onDiscountChange: (discount: Discount) => void;
  onClear: () => void;
  onPay: () => void;
}

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: "none", label: "Tidak ada" },
  { value: "percent", label: "Persentase" },
  { value: "fixed", label: "Nominal" },
];

export function Cart({
  lines,
  discount,
  taxRate,
  totals,
  onChangeQty,
  onRemove,
  onDiscountChange,
  onClear,
  onPay,
}: CartProps) {
  const empty = lines.length === 0;

  return (
    <section className="flex max-h-full flex-col rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-semibold">Keranjang</h2>
        {!empty && (
          <button type="button" onClick={onClear} className="cursor-pointer text-sm text-muted hover:text-danger">
            Kosongkan
          </button>
        )}
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted">
          <ShoppingCart className="size-8 text-line" />
          Keranjang masih kosong.
          <br />
          Pilih produk untuk memulai transaksi.
        </div>
      ) : (
        <ul className="min-h-24 flex-1 divide-y divide-line overflow-y-auto px-5">
          {lines.map((line) => (
            <CartItem
              key={line.productId}
              line={line}
              onChangeQty={(qty) => onChangeQty(line.productId, qty)}
              onRemove={() => onRemove(line.productId)}
            />
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-line px-5 py-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="tabular-nums">{rupiah(totals.subtotal)}</span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Diskon</span>
            <span className="tabular-nums">
              {totals.discountAmount > 0 ? `-${rupiah(totals.discountAmount)}` : rupiah(0)}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-background p-1">
            {DISCOUNT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => onDiscountChange({ type: type.value, value: type.value === "percent" ? 10 : 0 })}
                className={cn(
                  "h-8 cursor-pointer rounded-md text-xs font-medium transition-colors",
                  discount.type === type.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
          {discount.type !== "none" && (
            <label className="mt-2 flex h-10 items-center gap-2 rounded-lg border border-line px-3 focus-within:border-secondary">
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

        <div className="flex justify-between">
          <span className="text-muted">Pajak {taxRate}%</span>
          <span className="tabular-nums">{rupiah(totals.taxAmount)}</span>
        </div>

        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-semibold tabular-nums">{rupiah(totals.total)}</span>
        </div>

        <Button size="lg" className="w-full" disabled={empty} onClick={onPay}>
          Bayar
        </Button>
      </div>
    </section>
  );
}
