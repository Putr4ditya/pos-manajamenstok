import { Card, CardTitle } from "@/components/common/ui";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { StockForecastAlert } from "@/components/dashboard/StockForecastAlert";
import { ForecastNote } from "@/components/dashboard/StockStatus";
import { addDays, dayLabel, shortLabel, TODAY } from "@/lib/date";
import { avgUsageLabel, predictionText } from "@/lib/stock";
import type { StockItem } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

interface StockDetailProps {
  item: StockItem;
  /** Whether today's closing is done, i.e. the latest usage entry is today's. */
  closedToday: boolean;
}

export function StockDetail({ item, closedToday }: StockDetailProps) {
  const lastDay = closedToday ? 0 : -1;
  const usage = item.usage.map((value, index) => {
    const date = addDays(TODAY, lastDay + index - (item.usage.length - 1));
    return { label: dayLabel(date), title: shortLabel(date), value };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Stok Saat Ini" value={`${item.stock} ${item.unit}`} />
        <Stat label="Ambang Batas" value={`${item.minimum} ${item.unit}`} />
        <Stat label="Prediksi" value={predictionText(item)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Riwayat Penggunaan</CardTitle>
          <p className="-mt-3 mb-5 text-sm text-muted">Dari closing 7 hari terakhir, dalam {item.unit}</p>
          <SalesChart
            data={usage}
            formatValue={(value) => `${value} ${item.unit}`}
            formatAxis={(value) => String(value).replace(".", ",")}
            ariaLabel={`Riwayat penggunaan ${item.name} 7 hari terakhir`}
          />
        </Card>

        <Card>
          <CardTitle>Informasi</CardTitle>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted">Penggunaan rata-rata</dt>
              <dd className="mt-0.5 text-base font-medium">
                {avgUsageLabel(item)} {item.unit}/hari
              </dd>
            </div>
            <div>
              <dt className="mb-1.5 text-muted">Status</dt>
              <dd>
                <StockForecastAlert item={item} />
              </dd>
            </div>
          </dl>
          <ForecastNote />
        </Card>
      </div>
    </div>
  );
}
