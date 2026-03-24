// src/hooks/useQuotes.ts
// Uses Convex useQuery — reactive, real-time, no polling needed.
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "./useAuth";
import { PartnerQuote } from "../types";

export function usePartnerQuotes() {
  const { partner } = useAuth();
  // Reactive query — automatically re-renders when any quote for this partner changes
  const quotes = useQuery(
    api.partners.getPartnerQuotes,
    partner ? { partner_id: partner._id as any } : "skip"
  );
  return { quotes: (quotes ?? []) as unknown as PartnerQuote[], loading: quotes === undefined };
}

export function usePartnerStats() {
  const { quotes, loading } = usePartnerQuotes();

  const inProgress = quotes.filter((q: PartnerQuote) =>
    ["Quote Submitted", "Awaiting Deposit", "Deposit Paid", "Pending Management Review",
     "Admin Review Changes Requested", "Mockups In Review", "Awaiting Response",
     "Revisions Requested", "Revisions Adjusted"].includes(q.quote_activity)
  );
  const completed = quotes.filter((q: PartnerQuote) => q.quote_activity === "Delivered");

  const totalSavedCents = quotes.reduce((acc: number, q: PartnerQuote) => {
    const list = q.project_info?.projectDetails?.manualOverridePriceCents ?? 0;
    const partner = q.total_price_cents ?? 0;
    return acc + Math.max(0, list - partner);
  }, 0);

  return {
    loading,
    quotes,              // raw array — used by DashboardPage for totalSaved
    totalQuotes:    quotes.length,
    inProgress,          // array so callers can use .length
    completed,           // array so callers can use .length
    totalSavedCents,
    recent:         quotes.slice(0, 5),
  };
}
