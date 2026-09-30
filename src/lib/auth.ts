import type { Role, Session } from "./types";

/** Where each role lands after logging in. */
export const HOME: Record<Role, string> = { owner: "/owner", cashier: "/cashier/pos" };

interface Account extends Session {
  email: string;
  password: string;
}

/**
 * Demo accounts, one role per account. This stands in for the `users` table:
 * the real check (password hash, session token) belongs to the backend.
 */
export const ACCOUNTS: Account[] = [
  { username: "owner", email: "owner@coffeeshop.com", password: "owner123", name: "Owner", role: "owner" },
  { username: "cashier", email: "cashier@coffeeshop.com", password: "cashier123", name: "Cashier A", role: "cashier" },
];

/** Matches the identifier against username or email, ignoring letter case. */
export function authenticate(identifier: string, password: string): Session | null {
  const key = identifier.trim().toLowerCase();
  const account = ACCOUNTS.find((a) => (a.username === key || a.email === key) && a.password === password);
  if (!account) return null;
  return { username: account.username, name: account.name, role: account.role };
}
