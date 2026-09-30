"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Select } from "@/components/common/Select";
import { Card, CardTitle, PageHeader } from "@/components/common/ui";
import { ProductRanking } from "@/components/dashboard/ProductRanking";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { InvoicePreview } from "@/components/pos/InvoicePreview";
import { dayLabel, shortLabel, TODAY } from "@/lib/date";
import { compactNumber, formatNumber, rupiah } from "@/lib/format";
import { CATEGORIES } from "@/lib/mock-data";
import {
  leastProducts,
  PERIOD_LABEL,
  periodRange,
  summarizeSales,
  topProducts,
  type Period,
} from "@/lib/sales";
import { useStore } from "@/lib/store";
import type { Category, Transaction } from "@/lib/types";

export default function OwnerSalesPage() {
  const { transactions, settings } = useStore();
  const [period, setPeriod] = useState<Period>("today");
  const [category, setCategory] = useState<Category | "all">("all");
  const [viewing, setViewing] = useState<Transaction | null>(null);

  const summary = summarizeSales(transactions, { ...periodRange(period), category });
  // A single day makes a poor chart, so "Hari Ini" shows the week leading up to today.
  const chartPeriod: Period = period === "today" ? "7d" : period;
  const chart =
    chartPeriod === period
      ? summary
      : summarizeSales(transactions, { ...periodRange(chartPeriod), category });
  const points = chart.daily.map((point) => ({
    label: chartPeriod === "7d" ? dayLabel(point.date) : shortLabel(point.date),
    title: shortLabel(point.date),
    ...point,
  }));

  const recent = transactions.filter((trx) => trx.date === TODAY);

  const columns: Column<Transaction>[] = [
    { header: "Invoice", render: (trx) => <span className="font-mono text-xs font-medium">{trx.id}</span> },
    { header: "Waktu", render: (trx) => trx.time, className: "text-muted" },
    {
      header: "Produk",
      render: (trx) => trx.items.map((item) => `${item.name} × ${item.qty}`).join(", "),
      className: "text-muted",
    },
    { header: "Pembayaran", render: (trx) => trx.method },
    { header: "Total", align: "right", render: (trx) => <span className="font-medium">{rupiah(trx.total)}</span> },
  ];

  return (
    <>
      <PageHeader title="Penjualan" subtitle="Laporan penjualan" />

      <div className="mb-5 flex flex-wrap gap-3">
        <Select
          label="Periode"
          className="w-44"
          value={period}
          onChange={(event) => setPeriod(event.target.value as Period)}
          options={(Object.keys(PERIOD_LABEL) as Period[]).map((value) => ({ value, label: PERIOD_LABEL[value] }))}
        />
        <Select
          label="Kategori"
          className="w-44"
          value={category}
          onChange={(event) => setCategory(event.target.value as Category | "all")}
          options={[{ value: "all", label: "Semua" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Gross Sales" value={rupiah(summary.gross)} hint="Sebelum diskon dan pajak" />
        <SummaryCard label="Discount" value={rupiah(summary.discount)} hint="Total potongan harga" />
        <SummaryCard label="Tax" value={rupiah(summary.tax)} hint="Pajak yang dipungut" />
        <SummaryCard label="Net Sales" value={rupiah(summary.net)} hint="Gross − Discount + Tax" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Penjualan</CardTitle>
          <p className="-mt-3 mb-5 text-sm text-muted">{PERIOD_LABEL[chartPeriod]}</p>
          <SalesChart
            data={points.map((point) => ({ label: point.label, title: point.title, value: point.net }))}
            formatValue={rupiah}
            formatAxis={compactNumber}
            ariaLabel={`Penjualan ${PERIOD_LABEL[chartPeriod]}`}
          />
        </Card>
        <Card>
          <CardTitle>Transaksi</CardTitle>
          <p className="-mt-3 mb-5 text-sm text-muted">
            {PERIOD_LABEL[chartPeriod]} · {formatNumber(summary.transactions)} transaksi{" "}
            {PERIOD_LABEL[period].toLowerCase()}
          </p>
          <SalesChart
            data={points.map((point) => ({ label: point.label, title: point.title, value: point.transactions }))}
            formatValue={(value) => `${formatNumber(value)} transaksi`}
            formatAxis={formatNumber}
            ariaLabel={`Jumlah transaksi ${PERIOD_LABEL[chartPeriod]}`}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ProductRanking title="Produk Terlaris" products={topProducts(summary.products)} />
        <ProductRanking title="Produk Kurang Terjual" products={leastProducts(summary.products)} />
      </div>

      
    </>
  );
}
