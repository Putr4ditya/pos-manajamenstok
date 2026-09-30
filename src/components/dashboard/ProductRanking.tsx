import { Card, CardTitle } from "@/components/common/ui";
import type { ProductSales } from "@/lib/types";

export function ProductRanking({ title, products }: { title: string; products: ProductSales[] }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <ol className="divide-y divide-line">
        {products.map((product, index) => (
          <li key={product.productId} className="flex items-center gap-3 py-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-muted">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{product.name}</span>
            <span className="text-sm tabular-nums text-muted">{product.qty} terjual</span>
          </li>
        ))}
        {products.length === 0 && <li className="py-4 text-center text-sm text-muted">Belum ada penjualan.</li>}
      </ol>
    </Card>
  );
}
