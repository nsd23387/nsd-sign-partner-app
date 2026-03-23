// src/components/quotes/StatusPill.tsx
import React from "react";
import { ACTIVITY_LABEL, ACTIVITY_COLOR, ACTIVITY_PROGRESS } from "types";
import { cn } from "lib/utils";

interface Props {
  status: string;
  showProgress?: boolean;
}

export function StatusPill({ status, showProgress }: Props) {
  const label    = ACTIVITY_LABEL[status]  ?? status;
  const colorCls = ACTIVITY_COLOR[status]  ?? "bg-gray-100 text-gray-500";
  const progress = ACTIVITY_PROGRESS[status] ?? 10;

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={cn("inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full", colorCls)}>
        {label}
      </span>
      {showProgress && (
        <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-nsd-purple rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Re-export for QuoteDetailPage
export { ACTIVITY_PROGRESS };
