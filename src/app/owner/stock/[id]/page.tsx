"use client";

import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/ui";
import { AddStockModal } from "@/components/stock/AddStockModal";
import { EditStockModal } from "@/components/stock/EditStockModal";
import { StockDetail } from "@/components/stock/StockDetail";
import { StockStatusBadge } from "@/components/stock/StockStatusBadge";
import { TODAY } from "@/lib/date";
import { useStore } from "@/lib/store";

export default function OwnerStockDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { stock, closings } = useStore();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const item = stock.find((candidate) => candidate.id === id);

  const back = (
    <Link href="/owner/stock" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
      <ArrowLeft className="size-4" />
      Kembali ke Stok
    </Link>
  );

  if (!item) {
    return (
      <>
        {back}
        <p className="rounded-xl border border-line bg-surface p-10 text-center text-muted">Bahan tidak ditemukan.</p>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title={item.name}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StockStatusBadge item={item} />
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Tambah Stok
            </Button>
          </div>
        }
      />
      <StockDetail item={item} closedToday={closings.some((closing) => closing.date === TODAY)} />
      {adding && <AddStockModal stockItemId={item.id} onClose={() => setAdding(false)} />}
      {editing && (
        <EditStockModal item={item} onClose={() => setEditing(false)} onDeleted={() => router.push("/owner/stock")} />
      )}
    </>
  );
}
