import { Badge } from "@/components/common/ui";
import { cn } from "@/lib/format";
import type { Closing, ClosingLine } from "@/lib/types";

function Row({ label, value, strong }: { label: string; value: number | string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between py-1", strong && "font-semibold")}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function LineCard({ line }: { line: ClosingLine }) {
  const difference = line.physical === undefined ? 0 : line.physical - line.closing;
  const review = difference !== 0;
  return (
    <div className={cn("rounded-xl border bg-surface p-4 shadow-sm", review ? "border-warning/50" : "border-line")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{line.name}</h3>
        {review ? <Badge tone="warning">Perlu Review</Badge> : <span className="text-xs text-muted">{line.unit}</span>}
      </div>
      <dl className="text-sm">
        <Row label="Opening" value={line.opening} />
        <Row label="Incoming" value={line.incoming} />
        <Row label="Used" value={line.used} />
        <div className="mt-1 border-t border-line pt-1">
          <Row label="Closing" value={line.closing} strong />
        </div>
      </dl>
      {review && (
        <dl className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-sm">
          <Row label="System Expected" value={line.closing} />
          <Row label="Physical Stock" value={line.physical!} />
          <Row label="Difference" value={difference > 0 ? `+${difference}` : difference} strong />
        </dl>
      )}
    </div>
  );
}

export function ClosingDetail({ closing }: { closing: Closing }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {closing.lines.map((line) => (
        <LineCard key={line.stockItemId} line={line} />
      ))}
    </div>
  );
}
