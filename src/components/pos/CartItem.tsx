import { Minus, Plus, Trash2 } from "lucide-react";
import { rupiah } from "@/lib/format";
import type { CartLine } from "@/lib/types";

interface CartItemProps {
  line: CartLine;
  onChangeQty: (qty: number) => void;
  onRemove: () => void;
}

const STEP_BUTTON =
  "flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line text-muted hover:bg-background hover:text-ink";

export function CartItem({ line, onChangeQty, onRemove }: CartItemProps) {
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{line.name}</p>
          <p className="text-sm tabular-nums text-muted">
            {line.qty} × {rupiah(line.price)}
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums">{rupiah(line.qty * line.price)}</p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" aria-label={`Kurangi ${line.name}`} className={STEP_BUTTON} onClick={() => onChangeQty(line.qty - 1)}>
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center font-medium tabular-nums">{line.qty}</span>
        <button type="button" aria-label={`Tambah ${line.name}`} className={STEP_BUTTON} onClick={() => onChangeQty(line.qty + 1)}>
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Hapus ${line.name}`}
          onClick={onRemove}
          className="ml-auto flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
