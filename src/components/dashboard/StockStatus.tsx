import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardTitle } from "@/components/common/ui";
import type { StockItem } from "@/lib/types";
import { StockForecastAlert } from "./StockForecastAlert";

interface StockStatusProps {
  title: string;
  items: StockItem[];
  action?: ReactNode;
  empty?: string;
}

export function StockStatus({ title, items, action, empty = "Semua stok masih aman." }: StockStatusProps) {
  return (
    <Card>
      <CardTitle action={action}>{title}</CardTitle>
      <div className="space-y-2.5">
        {items.map((item) => (
          <StockForecastAlert key={item.id} item={item} showStock />
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-muted">{empty}</p>}
      </div>
      <ForecastNote />
    </Card>
  );
}

/** Explains where the forecast comes from without claiming a real AI model is running. */
export function ForecastNote() {
  return (
    <p className="mt-4 flex items-start gap-1.5 text-xs text-muted">
      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-secondary" />
      <span>
        <span className="font-medium text-ink">Prakiraan AI</span> — memperkirakan kapan stok mencapai ambang batas
        dari pola penggunaan. Di prototype ini memakai data simulasi.
      </span>
    </p>
  );
}
