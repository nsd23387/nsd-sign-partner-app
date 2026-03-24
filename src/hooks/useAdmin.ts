// src/hooks/useAdmin.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Partner } from "../types";
import { AdminStats } from "../types/admin";

export function useAdminPartners() {
  const partners = useQuery(api.partners.list);
  return { partners: (partners ?? []) as unknown as Partner[], loading: partners === undefined };
}

export function useUpdatePartner() {
  return useMutation(api.partners.update);
}

export function useCreatePartner() {
  return useMutation(api.partners.create);
}

// Compute admin-level stats from partners list.
// Quote-level stats (totals, revenue) require a getAllPartnerQuotes backend query —
// stub returns zeros until that query is added to convex/partners.ts.
export function useAdminStats() {
  const { partners, loading } = useAdminPartners();

  const stats: AdminStats = {
    total_partners:          partners.length,
    active_partners:         partners.filter((p: Partner) => p.is_active).length,
    total_quotes:            0,   // TODO: wire up getAllPartnerQuotes
    quotes_this_month:       0,
    quotes_pending_review:   0,
    total_revenue:           0,
    revenue_this_month:      0,
  };

  return { stats, loading };
}

// Returns all partner quotes filtered by status.
// Stubs an empty array until a cross-partner query is added to the backend.
// TODO: add convex/partners.ts → getAllPartnerQuotes and wire it here.
export function useAdminQuotes(_status?: string) {
  return { quotes: [] as any[], loading: false };
}
