// src/types/admin.ts

import { Partner, PartnerQuote } from "./index";

export interface AdminStats {
  total_partners: number;
  active_partners: number;
  total_quotes: number;
  quotes_this_month: number;
  quotes_pending_review: number;
  total_revenue: number;
  revenue_this_month: number;
}

export interface PartnerWithStats extends Partner {
  total_quotes: number;
  completed_orders: number;
  total_spend: number;
  last_quote_at?: string;
}

export interface AdminQuoteRow extends PartnerQuote {
  partner_company: string;
  partner_tier: string;
  partner_discount_pct: number;
}
