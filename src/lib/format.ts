export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** 25000 -> "25.000" */
export function formatNumber(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return sign + Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 25000 -> "Rp 25.000" */
export function rupiah(value: number) {
  const rounded = Math.round(value);
  return `${rounded < 0 ? "-" : ""}Rp ${formatNumber(Math.abs(rounded))}`;
}

/** 1500000 -> "1,5 jt", 250000 -> "250 rb" */
export function compactNumber(value: number) {
  if (value >= 1_000_000) return `${decimal(value / 1_000_000)} jt`;
  if (value >= 1_000) return `${decimal(value / 1_000)} rb`;
  return decimal(value);
}

/** 1.5 -> "1,5", 2 -> "2" */
export function decimal(value: number) {
  return (Math.round(value * 10) / 10).toString().replace(".", ",");
}
