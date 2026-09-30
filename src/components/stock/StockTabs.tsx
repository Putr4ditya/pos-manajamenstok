import Link from "next/link";
import { cn } from "@/lib/format";

const TABS = [
  { id: "stock", href: "/owner/stock", label: "Bahan Mentah" },
  { id: "closing", href: "/owner/stock/closing", label: "Stock Closing" },
] as const;

/** Switches between the raw material list and the closing history. */
export function StockTabs({ active }: { active: (typeof TABS)[number]["id"] }) {
  return (
    <div className="mb-6 flex gap-6 border-b border-line">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
            tab.id === active ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
