// src/pages/admin/AdminQuotesPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminQuotes } from "hooks/useAdmin";
import { StatusPill } from "components/quotes/StatusPill";
import { QuoteStatus } from "types";
import { cn } from "lib/utils";

const FILTERS: { label: string; status?: QuoteStatus }[] = [
  { label: "All" },
  { label: "Submitted",      status: "submitted" },
  { label: "Awaiting mockup",status: "awaiting_mockup" },
  { label: "Mockup review",  status: "mockup_review" },
  { label: "Mgmt review",    status: "management_review" },
  { label: "Approved",       status: "approved" },
  { label: "Completed",      status: "completed" },
];

const TIER_BADGE: Record<string, string> = {
  silver:   "bg-gray-100 text-gray-500",
  gold:     "bg-amber-50 text-amber-600",
  platinum: "bg-cyan-50 text-cyan-600",
};

export function AdminQuotesPage() {
  const [filterIdx, setFilterIdx] = useState(0);
  const { quotes, loading } = useAdminQuotes(FILTERS[filterIdx].status);
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f, i) => (
          <button
            key={i}
            onClick={() => setFilterIdx(i)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all",
              filterIdx === i
                ? "bg-nsd-purple text-white border-nsd-purple"
                : "bg-white text-gray-500 border-gray-200 hover:border-nsd-purple/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Quote #", "Partner", "Tier", "Sign type / Material", "Size", "Submitted", "Status", "Price", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                    No quotes in this category.
                  </td>
                </tr>
              )}
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-display font-semibold text-[12px] text-nsd-purple whitespace-nowrap">
                    {q.quote_number}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-[12px] max-w-[130px] truncate">
                    {q.partner_company}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", TIER_BADGE[q.partner_tier])}>
                      {q.partner_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate capitalize">
                    {q.sign_type.replace(/_/g, " ")} · {q.material.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[12px] whitespace-nowrap">
                    {q.width_inches && q.height_inches ? `${q.width_inches}"×${q.height_inches}"` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[11px] whitespace-nowrap">
                    {new Date(q.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={q.status} />
                  </td>
                  <td className="px-4 py-3 font-display font-semibold text-gray-900 whitespace-nowrap">
                    {q.partner_price != null ? `$${q.partner_price.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/admin/quotes/${q.id}`)}
                      className="text-[11px] text-gray-400 hover:text-nsd-purple border border-gray-200 hover:border-nsd-purple/30 px-3 py-1 rounded-lg transition-all whitespace-nowrap"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
