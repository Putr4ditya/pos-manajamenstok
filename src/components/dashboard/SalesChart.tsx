"use client";

import { useState } from "react";
import { cn } from "@/lib/format";

export interface ChartPoint {
  /** Short axis label, e.g. "Sel". */
  label: string;
  /** Longer name shown in the tooltip, e.g. "29 Sep". */
  title?: string;
  value: number;
}

interface SalesChartProps {
  data: ChartPoint[];
  /** Formats a value for the tooltip. */
  formatValue: (value: number) => string;
  /** Formats a value for the axis (defaults to formatValue). */
  formatAxis?: (value: number) => string;
  height?: number;
  ariaLabel: string;
}

const NICE_STEPS = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];

function niceMax(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = NICE_STEPS.find((candidate) => candidate * power >= value) ?? 10;
  return step * power;
}

/** A simple single-series bar chart with a hover tooltip. */
export function SalesChart({ data, formatValue, formatAxis = formatValue, height = 200, ariaLabel }: SalesChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((point) => point.value), 0));
  const labelEvery = Math.ceil(data.length / 10);

  return (
    <div role="img" aria-label={ariaLabel} className="flex gap-3 text-xs text-muted">
      <div className="flex flex-col justify-between text-right tabular-nums" style={{ height }}>
        {[max, max / 2, 0].map((tick) => (
          <span key={tick} className="-my-2 leading-4">
            {formatAxis(tick)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          {[0, 50, 100].map((top) => (
            <div key={top} className="absolute inset-x-0 border-t border-line" style={{ top: `${top}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end">
            {data.map((point, index) => {
              const percent = (point.value / max) * 100;
              return (
                <div
                  key={index}
                  className="relative flex h-full flex-1 items-end justify-center px-[1px]"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className={cn(
                      "w-full max-w-9 rounded-t-[4px] transition-colors",
                      hovered === index ? "bg-primary-dark" : "bg-primary",
                    )}
                    style={{ height: `${percent}%`, minHeight: point.value > 0 ? 2 : 0 }}
                  />
                  {hovered === index && (
                    <div
                      className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-center text-xs text-white shadow-lg"
                      style={{ bottom: `calc(${percent}% + 8px)` }}
                    >
                      <span className="block text-white/70">{point.title ?? point.label}</span>
                      <span className="font-semibold tabular-nums">{formatValue(point.value)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex">
          {data.map((point, index) => (
            <span key={index} className="flex-1 overflow-visible whitespace-nowrap text-center">
              {index % labelEvery === 0 ? point.label : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
