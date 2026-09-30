"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, PageHeader } from "@/components/common/ui";
import { ClosingDetail } from "@/components/stock/ClosingDetail";
import { formatDateLong } from "@/lib/date";
import { closingNeedsReview } from "@/lib/stock";
import { useStore } from "@/lib/store";

export default function OwnerClosingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { closings } = useStore();
  const closing = closings.find((candidate) => candidate.id === id);

  const back = (
    <Link
      href="/owner/stock/closing"
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
    >
      <ArrowLeft className="size-4" />
      Kembali ke Stock Closing
    </Link>
  );

  if (!closing) {
    return (
      <>
        {back}
        <p className="rounded-xl border border-line bg-surface p-10 text-center text-muted">Closing tidak ditemukan.</p>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title={`Closing ${formatDateLong(closing.date)}`}
        action={
          closingNeedsReview(closing) ? (
            <Badge tone="warning">Perlu Review</Badge>
          ) : (
            <Badge tone="success">Completed</Badge>
          )
        }
      />
      <ClosingDetail closing={closing} />
    </>
  );
}
