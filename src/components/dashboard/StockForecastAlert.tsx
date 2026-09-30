import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";
import { forecastText, stockStatus } from "@/lib/stock";
import type { StockItem, StockStatus } from "@/lib/types";

const STYLE: Record<StockStatus, { icon: LucideIcon; box: string; iconColor: string }> = {
  normal: { icon: CircleCheck, box: "border-line bg-surface", iconColor: "text-success" },
  attention: { icon: TriangleAlert, box: "border-warning/40 bg-warning/10", iconColor: "text-warning" },
  threshold: { icon: CircleAlert, box: "border-danger/30 bg-danger/5", iconColor: "text-danger" },
};

interface StockForecastAlertProps {
  item: StockItem;
  /** Show current stock and threshold on the right. */
  showStock?: boolean;
}

/**
 * Stock threshold forecast for one raw material: safe, predicted to reach the
 * threshold soon, or already at the threshold.
 */
export function StockForecastAlert({ item, showStock }: StockForecastAlertProps) {
  const { icon: Icon, box, iconColor } = STYLE[stockStatus(item)];
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-3", box)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconColor)} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted">{forecastText(item)}</p>
      </div>
      {showStock && (
        <div className="shrink-0 text-right">
          <p className="font-semibold tabular-nums">
            {item.stock} {item.unit}
          </p>
          <p className="text-xs text-muted">Ambang batas: {item.minimum}</p>
        </div>
      )}
    </div>
  );
}
