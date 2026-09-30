"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Select } from "@/components/common/Select";
import { UNITS } from "@/lib/mock-data";
import { findStockByName } from "@/lib/stock";
import { receiveStock, toast, useStore } from "@/lib/store";

interface AddStockModalProps {
  /** Prefilled raw material, when opened from a specific item. */
  stockItemId?: string;
  onClose: () => void;
}

/** Options for a unit dropdown; keeps a unit that is not in the hardcoded list selectable. */
export function unitOptions(current?: string) {
  const units = current && !UNITS.includes(current) ? [current, ...UNITS] : UNITS;
  return units.map((unit) => ({ value: unit, label: unit }));
}

/**
 * Owner types the raw material by name. A registered name is topped up; a name
 * that is not registered yet becomes a new raw material.
 */
export function AddStockModal({ stockItemId, onClose }: AddStockModalProps) {
  const { stock } = useStore();
  const preset = stock.find((item) => item.id === stockItemId);
  const [name, setName] = useState(preset?.name ?? "");
  const [qty, setQty] = useState("");
  const [newUnit, setNewUnit] = useState(UNITS[0]);
  const [minimum, setMinimum] = useState("");

  const trimmedName = name.trim();
  const existing = trimmedName ? findStockByName(stock, trimmedName) : undefined;
  // A registered material keeps its unit and, unless changed here, its threshold.
  const unit = existing?.unit ?? newUnit;
  const amount = Number(qty);
  const threshold = minimum === "" ? (existing?.minimum ?? 0) : Number(minimum);
  const valid =
    trimmedName.length > 0 && qty !== "" && Number.isFinite(amount) && amount > 0 && Number.isFinite(threshold) && threshold >= 0;

  function submit() {
    if (!valid) return;
    receiveStock({ name: existing?.name ?? trimmedName, unit, qty: amount, minimum: threshold });
    toast(
      existing
        ? `Stok ${existing.name} bertambah ${amount} ${unit}`
        : `${trimmedName} didaftarkan dengan stok ${amount} ${unit}`,
    );
    onClose();
  }

  return (
    <Modal
      title="Tambah Stok"
      onClose={onClose}
      footer={
        <>
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
        <Input
          label="Nama bahan"
          placeholder="Contoh: Milk Oatside"
          autoFocus={!preset}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Jumlah stok masuk"
            type="number"
            min={0}
            step="any"
            placeholder="0"
            autoFocus={!!preset}
            value={qty}
            onChange={(event) => setQty(event.target.value)}
          />
          <Select
            label="Satuan"
            value={unit}
            disabled={!!existing}
            onChange={(event) => setNewUnit(event.target.value)}
            options={unitOptions(existing?.unit)}
          />
        </div>
        <Input
          label={`Ambang batas minimum (${unit})`}
          type="number"
          min={0}
          step="any"
          placeholder={String(existing?.minimum ?? 0)}
          value={minimum}
          onChange={(event) => setMinimum(event.target.value)}
        />

        {trimmedName.length > 0 && (
          <p className="rounded-lg bg-background px-3 py-2.5 text-sm text-muted">
            {existing ? (
              <>
                {existing.name} sudah terdaftar dengan stok {existing.stock} {unit}.
                {valid && (
                  <>
                    {" "}
                    Stok setelah ditambah:{" "}
                    <span className="font-medium text-ink">
                      {existing.stock + amount} {unit}
                    </span>
                    .
                  </>
                )}
              </>
            ) : (
              <>Bahan ini belum terdaftar dan akan ditambahkan sebagai bahan baru.</>
            )}
          </p>
        )}
      </div>
    </Modal>
  );
}
