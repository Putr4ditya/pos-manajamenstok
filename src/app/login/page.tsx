"use client";

import { ClipboardList, Coffee, Eye, EyeOff, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ACCOUNTS, HOME } from "@/lib/auth";
import { login, useHydrated, useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { session, settings } = useStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [failed, setFailed] = useState(false);

  // Each account has one role; after logging in it goes straight to that role's pages.
  useEffect(() => {
    if (hydrated && session) router.replace(HOME[session.role]);
  }, [hydrated, session, router]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setFailed(!login(identifier, password));
  }

  return (
    <div className="grid min-h-dvh bg-surface text-ink md:grid-cols-2">
      <div className="hidden flex-col items-center justify-center bg-accent p-10 text-center md:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white">
            <Coffee className="size-5" />
          </span>
          <span className="text-lg font-semibold">{settings.shopName}</span>
        </div>
        <h1 className="mt-5 max-w-md text-3xl font-semibold leading-tight tracking-tight">
          Kasir dan stok yang simpel untuk coffee shop
        </h1>
        <p className="mt-3 max-w-sm text-sm text-muted">
          Catat penjualan, pantau stok bahan, dan lihat riwayat dalam satu aplikasi.
        </p>
        <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-4">
          <span className="flex h-40 items-center justify-center rounded-3xl bg-primary text-white">
            <Coffee className="size-8" />
          </span>
          <span className="flex h-40 items-center justify-center rounded-3xl bg-primary/20 text-primary">
            <ClipboardList className="size-8" />
          </span>
          <span className="flex h-40 items-center justify-center rounded-3xl bg-surface text-primary">
            <Package className="size-8" />
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="text-3xl font-semibold tracking-tight">Masuk</h2>
          <p className="mt-3 text-sm text-muted">Gunakan akun owner atau kasir.</p>

          <div className="mt-6 space-y-4">
            <Input
              label="Username atau email"
              className="h-12"
              autoFocus
              autoComplete="username"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setFailed(false);
              }}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <span className="flex h-12 items-center gap-2 rounded-lg border border-line bg-surface pl-3 pr-1.5 text-sm focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setFailed(false);
                  }}
                  className="w-full min-w-0 bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  aria-pressed={showPassword}
                  className="cursor-pointer rounded-full p-2 text-muted hover:bg-background hover:text-ink"
                >
                  {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                </button>
              </span>
            </label>
          </div>

          {failed && (
            <p role="alert" className="mt-3 text-sm text-danger">
              Username/email atau password salah.
            </p>
          )}

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={!identifier.trim() || !password}>
            Masuk
          </Button>

          <div className="mt-8 rounded-2xl bg-background p-4 text-xs text-muted">
            <p className="mb-2 font-medium text-ink">Akun demo</p>
            {ACCOUNTS.map((account) => (
              <p key={account.username} className="py-0.5">
                {account.name}: <span className="font-mono text-ink">{account.email}</span> /{" "}
                <span className="font-mono text-ink">{account.password}</span>
              </p>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
