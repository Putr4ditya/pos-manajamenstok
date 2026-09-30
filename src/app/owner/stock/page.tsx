"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/ui";
import { AddStockModal } from "@/components/stock/AddStockModal";
import { EditStockModal } from "@/components/stock/EditStockModal";
import { StockTable } from "@/components/stock/StockTable";
import { StockTabs } from "@/components/stock/StockTabs";
import { useStore } from "@/lib/store";
import type { StockItem } from "@/lib/types";

export default function OwnerStockPage() {
  const router = useRouter();
  const { stock } = useStore();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);

  return (
    <>
      <PageHeader
        title="Stok"
        subtitle="Stok bahan mentah dan histori closing"
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Tambah Stok
          </Button>
        }
      />
      <StockTabs active="stock" />
      <StockTable items={stock} onSelect={(item) => router.push(`/owner/stock/${item.id}`)} onEdit={setEditing} />
      {adding && <AddStockModal onClose={() => setAdding(false)} />}
      {editing && <EditStockModal item={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
