"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/common/Button";
import { resolveMenuRequest, toast, useStore } from "@/lib/store";
import type { MenuRequest } from "@/lib/types";

export function requestSummary(request: MenuRequest) {
  return request.action === "unavailable" ? "Tandai tidak tersedia" : "Tandai tersedia kembali";
}

/** Pending menu change requests from cashiers, waiting for the Owner's decision. */
export function MenuRequests() {
  const { menuRequests } = useStore();
  const pending = menuRequests.filter((request) => request.status === "pending");
  if (pending.length === 0) return null;

  function resolve(request: MenuRequest, approve: boolean) {
    resolveMenuRequest(request.id, approve);
    if (!approve) toast("Permintaan ditolak", "info");
    else if (request.action === "unavailable") toast(`${request.productName} kini tidak tersedia`);
    else toast(`${request.productName} kini tersedia kembali`);
  }

  return (
    <div className="mb-6 rounded-xl border border-warning/40 bg-warning/10 p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Bell className="size-4.5 text-warning" />
        Permintaan Perubahan Menu
      </h2>
      <ul className="mt-3 space-y-3">
        {pending.map((request) => (
          <li
            key={request.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{request.productName}</p>
              <p className="text-sm text-muted">
                {requestSummary(request)} — alasan: {request.reason}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => resolve(request, false)}>
                Tolak
              </Button>
              <Button size="sm" onClick={() => resolve(request, true)}>
                Setujui
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
