// src/components/quotes/StatusPill.tsx
import React from "react";
import { QuoteStatus } from "types";
import { cn } from "lib/utils";

const STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string }> = {
  draft:             { label: "Draft",           className: "bg-gray-100 text-gray-500" },
  submitted:         { label: "Submitted",       className: "bg-blue-50 text-blue-600" },
  awaiting_mockup:   { label: "Awaiting mockup", className: "bg-purple-50 text-nsd-purple" },
  mockup_review:     { label: "Mockup review",   className: "bg-amber-50 text-amber-600" },
  management_review: { label: "Under review",    className: "bg-orange-50 text-orange-600" },
  approved:          { label: "Approved",        className: "bg-green-50 text-green-600" },
  sent_to_client:    { label: "Sent to client",  className: "bg-teal-50 text-teal-600" },
  completed:         { label: "Completed",       className: "bg-green-100 text-green-700" },
  cancelled:         { label: "Cancelled",       className: "bg-red-50 text-red-500" },
};

export const STATUS_PROGRESS: Record<QuoteStatus, number> = {
  draft: 5, submitted: 15, awaiting_mockup: 30, mockup_review: 50,
  management_review: 65, approved: 80, sent_to_client: 90, completed: 100, cancelled: 0,
};

interface Props {
  status: QuoteStatus;
  showProgress?: boolean;
}

export function StatusPill({ status, showProgress }: Props) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="inline-flex flex-col gap-1">
      <span className={cn("inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full", cfg.className)}>
        {cfg.label}
      </span>
      {showProgress && (
        <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-nsd-purple rounded-full transition-all"
            style={{ width: `${STATUS_PROGRESS[status]}%` }}
          />
        </div>
      )}
    </div>
  );
}
