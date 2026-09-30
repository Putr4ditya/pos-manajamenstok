"use client";

import { CircleCheck, Printer, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { cn, formatNumber, rupiah } from "@/lib/format";
import type { PaymentMethod, Settings, Transaction } from "@/lib/types";
import { InvoicePreview } from "./InvoicePreview";
import { METHOD_LABEL } from "./OrderPanel";

/** Methods offered at the till. "OTHER" stays a valid method for existing data but is not offered. */
const METHODS: PaymentMethod[] = ["CASH", "QRIS", "DEBIT", "CREDIT"];

interface PaymentModalProps {
  total: number;
  /** Set once the transaction has been completed; switches to the success view. */
  completed: Transaction | null;
  settings: Settings;
  onPay: (method: PaymentMethod, paid: number) => void;
  onClose: () => void;
}

/** Opened by Bayar: choose the payment method, take the payment, then print the receipt. */
export function PaymentModal({ total, completed, settings, onPay, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [cash, setCash] = useState("");

  if (completed) {
    return (
      <Modal title="Transaksi Berhasil" size="sm" onClose={onClose}>
        <div className="flex flex-col items-center py-2 text-center">
          <CircleCheck className="size-14 text-success" />
          <p className="mt-3 text-lg font-semibold">Transaksi Berhasil</p>
          <p className="mt-1 font-mono text-sm text-muted">{completed.id}</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{rupiah(completed.total)}</p>
          <p className="mt-1 text-sm text-muted">
            {METHOD_LABEL[completed.method]}
            {completed.method === "CASH" && completed.change > 0 && ` · Kembalian ${rupiah(completed.change)}`}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button className="col-span-2" size="lg" onClick={() => window.print()}>
            <Printer className="size-4" />
            Cetak Struk
          </Button>
          <Link
            href={`/cashier/pos/invoice/${completed.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line text-sm font-medium hover:bg-background"
          >
            <Receipt className="size-4" />
            Lihat Invoice
          </Link>
          <Button variant="secondary" onClick={onClose}>
            Transaksi Baru
          </Button>
        </div>
        {/* Only visible when printing */}
        <InvoicePreview transaction={completed} settings={settings} className="hidden" />
      </Modal>
    );
  }

  const isCash = method === "CASH";
  const paid = isCash ? Number(cash) || 0 : total;
  const change = paid - total;
  const quickAmounts = [total, ...[50000, 100000, 200000].filter((amount) => amount !== total)];

  return (
    <Modal title="Pembayaran" onClose={onClose}>
      <div className="rounded-2xl bg-background px-5 py-4 text-center">
        <p className="text-sm text-muted">Total Bayar</p>
        <p className="text-3xl font-semibold tabular-nums">{rupiah(total)}</p>
      </div>

      <p className="mb-2 mt-5 text-sm font-medium">Metode Pembayaran</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METHODS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={method === option}
            onClick={() => setMethod(option)}
            className={cn(
              "h-10 cursor-pointer rounded-full border text-sm font-medium transition-colors",
              method === option
                ? "border-primary bg-accent text-primary"
                : "border-line text-muted hover:bg-background hover:text-ink",
            )}
          >
            {METHOD_LABEL[option]}
          </button>
        ))}
      </div>

      {isCash ? (
        <>
          <p className="mb-2 mt-5 text-sm font-medium">Jumlah Dibayar</p>
          <label className="flex h-12 items-center gap-2 rounded-lg border border-line px-4 text-lg focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
            <span className="text-muted">Rp</span>
            <input
              type="number"
              min={0}
              autoFocus
              aria-label="Jumlah dibayar"
              placeholder="0"
              value={cash}
              onChange={(event) => setCash(event.target.value)}
              className="w-full min-w-0 bg-transparent font-medium tabular-nums outline-none"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickAmounts.map((amount, index) => (
              <Button key={amount} variant="secondary" size="sm" onClick={() => setCash(String(amount))}>
                {index === 0 ? "Uang pas" : formatNumber(amount)}
              </Button>
            ))}
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <span className="text-sm font-medium">Kembalian</span>
            <span className="text-xl font-semibold tabular-nums">{rupiah(Math.max(change, 0))}</span>
          </div>
          {cash !== "" && change < 0 && <p className="mt-1 text-right text-sm text-danger">Kurang {rupiah(-change)}</p>}
        </>
      ) : (
        <p className="mt-5 text-sm text-muted">
          Pastikan pembayaran {METHOD_LABEL[method]} sebesar {rupiah(total)} sudah diterima sebelum menyelesaikan
          transaksi.
        </p>
      )}

      <Button size="lg" className="mt-5 w-full" disabled={change < 0} onClick={() => onPay(method, paid)}>
        Selesaikan Transaksi
      </Button>
    </Modal>
  );
}
