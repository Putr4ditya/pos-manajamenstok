import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  /** Icon or short text shown inside the field, on the left. */
  prefix?: ReactNode;
}

export function Input({ label, prefix, className, ...props }: InputProps) {
  const field = (
    <span
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm",
        "focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20",
        className,
      )}
    >
      {prefix && <span className="shrink-0 text-muted">{prefix}</span>}
      <input className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted/70" {...props} />
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
