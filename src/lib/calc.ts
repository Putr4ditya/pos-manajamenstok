import type { CartLine, Discount, Totals } from "./types";

/**
 * subtotal        = sum(quantity × unit_price)
 * discount_amount = subtotal × value / 100 (percent) or value (fixed)
 * tax_base        = subtotal - discount_amount
 * tax_amount      = tax_base × tax_rate / 100
 * total           = tax_base + tax_amount
 */
export function calcTotals(lines: CartLine[], discount: Discount, taxRate: number): Totals {
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0);

  let discountAmount = 0;
  if (discount.type === "percent") {
    discountAmount = (subtotal * Math.min(Math.max(discount.value, 0), 100)) / 100;
  } else if (discount.type === "fixed") {
    discountAmount = Math.min(Math.max(discount.value, 0), subtotal);
  }
  discountAmount = Math.round(discountAmount);

  const taxBase = subtotal - discountAmount;
  const taxAmount = Math.round((taxBase * taxRate) / 100);

  return { subtotal, discountAmount, taxBase, taxAmount, total: taxBase + taxAmount };
}

export function discountLabel(discount: Discount) {
  return discount.type === "percent" ? `Diskon ${discount.value}%` : "Diskon";
}
