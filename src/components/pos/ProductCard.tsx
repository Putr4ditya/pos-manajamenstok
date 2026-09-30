import { Ban, Clock, Minus, Plus } from "lucide-react";
import { cn, rupiah } from "@/lib/format";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  /** Position in the grid; alternates the colour of the initials tile. */
  index: number;
  /** Quantity currently in the order. */
  inCart: number;
  /** A menu change request for this product is waiting for the Owner. */
  pendingRequest: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onRequestChange: () => void;
}

/** "Iced Latte" -> "IL", "Americano" -> "AM" */
function initials(name: string) {
  const words = name.trim().split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : name.trim().slice(0, 2);
  return letters.toUpperCase();
}

export function ProductCard({
  product,
  index,
  inCart,
  pendingRequest,
  onAdd,
  onRemove,
  onRequestChange,
}: ProductCardProps) {
  const available = product.available;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-3 transition-colors",
        !available
          ? "border-dashed border-line bg-background"
          : inCart > 0
            ? "border-primary bg-accent/40"
            : "border-line bg-surface",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center justify-center rounded-xl text-lg font-semibold sm:h-20",
          !available ? "bg-line/60 text-muted" : index % 2 === 0 ? "bg-accent text-primary" : "bg-primary/15 text-primary",
        )}
      >
        {initials(product.name)}
      </div>

      <p className="mt-2.5 text-xs text-muted">{product.category}</p>
      <p className={cn("mt-1 truncate font-medium", !available && "text-muted")}>{product.name}</p>
      <p className="mt-1 font-semibold tabular-nums">{rupiah(product.price)}</p>

      {available ? (
        <>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              aria-label={`Kurangi ${product.name}`}
              disabled={inCart === 0}
              onClick={onRemove}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="font-semibold tabular-nums">{inCart}</span>
            <button
              type="button"
              aria-label={`Tambah ${product.name}`}
              onClick={onAdd}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {pendingRequest ? (
            <PendingNote className="mt-2.5" />
          ) : (
            <button
              type="button"
              onClick={onRequestChange}
              title="Laporkan tidak tersedia"
              aria-label={`Laporkan ${product.name} tidak tersedia`}
              className="absolute right-4 top-4 flex size-7 cursor-pointer items-center justify-center rounded-md bg-surface/80 text-muted hover:text-danger"
            >
              <Ban className="size-3.5" />
            </button>
          )}
        </>
      ) : (
        <div className="mt-3 flex min-h-9 flex-col justify-center gap-1">
          <p className="flex items-center gap-1.5 text-sm font-medium text-danger">
            <Ban className="size-4" />
            Tidak tersedia
          </p>
          {pendingRequest ? (
            <PendingNote />
          ) : (
            <button
              type="button"
              onClick={onRequestChange}
              className="cursor-pointer text-left text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Ajukan Perubahan Menu
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PendingNote({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 text-xs text-muted", className)}>
      <Clock className="size-3.5 shrink-0" />
      Menunggu persetujuan
    </span>
  );
}
