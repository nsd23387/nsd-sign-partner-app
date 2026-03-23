// src/hooks/useQuotes.ts
// Uses Convex useQuery — reactive, real-time, no polling needed.
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "./useAuth";

export function usePartnerQuotes() {
  const { partner } = useAuth();
  // Reactive query — automatically re-renders when any quote for this partner changes
  const quotes = useQuery(
    api.partners.getPartnerQuotes,
    partner ? { partner_id: partner._id as any } : "skip"
  );
  return { quotes: quotes ?? [], loading: quotes === undefined };
}

export function usePartnerStats() {
  const { quotes, loading } = usePartnerQuotes();

  const inProgress = quotes.filter((q) =>
    ["new", "pricing", "mockup", "revision"].includes(q.quote_activity)
  );
  const completed = quotes.filter((q) => q.quote_activity === "delivered");

  const totalSavedCents = quotes.reduce((acc, q) => {
    const list = q.project_info?.projectDetails?.manualOverridePriceCents ?? 0;
    const partner = q.total_price_cents ?? 0;
    return acc + Math.max(0, list - partner);
  }, 0);

  return {
    loading,
    totalQuotes:    quotes.length,
    inProgress:     inProgress.length,
    completed:      completed.length,
    totalSavedCents,
    recent:         quotes.slice(0, 5),
  };
}
