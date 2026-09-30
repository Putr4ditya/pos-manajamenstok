"use client";

import { Pencil, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Input } from "@/components/common/Input";
import { PillTabs } from "@/components/common/ui";
import { STATUS_LABEL, stockStatus } from "@/lib/stock";
import type { StockItem, StockStatus } from "@/lib/types";
import { StockStatusBadge } from "./StockStatusBadge";

type Filter = "all" | StockStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "normal", label: STATUS_LABEL.normal },
  { value: "attention", label: STATUS_LABEL.attention },
  { value: "threshold", label: STATUS_LABEL.threshold },
];

interface StockTableProps {
  items: StockItem[];
  onSelect?: (item: StockItem) => void;
  /** When given, each row gets an Edit button. */
  onEdit?: (item: StockItem) => void;
}

export function StockTable({ items, onSelect, onEdit }: StockTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const rows = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (filter === "all" || stockStatus(item) === filter),
  );

  const columns: Column<StockItem>[] = [
    { header: "Bahan", render: (item) => <span className="font-medium">{item.name}</span> },
    { header: "Stok", align: "right", render: (item) => item.stock },
    { header: "Satuan", render: (item) => item.unit, className: "text-muted" },
    { header: "Ambang Batas", align: "right", render: (item) => item.minimum },
    { header: "Status", render: (item) => <StockStatusBadge item={item} /> },
  ];
  if (onEdit) {
    columns.push({
      header: "",
      align: "right",
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(event) => {
            // The row itself opens the detail page.
            event.stopPropagation();
            onEdit(item);
          }}
        >
          <Pencil className="size-3.5" />
          Edit
        </Button>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="w-full sm:w-72"
          placeholder="Cari bahan mentah..."
          prefix={<Search className="size-4" />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <PillTabs options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(item) => item.id}
        onRowClick={onSelect}
        empty="Tidak ada bahan yang cocok."
      />
    </div>
  );
}
