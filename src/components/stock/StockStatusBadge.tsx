import { Badge, type Tone } from "@/components/common/ui";
import { daysToThreshold, STATUS_LABEL, stockStatus } from "@/lib/stock";
import type { StockItem, StockStatus } from "@/lib/types";

const TONE: Record<StockStatus, Tone> = { normal: "success", attention: "warning", threshold: "danger" };

export function StockStatusBadge({ item }: { item: StockItem }) {
  const status = stockStatus(item);
  return (
    <Badge tone={TONE[status]}>
      {STATUS_LABEL[status]}
      {status === "attention" && ` · ±${daysToThreshold(item)} hari`}
    </Badge>
  );
}
