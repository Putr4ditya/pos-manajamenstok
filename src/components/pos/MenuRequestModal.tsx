"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import type { MenuRequest, Product } from "@/lib/types";

interface MenuRequestModalProps {
  product: Product;
  action: MenuRequest["action"];
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

export function MenuRequestModal({ product, action, onSubmit, onClose }: MenuRequestModalProps) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length > 0;

  return (
    <Modal
      title="Ajukan Perubahan Menu"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button disabled={!valid} onClick={() => onSubmit(reason.trim())}>
            Kirim Permintaan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted">Produk</p>
          <p className="font-medium">{product.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Perubahan</p>
          <p className="font-medium">
            {action === "unavailable" ? "Tandai tidak tersedia" : "Tandai tersedia kembali"}
          </p>
        </div>
        <Input
          label="Alasan"
          placeholder={action === "unavailable" ? "Contoh: Susu habis" : "Contoh: Bahan sudah tersedia"}
          autoFocus
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && valid) onSubmit(reason.trim());
          }}
        />
        <p className="text-sm text-muted">Permintaan akan dikirim ke Owner untuk disetujui.</p>
      </div>
    </Modal>
  );
}
