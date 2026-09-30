import { redirect } from "next/navigation";

/** The Cashier has no dashboard; the POS is their home. */
export default function CashierHome() {
  redirect("/cashier/pos");
}
