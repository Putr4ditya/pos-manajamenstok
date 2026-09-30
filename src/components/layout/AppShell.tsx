"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/common/Modal";
import { Toaster } from "@/components/common/Toaster";
import { ORDER_PANEL_GUTTER } from "@/components/pos/OrderPanel";
import { HOME } from "@/lib/auth";
import { cn } from "@/lib/format";
import { logout, useFocusMode, useHydrated, useStore } from "@/lib/store";
import { Header } from "./Header";
import { BottomNav, Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const { session } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isLoginPage = pathname === "/login";
  // The POS keeps its order panel fixed along the right edge of the screen.
  const hasOrderPanel = pathname === "/cashier/pos";
  // Focus mode is a POS feature: it hides the header and navigation on that page only.
  const focusMode = useFocusMode() && hasOrderPanel;

  // Every page except the login needs an account, and each account only sees its own role's pages.
  let redirectTo: string | null = null;
  if (!isLoginPage) {
    if (!session) redirectTo = "/login";
    else if (!pathname.startsWith(`/${session.role}`))
      redirectTo = HOME[session.role];
  }

  useEffect(() => {
    if (hydrated && redirectTo) router.replace(redirectTo);
  }, [hydrated, redirectTo, router]);

  if (isLoginPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  if (!hydrated || !session || redirectTo) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted">
        Memuat…
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-ink">
      {!focusMode && (
        <Sidebar
          role={session.role}
          collapsed={collapsed}
          onLogout={() => setLoggingOut(true)}
        />
      )}
      <div
        className={cn(
          "relative flex min-w-0 flex-1 flex-col",
          hasOrderPanel && ORDER_PANEL_GUTTER,
        )}
      >
        {!focusMode && (
          <Header
            session={session}
            onToggleSidebar={() => setCollapsed((value) => !value)}
            onLogout={() => setLoggingOut(true)}
          />
        )}
        <main className="flex-1 overflow-y-auto p-3 pb-20 sm:p-4 sm:pb-20 md:p-5 md:pb-5">
          {children}
        </main>
      </div>
      {!focusMode && <BottomNav role={session.role} />}
      {loggingOut && (
        <ConfirmDialog
          title="Keluar"
          message="Keluar dari akun ini? Anda perlu masuk lagi untuk melanjutkan."
          confirmLabel="Keluar"
          cancelLabel="Batal"
          danger
          onCancel={() => setLoggingOut(false)}
          onConfirm={() => {
            setLoggingOut(false);
            // With no session, the redirect above sends the user to the login page.
            logout();
          }}
        />
      )}
      <Toaster />
    </div>
  );
}
