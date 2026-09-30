"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Badge, PageHeader, PillTabs } from "@/components/common/ui";
import { InvoicePreview } from "@/components/pos/InvoicePreview";
import { METHOD_LABEL } from "@/components/pos/OrderPanel";
import { formatDateFull, TODAY } from "@/lib/date";
import { rupiah } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { StockOut, Transaction } from "@/lib/types";

type Filter = "all" | "stock" | "transaction";

type Row =
  | { kind: "transaction"; id: string; time: string; transaction: Transaction }
  | { kind: "stock"; id: string; time: string; stockOut: StockOut };

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

/** Today's product transactions and stock out in one list. Shared by Owner and Cashier. */
export function HistoryView() {
  const { transactions, stockOuts, settings } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Row | null>(null);

  const all: Row[] = [
    ...transactions
      .filter((trx) => trx.date === TODAY)
      .map((transaction): Row => ({ kind: "transaction", id: transaction.id, time: transaction.time, transaction })),
    ...stockOuts
      .filter((out) => out.date === TODAY)
      .map((stockOut): Row => ({ kind: "stock", id: stockOut.id, time: stockOut.time, stockOut })),
  ].sort((a, b) => b.time.localeCompare(a.time));

  const rows = all.filter(
    (row) =>
      (filter === "all" || row.kind === filter) && row.id.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const columns: Column<Row>[] = [
    { header: "No. Transaksi", render: (row) => <span className="whitespace-nowrap font-medium">{row.id}</span> },
    { header: "Waktu", render: (row) => row.time },
    {
      header: "Item",
      render: (row) =>
        row.kind === "transaction"
          ? `${row.transaction.items.reduce((sum, item) => sum + item.qty, 0)} item`
          : `${row.stockOut.qty} ${row.stockOut.unit} ${row.stockOut.name}`,
    },
    {
      header: "Total",
      render: (row) => (row.kind === "transaction" ? rupiah(row.transaction.total) : "–"),
      className: "whitespace-nowrap tabular-nums",
    },
    { header: "Metode", render: (row) => (row.kind === "transaction" ? METHOD_LABEL[row.transaction.method] : "–") },
    {
      header: "Status",
      render: (row) =>
        row.kind === "transaction" ? <Badge tone="success">Lunas</Badge> : <Badge tone="danger">Stok Keluar</Badge>,
    },
    {
      header: "Aksi",
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => setViewing(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Riwayat"
        subtitle={`Transaksi dan stok keluar hari ini · ${formatDateFull(TODAY)}`}
        action={
          <PillTabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `Semua ${all.length}` },
              { value: "stock", label: "Stock" },
              { value: "transaction", label: "Transaksi" },
            ]}
          />
        }
      />

      <Input
        className="mb-4 w-full sm:w-72"
        placeholder="Cari nomor transaksi"
        prefix={<Search className="size-4" />}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} empty="Belum ada riwayat yang cocok." />

      {viewing?.kind === "transaction" && (
        <Modal
          title="Invoice"
          size="sm"
          onClose={() => setViewing(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setViewing(null)}>
                Close
              </Button>
              <Button onClick={() => window.print()}>Print</Button>
            </>
          }
        >
          <InvoicePreview transaction={viewing.transaction} settings={settings} className="mx-auto" />
        </Modal>
      )}

      {viewing?.kind === "stock" && (
        <Modal
          title="Stok Keluar"
          size="sm"
          onClose={() => setViewing(null)}
          footer={
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
          }
        >
          <dl className="text-sm">
            <Detail label="Nomor" value={viewing.stockOut.id} />
            <Detail label="Waktu" value={viewing.stockOut.time} />
            <Detail label="Bahan" value={viewing.stockOut.name} />
            <Detail label="Jumlah" value={`${viewing.stockOut.qty} ${viewing.stockOut.unit}`} />
            <Detail label="Tujuan pemakaian" value={viewing.stockOut.purpose} />
            <Detail label="Catatan" value={viewing.stockOut.note || "–"} />
            <Detail label="Dicatat oleh" value={viewing.stockOut.by} />
          </dl>
        </Modal>
      )}
    </>
  );
}
