import { STATUS_LABELS } from "@/lib/domain/constants";
import type { TenantStatus } from "@/lib/domain/types";

const TONE: Record<TenantStatus, string> = {
  preview: "bg-paper text-ink-2 border-line-2",
  active: "bg-ok-tint text-ok border-ok/20",
  due: "bg-warn-tint text-warn border-warn/20",
  grace: "bg-warn-tint text-warn border-warn/30",
  suspended: "bg-bad-tint text-bad border-bad/20",
  cancelled: "bg-paper text-ink-3 border-line",
};

export function StatusBadge({ status }: { status: TenantStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[13px] font-medium ${TONE[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
