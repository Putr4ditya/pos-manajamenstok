import { discountLabel } from "@/lib/calc";
import { formatDate } from "@/lib/date";
import { cn, formatNumber } from "@/lib/format";
import type { Settings, Transaction } from "@/lib/types";

interface InvoicePreviewProps {
  transaction: Transaction;
  settings: Settings;
  className?: string;
}

function Divider() {
  return <div className="my-2 border-t border-dashed border-ink/40" />;
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", bold && "text-sm font-bold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/**
 * Receipt-style invoice. The `print-area` class makes this the only thing
 * printed when window.print() is called (see @media print in globals.css).
 */
export function InvoicePreview({ transaction, settings, className }: InvoicePreviewProps) {
  return (
    <div
      className={cn(
        "print-area w-[300px] border border-line bg-white p-5 font-mono text-xs leading-relaxed text-ink shadow-sm",
        className,
      )}
    >
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-widest">{settings.shopName}</p>
      </div>

      <div className="mt-3">
        <p>{transaction.id}</p>
        <p>
          {formatDate(transaction.date)}, {transaction.time}
        </p>
        <p>{transaction.cashier}</p>
      </div>

      <Divider />
      {transaction.items.map((item) => (
        <div key={item.productId} className="mb-1">
          <div className="flex justify-between gap-4">
            <span>{item.name}</span>
            <span>
              {item.qty} x {formatNumber(item.price)}
            </span>
          </div>
          <p className="text-right">{formatNumber(item.qty * item.price)}</p>
        </div>
      ))}

      <Divider />
      <Line label="Subtotal" value={formatNumber(transaction.subtotal)} />
      {transaction.discountAmount > 0 && (
        <Line label={discountLabel(transaction.discount)} value={`-${formatNumber(transaction.discountAmount)}`} />
      )}
      <Line label={`Pajak ${transaction.taxRate}%`} value={formatNumber(transaction.taxAmount)} />

      <Divider />
      <Line label="TOTAL" value={formatNumber(transaction.total)} bold />

      <div className="mt-3">
        <Line label="Pembayaran" value={transaction.method} />
        {transaction.method === "CASH" && (
          <>
            <Line label="Dibayar" value={formatNumber(transaction.paid)} />
            <Line label="Kembalian" value={formatNumber(transaction.change)} />
          </>
        )}
      </div>

      <p className="mt-4 text-center">{settings.receiptFooter}</p>
    </div>
  );
}
