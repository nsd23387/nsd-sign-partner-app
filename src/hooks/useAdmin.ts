// src/hooks/useAdmin.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "lib/supabase";
import { AdminStats, PartnerWithStats, AdminQuoteRow } from "types/admin";
import { QuoteStatus } from "types";

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [partners, quotes] = await Promise.all([
        supabase.from("partners").select("id, is_active"),
        supabase.from("quotes").select("id, status, partner_price, submitted_at"),
      ]);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const q = quotes.data ?? [];

      setStats({
        total_partners: partners.data?.length ?? 0,
        active_partners: partners.data?.filter((p) => p.is_active).length ?? 0,
        total_quotes: q.length,
        quotes_this_month: q.filter((r) => r.submitted_at >= startOfMonth).length,
        quotes_pending_review: q.filter((r) =>
          ["submitted", "awaiting_mockup", "mockup_review", "management_review"].includes(r.status)
        ).length,
        total_revenue: q.reduce((s, r) => s + (r.partner_price ?? 0), 0),
        revenue_this_month: q
          .filter((r) => r.submitted_at >= startOfMonth)
          .reduce((s, r) => s + (r.partner_price ?? 0), 0),
      });
      setLoading(false);
    }
    load();
  }, []);

  return { stats, loading };
}

export function useAdminPartners() {
  const [partners, setPartners] = useState<PartnerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partners")
      .select(`
        *,
        quotes(id, status, partner_price, submitted_at)
      `)
      .order("created_at", { ascending: false });

    const enriched: PartnerWithStats[] = (data ?? []).map((p: any) => {
      const qs: any[] = p.quotes ?? [];
      return {
        ...p,
        total_quotes: qs.length,
        completed_orders: qs.filter((q) => q.status === "completed").length,
        total_spend: qs.reduce((s: number, q: any) => s + (q.partner_price ?? 0), 0),
        last_quote_at: qs.length > 0
          ? qs.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0].submitted_at
          : undefined,
      };
    });

    setPartners(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { partners, loading, refetch: fetch };
}

export function useAdminQuotes(statusFilter?: QuoteStatus) {
  const [quotes, setQuotes] = useState<AdminQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("quotes")
      .select(`
        *,
        design_files(*),
        partners(company_name, tier, discount_pct)
      `)
      .order("submitted_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);

    const { data } = await query;

    const rows: AdminQuoteRow[] = (data ?? []).map((r: any) => ({
      ...r,
      partner_company: r.partners?.company_name ?? "—",
      partner_tier: r.partners?.tier ?? "silver",
      partner_discount_pct: r.partners?.discount_pct ?? 20,
    }));

    setQuotes(rows);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);
  return { quotes, loading, refetch: fetch };
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus, price?: number) {
  const update: any = { status, updated_at: new Date().toISOString() };
  if (price !== undefined) {
    update.list_price = price;
    // partner_price is computed by trigger; set directly here for manual override
    update.partner_price = price;
  }
  return supabase.from("quotes").update(update).eq("id", quoteId);
}

export async function updatePartnerTier(
  partnerId: string,
  tier: "silver" | "gold" | "platinum",
  discountPct: number
) {
  return supabase.from("partners").update({ tier, discount_pct: discountPct }).eq("id", partnerId);
}
