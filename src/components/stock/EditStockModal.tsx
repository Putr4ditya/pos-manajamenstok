"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { Select } from "@/components/common/Select";
import { findStockByName } from "@/lib/stock";
import { deleteStockItem, toast, updateStockItem, useStore } from "@/lib/store";
import type { StockItem } from "@/lib/types";
import { unitOptions } from "./AddStockModal";

interface EditStockModalProps {
  item: StockItem;
  onClose: () => void;
  /** Called after the raw material was deleted, e.g. to leave its detail page. */
  onDeleted?: () => void;
}

/** Owner's manual correction of a raw material (name, unit, stock on hand, threshold), or its removal. */
export function EditStockModal({ item, onClose, onDeleted }: EditStockModalProps) {
  const { stock: items } = useStore();
  const [name, setName] = useState(item.name);
  const [unit, setUnit] = useState(item.unit);
  const [stock, setStock] = useState(String(item.stock));
  const [minimum, setMinimum] = useState(String(item.minimum));
  const [deleting, setDeleting] = useState(false);

  const trimmedName = name.trim();
  const sameName = findStockByName(items, trimmedName);
  const duplicate = !!sameName && sameName.id !== item.id;
  const isAmount = (value: string) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
  const valid = trimmedName.length > 0 && !duplicate && isAmount(stock) && isAmount(minimum);

  function submit() {
    if (!valid) return;
    updateStockItem(item.id, { name: trimmedName, unit, stock: Number(stock), minimum: Number(minimum) });
    toast(`${trimmedName} diperbarui`);
    onClose();
  }

  if (deleting) {
    return (
      <ConfirmDialog
        title="Hapus Bahan"
        message={`Hapus ${item.name} dari daftar bahan? Histori closing tetap tersimpan.`}
        confirmLabel="Hapus"
        danger
        onCancel={() => setDeleting(false)}
        onConfirm={() => {
          deleteStockItem(item.id);
          toast("Bahan dihapus", "info");
          onClose();
          onDeleted?.();
        }}
      />
    );
  }

  return (
    <Modal
      title="Edit Bahan"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" className="mr-auto text-danger hover:text-danger" onClick={() => setDeleting(true)}>
            Hapus
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!valid}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Input label="Nama bahan" autoFocus value={name} onChange={(event) => setName(event.target.value)} />
          {duplicate && <p className="mt-1.5 text-sm text-danger">Nama ini sudah dipakai bahan lain.</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Stok saat ini"
            type="number"
            min={0}
            step="any"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
          />
          <Select
            label="Satuan"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            options={unitOptions(item.unit)}
          />
        </div>
        <Input
          label={`Ambang batas minimum (${unit})`}
          type="number"
          min={0}
          step="any"
          value={minimum}
          onChange={(event) => setMinimum(event.target.value)}
        />
        <p className="text-sm text-muted">
          Mengubah stok di sini adalah koreksi manual. Untuk mencatat barang masuk, gunakan Tambah Stok.
        </p>
      </div>
    </Modal>
  );
}
