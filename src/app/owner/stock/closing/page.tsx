"use client";

import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Badge, PageHeader } from "@/components/common/ui";
import { StockTabs } from "@/components/stock/StockTabs";
import { formatDate } from "@/lib/date";
import { closingNeedsReview } from "@/lib/stock";
import { useStore } from "@/lib/store";
import type { Closing } from "@/lib/types";

export default function OwnerClosingPage() {
  const router = useRouter();
  const { closings } = useStore();

  const columns: Column<Closing>[] = [
    { header: "Tanggal", render: (closing) => <span className="font-medium">{formatDate(closing.date)}</span> },
    {
      header: "Status Stock",
      render: (closing) =>
        closingNeedsReview(closing) ? <Badge tone="warning">Perlu Review</Badge> : <Badge tone="success">Valid</Badge>,
    },
    { header: "Status Sales", render: () => <Badge tone="success">Valid</Badge> },
    {
      header: "Status",
      render: (closing) =>
        closingNeedsReview(closing) ? (
          <Badge tone="warning">Perlu Review</Badge>
        ) : (
          <Badge tone="success">Completed</Badge>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Stok" subtitle="Stok bahan mentah dan histori closing" />
      <StockTabs active="closing" />
      <DataTable
        columns={columns}
        rows={closings}
        rowKey={(closing) => closing.id}
        onRowClick={(closing) => router.push(`/owner/stock/closing/${closing.id}`)}
        empty="Belum ada histori closing."
      />
    </>
  );
}
