"use client";

import { LogOut, PanelLeft } from "lucide-react";
import { formatDateFull, TODAY } from "@/lib/date";
import { useStore } from "@/lib/store";
import type { Role, Session } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = { owner: "Owner", cashier: "Kasir" };

interface HeaderProps {
  session: Session;
  onToggleSidebar: () => void;
  /** Asks for confirmation before logging out. */
  onLogout: () => void;
}

export function Header({ session, onToggleSidebar, onLogout }: HeaderProps) {
  const { settings } = useStore();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4 md:px-5">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Buka/tutup menu"
        className="hidden cursor-pointer rounded-lg p-2 text-muted hover:bg-background hover:text-ink lg:block"
      >
        <PanelLeft className="size-5" />
      </button>
      {/* On phones the sidebar is replaced by the bottom navigation, so the shop name moves here. */}
      <p className="truncate font-semibold md:hidden">{settings.shopName}</p>
      <p className="hidden truncate text-sm text-muted md:block">{formatDateFull(TODAY)}</p>

      <div className="ml-auto flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-primary">
          {session.name.charAt(0).toUpperCase()}
        </span>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-semibold">{session.name}</p>
          <p className="text-xs text-muted">{ROLE_LABEL[session.role]}</p>
        </div>
        {/* Tablet and desktop log out from the sidebar; phones have no sidebar. */}
        <button
          type="button"
          onClick={onLogout}
          title="Keluar"
          aria-label="Keluar"
          className="cursor-pointer rounded-full p-2 text-muted hover:bg-background hover:text-danger md:hidden"
        >
          <LogOut className="size-5" />
        </button>
      </div>
    </header>
  );
}
