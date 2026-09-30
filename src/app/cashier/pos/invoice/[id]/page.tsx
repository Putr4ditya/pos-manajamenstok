"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { InvoicePreview } from "@/components/pos/InvoicePreview";
import { useStore } from "@/lib/store";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { transactions, settings } = useStore();
  const transaction = transactions.find((trx) => trx.id === id);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      <Link href="/cashier/pos" className="mb-4 inline-flex items-center gap-1.5 self-start text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" />
        Kembali ke POS
      </Link>

      {transaction ? (
        <>
          <h1 className="mb-5 self-start text-xl font-semibold tracking-tight">Invoice</h1>
          <InvoicePreview transaction={transaction} settings={settings} />
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" size="lg" onClick={() => router.push("/cashier/pos")}>
              Close
            </Button>
            <Button size="lg" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </>
      ) : (
        <p className="w-full rounded-xl border border-line bg-surface p-10 text-center text-muted">
          Invoice tidak ditemukan.
        </p>
      )}
    </div>
  );
}
