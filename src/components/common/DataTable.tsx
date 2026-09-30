import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: string;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, empty = "Tidak ada data." }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            {columns.map((column) => (
              <th
                key={column.header}
                className={cn("whitespace-nowrap px-4 py-3 font-medium", column.align === "right" && "text-right")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-line last:border-0",
                onRowClick && "cursor-pointer hover:bg-background",
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={cn("px-4 py-3", column.align === "right" && "text-right tabular-nums", column.className)}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
