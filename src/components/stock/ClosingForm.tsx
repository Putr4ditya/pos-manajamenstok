"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/Modal";
import { todayOpening } from "@/lib/stock";
import type { StockItem } from "@/lib/types";

interface ClosingFormProps {
  items: StockItem[];
  incoming: Record<string, number>;
  /** Stock out already recorded today; Used can not go below it. */
  out: Record<string, number>;
  /** Previously saved draft, if any. */
  draft: Record<string, number> | null;
  onSaveDraft: (used: Record<string, number>) => void;
  onComplete: (used: Record<string, number>) => void;
}

/**
 * Cashier enters what was used today; closing stock = opening + incoming - used.
 * Stock out recorded during the day is already counted in Used.
 */
export function ClosingForm({ items, incoming, out, draft, onSaveDraft, onComplete }: ClosingFormProps) {
  const [used, setUsed] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((item) => [item.id, Math.max(draft?.[item.id] ?? 0, out[item.id] ?? 0)])),
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Bahan</th>
              <th className="px-4 py-3 text-right font-medium">Opening Stock</th>
              <th className="px-4 py-3 text-right font-medium">Incoming</th>
              <th className="px-4 py-3 text-center font-medium">Used</th>
              <th className="px-4 py-3 text-right font-medium">Closing</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const itemIncoming = incoming[item.id] ?? 0;
              const itemOut = out[item.id] ?? 0;
              const opening = todayOpening(item, itemIncoming, itemOut);
              const available = opening + itemIncoming;
              const itemUsed = Math.max(used[item.id] ?? 0, itemOut);
              const step = item.unit === "pcs" ? 10 : 1;
              const setItemUsed = (value: number) =>
                setUsed((current) => ({
                  ...current,
                  [item.id]: Math.min(Math.max(Number.isFinite(value) ? Math.round(value) : 0, itemOut), available),
                }));

              return (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.name}</p>
                    {itemOut > 0 && (
                      <p className="text-xs text-muted">
                        Termasuk stok keluar {itemOut} {item.unit}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {opening} <span className="text-muted">{item.unit}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {itemIncoming} <span className="text-muted">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Kurangi ${item.name}`}
                        onClick={() => setItemUsed(itemUsed - step)}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line text-muted hover:bg-background hover:text-ink"
                      >
                        <Minus className="size-4" />
                      </button>
                      <input
                        type="number"
                        aria-label={`Used ${item.name}`}
                        min={itemOut}
                        max={available}
                        value={itemUsed}
                        onChange={(event) => setItemUsed(Number(event.target.value))}
                        className="h-9 w-16 rounded-lg border border-line text-center font-medium tabular-nums outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                      <button
                        type="button"
                        aria-label={`Tambah ${item.name}`}
                        onClick={() => setItemUsed(itemUsed + step)}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line text-muted hover:bg-background hover:text-ink"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                    {available - itemUsed} <span className="font-normal text-muted">{item.unit}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="lg" onClick={() => onSaveDraft(used)}>
            Simpan Draft
          </Button>
          <Button size="lg" onClick={() => setConfirming(true)}>
            Selesaikan Closing
          </Button>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Selesaikan Closing"
          message="Apakah closing hari ini sudah benar? Setelah diselesaikan, stok akan diperbarui dan closing tidak dapat diubah."
          confirmLabel="Selesaikan Closing"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onComplete(used);
          }}
        />
      )}
    </>
  );
}
