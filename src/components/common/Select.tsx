import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/format";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  const field = (
    <span className={cn("relative block", className)}>
      <select
        className={cn(
          "h-10 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-3 pr-9 text-sm text-ink outline-none",
          "focus:border-secondary focus:ring-2 focus:ring-secondary/20",
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </span>
  );

  if (!label) return field;
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {field}
    </label>
  );
}
