"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ConfirmDialog } from "@/components/common/Modal";
import { Card, CardTitle, PageHeader } from "@/components/common/ui";
import { SETTINGS } from "@/lib/mock-data";
import { resetDemo, toast, updateSettings, useStore } from "@/lib/store";

export default function OwnerSettingsPage() {
  const { settings } = useStore();
  const [shopName, setShopName] = useState(settings.shopName);
  const [taxRate, setTaxRate] = useState(String(settings.taxRate));
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [resetting, setResetting] = useState(false);

  const tax = Number(taxRate);
  const valid = shopName.trim().length > 0 && taxRate !== "" && tax >= 0 && tax <= 100;

  function save() {
    if (!valid) return;
    updateSettings({ shopName: shopName.trim(), taxRate: tax, receiptFooter: receiptFooter.trim() });
    toast("Pengaturan disimpan");
  }

  return (
    <>
      <PageHeader title="Pengaturan" subtitle="Informasi toko, pajak, dan struk" />

      <div className="space-y-6">
        <Card>
          <CardTitle>Toko & Struk</CardTitle>
          <div className="space-y-4">
            <Input label="Nama toko" value={shopName} onChange={(event) => setShopName(event.target.value)} />
            <Input
              label="Pajak (%)"
              type="number"
              min={0}
              max={100}
              className="w-32"
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
            />
            <Input
              label="Pesan di bagian bawah struk"
              value={receiptFooter}
              onChange={(event) => setReceiptFooter(event.target.value)}
            />
            <p className="text-sm text-muted">
              Pajak berlaku untuk transaksi baru di POS. Nama toko dan pesan tampil pada struk.
            </p>
            <Button onClick={save} disabled={!valid}>
              Simpan
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Data Demo</CardTitle>
          <p className="mb-4 text-sm text-muted">
            Kembalikan semua data ke kondisi awal: transaksi, stok, closing, dan produk.
          </p>
          <Button variant="secondary" onClick={() => setResetting(true)}>
            Reset Data Demo
          </Button>
        </Card>
      </div>

      {resetting && (
        <ConfirmDialog
          title="Reset Data Demo"
          message="Semua perubahan selama demo akan dihapus dan data kembali ke kondisi awal."
          confirmLabel="Reset"
          danger
          onCancel={() => setResetting(false)}
          onConfirm={() => {
            resetDemo();
            setShopName(SETTINGS.shopName);
            setTaxRate(String(SETTINGS.taxRate));
            setReceiptFooter(SETTINGS.receiptFooter);
            setResetting(false);
            toast("Data demo dikembalikan ke kondisi awal", "info");
          }}
        />
      )}
    </>
  );
}
