"use client";

import {
  ChartColumn,
  ClipboardCheck,
  Coffee,
  History,
  House,
  LogOut,
  Package,
  PackageMinus,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<Role, NavItem[]> = {
  owner: [
    { href: "/owner", label: "Beranda", icon: House },
    { href: "/owner/stock", label: "Stok", icon: Package },
        { href: "/owner/products", label: "Produk", icon: Coffee },
    { href: "/owner/sales", label: "Penjualan", icon: ChartColumn },
    { href: "/owner/history", label: "Riwayat", icon: History },
    { href: "/owner/settings", label: "Pengaturan", icon: Settings },
  ],
  cashier: [
    { href: "/cashier/pos", label: "POS", icon: ShoppingCart },
    { href: "/cashier/stock", label: "Stok/Bahan Baku", icon: Package },
    { href: "/cashier/stock-out", label: "Stok Keluar", icon: PackageMinus },
    { href: "/cashier/closing", label: "Closing", icon: ClipboardCheck },
    { href: "/cashier/history", label: "Riwayat", icon: History },
  ],
};

function useNav(role: Role) {
  const pathname = usePathname();
  const { menuRequests } = useStore();
  const pendingRequests = menuRequests.filter((request) => request.status === "pending").length;
  return NAV[role].map((item) => ({
    ...item,
    // The home page only matches exactly; other items also match their sub-pages.
    active: pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(`${item.href}/`)),
    badge: item.href === "/owner/products" ? pendingRequests : 0,
  }));
}

/** Tablet and desktop navigation. Phones use <BottomNav /> instead. */
interface SidebarProps {
  role: Role;
  collapsed: boolean;
  /** Asks for confirmation before logging out. */
  onLogout: () => void;
}

export function Sidebar({ role, collapsed, onLogout }: SidebarProps) {
  const items = useNav(role);
  const { settings } = useStore();
  // Below the lg breakpoint the sidebar is always icon-only to leave room for content.
  const labelClass = collapsed ? "hidden" : "hidden lg:block";

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-line bg-surface transition-[width] md:flex",
        collapsed ? "w-16" : "w-16 lg:w-52",
      )}
    >
      <div className="flex h-14 items-center gap-3 border-b border-line px-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <Coffee className="size-5" />
        </span>
        <div className={cn("min-w-0", labelClass)}>
          <p className="truncate font-semibold leading-tight">{settings.shopName}</p>
          <p className="text-xs text-muted">{role === "owner" ? "Management" : "Kasir"}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-2.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "relative flex h-10 items-center gap-3 rounded-full px-3 text-sm font-medium transition-colors",
              item.active ? "bg-primary text-white" : "text-muted hover:bg-background hover:text-ink",
            )}
          >
            <item.icon className="size-5 shrink-0" />
            <span className={cn("flex-1 truncate", labelClass)}>{item.label}</span>
            {item.badge > 0 && (
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full bg-warning text-xs font-semibold text-white",
                  collapsed ? "absolute right-1 top-1" : "absolute right-1 top-1 lg:static",
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-line p-2.5">
        <button
          type="button"
          onClick={onLogout}
          title="Keluar"
          className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-full px-3 text-sm font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="size-5 shrink-0" />
          <span className={cn("truncate", labelClass)}>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

/** Phone navigation, fixed to the bottom of the screen. */
export function BottomNav({ role }: { role: Role }) {
  const items = useNav(role);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-14 overflow-x-auto border-t border-line bg-surface md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "relative flex min-w-16 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
            item.active ? "text-primary" : "text-muted",
          )}
        >
          <item.icon className="size-5" />
          <span className="max-w-full truncate px-1">{item.label}</span>
          {item.badge > 0 && (
            <span className="absolute right-1/2 top-1 flex size-4 translate-x-4 items-center justify-center rounded-full bg-warning text-[10px] font-semibold text-white">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
