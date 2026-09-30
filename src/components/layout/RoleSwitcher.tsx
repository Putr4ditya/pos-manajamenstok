"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/common/Select";
import type { Role } from "@/lib/types";

const HOME: Record<Role, string> = { owner: "/owner", cashier: "/cashier/pos" };

/** Demo-only role switch: Owner opens the Management System, Cashier opens the POS. */
export function RoleSwitcher({ role }: { role: Role }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="hidden sm:inline">Role</span>
      <Select
        aria-label="Role"
        className="w-32"
        value={role}
        onChange={(event) => router.push(HOME[event.target.value as Role])}
        options={[
          { value: "owner", label: "Owner" },
          { value: "cashier", label: "Cashier" },
        ]}
      />
    </label>
  );
}
