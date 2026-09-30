"use client";

import { Receipt, ShoppingBag, Wallet } from "lucide-react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/common/ui";
import { MenuRequests } from "@/components/dashboard/MenuRequests";
import { ProductRanking } from "@/components/dashboard/ProductRanking";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { StockStatus } from "@/components/dashboard/StockStatus";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { addDays, dayLabel, formatDateFull, shortLabel, TODAY } from "@/lib/date";
import { compactNumber, formatNumber, rupiah } from "@/lib/format";
import { leastProducts, summarizeSales, topProducts } from "@/lib/sales";
import { sortByUrgency } from "@/lib/stock";
import { useStore } from "@/lib/store";

export default function OwnerHomePage() {
  const { transactions, stock, session } = useStore();

  const today = summarizeSales(transactions, { from: TODAY, to: TODAY, category: "all" });
  const week = summarizeSales(transactions, { from: addDays(TODAY, -6), to: TODAY, category: "all" });
  const stockItems = sortByUrgency(stock).slice(0, 4);

  return (
    <>
      <div className="mb-5 rounded-3xl bg-primary px-5 py-6 text-white sm:px-7 sm:py-7">
        <p className="text-sm text-white/70">{formatDateFull(TODAY)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Selamat datang, {session?.name ?? "Owner"}</h1>
        <p className="mt-1 text-sm text-white/80">Ringkasan penjualan dan stok hari ini.</p>
      </div>
      <MenuRequests />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Penjualan Hari Ini" value={rupiah(today.net)} icon={Wallet} />
        <SummaryCard label="Transaksi" value={formatNumber(today.transactions)} icon={Receipt} />
        <SummaryCard label="Produk Terjual" value={formatNumber(today.itemsSold)} icon={ShoppingBag} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
          <SalesChart
            data={week.daily.map((point) => ({
              label: dayLabel(point.date),
              title: shortLabel(point.date),
              value: point.net,
            }))}
            formatValue={rupiah}
            formatAxis={compactNumber}
            height={220}
            ariaLabel="Penjualan 7 hari terakhir"
          />
        </Card>
        <div className="lg:col-span-2">
          <StockStatus
            title="Status Stok"
            items={stockItems}
            action={
              <Link href="/owner/stock" className="text-sm font-medium text-primary hover:underline">
                Lihat semua
              </Link>
            }
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <ProductRanking title="Produk Terlaris" products={topProducts(today.products)} />
        <ProductRanking title="Produk Kurang Terjual" products={leastProducts(today.products)} />
      </div>
    </>
  );
}
