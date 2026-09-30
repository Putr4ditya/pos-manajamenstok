"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Card, PageHeader } from "@/components/common/ui";
import { StockStatusBadge } from "@/components/stock/StockStatusBadge";
import { cn } from "@/lib/format";
import { CASHIER_NAME, STOCK_OUT_PURPOSES } from "@/lib/mock-data";
import { stockStatus } from "@/lib/stock";
import { recordStockOut, toast, useStore } from "@/lib/store";

export default function CashierStockOutPage() {
  const { stock, session } = useStore();
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [purpose, setPurpose] = useState(STOCK_OUT_PURPOSES[0]);
  const [note, setNote] = useState("");

  const selected = stock.find((item) => item.id === itemId) ?? stock[0];
  const amount = Number(qty);
  const hasAmount = qty !== "" && Number.isFinite(amount) && amount > 0;
  const remaining = selected ? selected.stock - amount : 0;
  const valid = !!selected && hasAmount && remaining >= 0;

  const attention = stock.filter((item) => stockStatus(item) === "attention").length;
  const threshold = stock.filter((item) => stockStatus(item) === "threshold").length;
  const alerts = [
    attention > 0 && `${attention} bahan perlu perhatian`,
    threshold > 0 && `${threshold} bahan sudah mencapai ambang batas`,
  ].filter(Boolean);

  function submit() {
    if (!valid) return;
    recordStockOut({ stockItemId: selected.id, qty: amount, purpose, note: note.trim(), by: session?.name ?? CASHIER_NAME });
    toast(`Stok keluar ${selected.name} ${amount} ${selected.unit} dicatat`);
    setQty("");
    setNote("");
  }

  return (
    <>
      <PageHeader title="Stok Keluar" subtitle="Catat bahan yang diambil atau dipakai hari ini." />

      {alerts.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/15 p-4 text-sm font-medium">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-warning" />
          <p>{alerts.join(" dan ")}. Hubungi Owner untuk mencatat stok masuk.</p>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <h2 className="mb-4 font-semibold">Catat Stok Keluar</h2>
          {selected ? (
            <div className="space-y-4">
              <Select
                label="Bahan"
                value={selected.id}
                onChange={(event) => setItemId(event.target.value)}
                options={stock.map((item) => ({ value: item.id, label: item.name }))}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted">Stok tersedia</span>
                <span className="font-semibold tabular-nums">
                  {selected.stock} {selected.unit}
                </span>
              </div>
              <Input
                label={`Jumlah (${selected.unit})`}
                type="number"
                min={0}
                step="any"
                placeholder="0"
                value={qty}
                onChange={(event) => setQty(event.target.value)}
              />
              {hasAmount &&
                (remaining < 0 ? (
                  <p className="rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">
                    Jumlah melebihi stok tersedia.
                  </p>
                ) : (
                  <p
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium",
                      remaining <= selected.minimum ? "bg-warning/15" : "bg-background text-muted",
                    )}
                  >
                    Setelah dikurangi sisa {remaining} {selected.unit}
                    {remaining <= selected.minimum && " (mencapai ambang batas)"}.
                  </p>
                ))}
              <Select
                label="Tujuan pemakaian"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                options={STOCK_OUT_PURPOSES.map((value) => ({ value, label: value }))}
              />
              <Input
                label="Catatan"
                placeholder="Opsional"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <Button size="lg" className="w-full" disabled={!valid} onClick={submit}>
                Simpan Stok Keluar
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">Belum ada bahan terdaftar.</p>
          )}
        </Card>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <h2 className="font-semibold">Stok Bahan</h2>
            <span className="text-sm text-muted">{stock.length} bahan</span>
          </div>
          <ul className="divide-y divide-line">
            {stock.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={item.id === selected?.id}
                  onClick={() => setItemId(item.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm",
                    item.id === selected?.id ? "bg-accent/50" : "hover:bg-background",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {item.stock} {item.unit}
                  </span>
                  <StockStatusBadge item={item} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
