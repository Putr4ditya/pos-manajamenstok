"use client";

import { MapPin, Pencil, Plus, Store } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { Badge, Card, PageHeader, Toggle } from "@/components/common/ui";
import { saveOutlet, toast, useStore } from "@/lib/store";
import type { Outlet } from "@/lib/types";

type Draft = Omit<Outlet, "id"> & { id?: string };

const NEW_OUTLET: Draft = { name: "", address: "", active: true };

export default function OwnerStoresPage() {
  const { outlets } = useStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deactivating, setDeactivating] = useState<Outlet | null>(null);

  const valid = !!draft && draft.name.trim().length > 0 && draft.address.trim().length > 0;

  function save() {
    if (!draft || !valid) return;
    saveOutlet({ ...draft, name: draft.name.trim(), address: draft.address.trim() });
    toast(draft.id ? "Outlet diperbarui" : "Outlet ditambahkan");
    setDraft(null);
  }

  function setActive(outlet: Outlet, active: boolean) {
    saveOutlet({ ...outlet, active });
    toast(`${outlet.name} ${active ? "diaktifkan" : "dinonaktifkan"}`, active ? "success" : "info");
  }

  return (
    <>
      <PageHeader
        title="Toko"
        subtitle="Daftar outlet"
        action={
          <Button onClick={() => setDraft(NEW_OUTLET)}>
            <Plus className="size-4" />
            Tambah Outlet
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {outlets.map((outlet) => (
          <Card key={outlet.id}>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-secondary">
                <Store className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{outlet.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{outlet.address}</span>
                </p>
              </div>
              <Badge tone={outlet.active ? "success" : "neutral"}>{outlet.active ? "Aktif" : "Nonaktif"}</Badge>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <span className="flex items-center gap-2.5 text-sm text-muted">
                <Toggle
                  checked={outlet.active}
                  label={`Aktifkan ${outlet.name}`}
                  onChange={(active) => (active ? setActive(outlet, true) : setDeactivating(outlet))}
                />
                {outlet.active ? "Outlet aktif" : "Outlet nonaktif"}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setDraft(outlet)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {draft && (
        <Modal
          title={draft.id ? "Edit Outlet" : "Tambah Outlet"}
          onClose={() => setDraft(null)}
          footer={
            <>
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
              label="Nama outlet"
              placeholder="Contoh: Outlet C"
              autoFocus
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
            <Input
              label="Alamat"
              placeholder="Contoh: Jl. Contoh No. 3"
              value={draft.address}
              onChange={(event) => setDraft({ ...draft, address: event.target.value })}
            />
          </div>
        </Modal>
      )}

      {deactivating && (
        <ConfirmDialog
          title="Nonaktifkan Outlet"
          message={`Nonaktifkan ${deactivating.name}? Outlet dapat diaktifkan kembali kapan saja.`}
          confirmLabel="Nonaktifkan"
          danger
          onCancel={() => setDeactivating(null)}
          onConfirm={() => {
            setActive(deactivating, false);
            setDeactivating(null);
          }}
        />
      )}
    </>
  );
}
