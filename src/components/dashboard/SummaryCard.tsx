import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/common/ui";

interface SummaryCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}

export function SummaryCard({ label, value, hint, icon: Icon }: SummaryCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {Icon && <Icon className="size-5 text-secondary" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
