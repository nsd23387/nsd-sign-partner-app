// src/pages/QuotesPage.tsx
import React, { useState } from "react";
import { FileText } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import { usePartnerQuotes } from "hooks/useQuotes";
import { QuoteCard } from "components/quotes/QuoteCard";
import { QuoteActivity } from "types";
import { cn } from "lib/utils";
import { useNavigate } from "react-router-dom";

const FILTERS: { label: string; statuses: QuoteActivity[] | null }[] = [
  { label: "All",         statuses: null },
  { label: "In progress", statuses: ["Quote Submitted", "Awaiting Deposit", "Deposit Paid",
      "Pending Management Review", "Admin Review Changes Requested",
      "Mockups In Review", "Awaiting Response", "Revisions Requested", "Revisions Adjusted"] },
  { label: "Approved",    statuses: ["Quote Approved", "Design Approved"] },
  { label: "Completed",   statuses: ["Quote Paid", "Delivered"] },
  { label: "Cancelled",   statuses: ["Not Interested"] },
];

export function QuotesPage() {
  useAuth(); // ensures auth context is loaded
  const { quotes, loading } = usePartnerQuotes();
  const [activeFilter, setActiveFilter] = useState(0);
  const navigate = useNavigate();

  const filtered = FILTERS[activeFilter].statuses
    ? quotes.filter((q) => FILTERS[activeFilter].statuses!.includes(q.quote_activity))
    : quotes;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f, i) => {
          const count = f.statuses
            ? quotes.filter((q) => f.statuses!.includes(q.quote_activity)).length
            : quotes.length;
          return (
            <button
              key={i}
              onClick={() => setActiveFilter(i)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[12px] font-medium border transition-all",
                activeFilter === i
                  ? "bg-nsd-purple text-white border-nsd-purple"
                  : "bg-white text-gray-500 border-gray-200 hover:border-nsd-purple/40"
              )}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <FileText size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">No quotes in this category</p>
          <button
            onClick={() => navigate("/quote/new")}
            className="mt-3 text-[13px] text-nsd-purple hover:underline"
          >
            Submit a new quote request →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => <QuoteCard key={q._id} quote={q} />)}
        </div>
      )}
    </div>
  );
}
