"use client";

import { Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Input } from "@/components/common/Input";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { Select } from "@/components/common/Select";
import { Badge, PageHeader, Toggle } from "@/components/common/ui";
import { MenuRequests } from "@/components/dashboard/MenuRequests";
import { rupiah } from "@/lib/format";
import { CATEGORIES } from "@/lib/mock-data";
import { deleteProduct, saveProduct, toast, useStore } from "@/lib/store";
import type { Category, Product } from "@/lib/types";

type Draft = Omit<Product, "id" | "price"> & { id?: string; price: string };

const NEW_PRODUCT: Draft = { name: "", category: "Coffee", price: "", active: true, available: true };

export default function OwnerProductsPage() {
  const { products } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rows = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (category === "all" || product.category === category),
  );

  const price = Number(draft?.price);
  const valid = !!draft && draft.name.trim().length > 0 && Number.isFinite(price) && price > 0;

  function save() {
    if (!draft || !valid) return;
    saveProduct({ ...draft, name: draft.name.trim(), price });
    toast(draft.id ? "Produk diperbarui" : "Produk ditambahkan");
    setDraft(null);
  }

  function setActive(product: Product, active: boolean) {
    saveProduct({ ...product, active });
    toast(`${product.name} ${active ? "diaktifkan" : "dinonaktifkan"}`, active ? "success" : "info");
  }

  const columns: Column<Product>[] = [
    { header: "Produk", render: (product) => <span className="font-medium">{product.name}</span> },
    { header: "Kategori", render: (product) => product.category, className: "text-muted" },
    { header: "Harga", align: "right", render: (product) => rupiah(product.price) },
    {
      header: "Ketersediaan",
      render: (product) =>
        product.available ? <span className="text-muted">Tersedia</span> : <Badge tone="warning">Tidak tersedia</Badge>,
    },
    {
      header: "Status",
      render: (product) => (
        <span className="flex items-center gap-2.5">
          <Toggle
            checked={product.active}
            onChange={(active) => setActive(product, active)}
            label={`Aktifkan ${product.name}`}
          />
          <span className={product.active ? "text-success" : "text-muted"}>
            {product.active ? "Aktif" : "Nonaktif"}
          </span>
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      render: (product) => (
        <Button variant="secondary" size="sm" onClick={() => setDraft({ ...product, price: String(product.price) })}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Produk"
        subtitle="Kelola menu, harga, dan ketersediaan"
        action={
          <Button onClick={() => setDraft(NEW_PRODUCT)}>
            <Plus className="size-4" />
            Tambah Produk
          </Button>
        }
      />
      <MenuRequests />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          className="w-full sm:w-72"
          placeholder="Cari produk..."
          prefix={<Search className="size-4" />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          Kategori
          <Select
            className="w-40"
            value={category}
            onChange={(event) => setCategory(event.target.value as Category | "all")}
            options={[{ value: "all", label: "Semua" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
        </label>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(product) => product.id} empty="Tidak ada produk yang cocok." />

      {draft && !deleting && (
        <Modal
          title={draft.id ? "Edit Produk" : "Tambah Produk"}
          onClose={() => setDraft(null)}
          footer={
            <>
              {draft.id && (
                <Button variant="ghost" className="mr-auto text-danger hover:text-danger" onClick={() => setDeleting(true)}>
                  Hapus
                </Button>
              )}
              <Button variant="secondary" onClick={() => setDraft(null)}>
                Batal
              </Button>
              <Button onClick={save} disabled={!valid}>
                Simpan
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Nama produk"
              placeholder="Contoh: Caramel Latte"
              autoFocus
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Kategori"
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <Input
                label="Harga"
                type="number"
                min={0}
                placeholder="0"
                prefix="Rp"
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-line px-3 py-2.5 text-sm">
              <span>
                <span className="font-medium">Tersedia dijual</span>
                <span className="ml-2 text-muted">{draft.available ? "Tersedia" : "Tidak tersedia"}</span>
              </span>
              <Toggle
                checked={draft.available}
                label={`${draft.name || "Produk"} tersedia dijual`}
                onChange={(available) => setDraft({ ...draft, available })}
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg bg-background px-3 py-2.5 text-sm">
              <span className="font-medium">Produk aktif</span>
              <Toggle
                checked={draft.active}
                label="Produk aktif"
                onChange={(active) => setDraft({ ...draft, active })}
              />
            </label>
          </div>
        </Modal>
      )}

      {draft?.id && deleting && (
        <ConfirmDialog
          title="Hapus Produk"
          message={`Hapus ${draft.name} dari daftar produk? Riwayat penjualan tetap tersimpan.`}
          confirmLabel="Hapus"
          danger
          onCancel={() => setDeleting(false)}
          onConfirm={() => {
            deleteProduct(draft.id!);
            toast("Produk dihapus", "info");
            setDeleting(false);
            setDraft(null);
          }}
        />
      )}
    </>
  );
}
