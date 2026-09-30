import { PillTabs } from "@/components/common/ui";
import { CATEGORIES } from "@/lib/mock-data";
import type { Category } from "@/lib/types";

export type CategoryFilter = Category | "all";

interface CategoryTabsProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
  /** Number of products per category, shown next to each label. */
  counts: Record<CategoryFilter, number>;
}

export function CategoryTabs({ value, onChange, counts }: CategoryTabsProps) {
  const options: { value: CategoryFilter; label: string }[] = [
    { value: "all", label: `Semua ${counts.all}` },
    ...CATEGORIES.map((category) => ({ value: category, label: `${category} ${counts[category]}` })),
  ];
  return <PillTabs options={options} value={value} onChange={onChange} size="lg" />;
}
