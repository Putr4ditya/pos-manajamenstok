"use client";

import { CircleCheck } from "lucide-react";
import { PageHeader } from "@/components/common/ui";
import { ClosingDetail } from "@/components/stock/ClosingDetail";
import { ClosingForm } from "@/components/stock/ClosingForm";
import { formatDateLong, TODAY } from "@/lib/date";
import { completeClosing, saveClosingDraft, toast, useStore } from "@/lib/store";

export default function CashierClosingPage() {
  const { stock, closings, todayIncoming, todayOut, closingDraft } = useStore();
  const done = closings.find((closing) => closing.date === TODAY);

  return (
    <>
      <PageHeader title="Closing Hari Ini" subtitle={formatDateLong(TODAY)} />

      {done ? (
        <>
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" />
            <div>
              <p className="font-medium">Closing hari ini sudah selesai.</p>
              <p className="text-sm text-muted">Stok telah diperbarui dan Owner dapat melihat hasil closing ini.</p>
            </div>
          </div>
          <ClosingDetail closing={done} />
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            Isi jumlah bahan yang terpakai hari ini pada kolom Used. Closing stock dihitung otomatis. Stok keluar
            yang sudah dicatat hari ini otomatis terhitung di Used.
          </p>
          <ClosingForm
            items={stock}
            incoming={todayIncoming}
            out={todayOut}
            draft={closingDraft}
            onSaveDraft={(used) => {
              saveClosingDraft(used);
              toast("Draft closing disimpan", "info");
            }}
            onComplete={(used) => {
              completeClosing(used);
              toast("Closing berhasil diselesaikan");
            }}
          />
        </>
      )}
    </>
  );
}
