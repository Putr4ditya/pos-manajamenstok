"use client";

import { PageHeader } from "@/components/common/ui";
import { StockTable } from "@/components/stock/StockTable";
import { useStore } from "@/lib/store";

export default function CashierStockPage() {
  const { stock } = useStore();

  return (
    <>
      <PageHeader title="Stok/Bahan Baku" subtitle="Stok bahan mentah saat ini" />
      <StockTable items={stock} />
    </>
  );
}
