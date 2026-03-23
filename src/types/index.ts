// src/types/index.ts
// Types aligned to the existing Convex quotes schema in nsd-custom-quotes.

export type PartnerTier = "silver" | "gold" | "platinum";
export type PartnerType = "sign_shop" | "event_company" | "interior_designer" | "agency" | "other";

export interface Partner {
  _id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  partner_type: PartnerType;
  tier: PartnerTier;
  discount_pct: number;
  portal_slug: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export type QuoteActivity =
  | "new" | "pricing" | "mockup" | "revision" | "approved"
  | "payment_pending" | "paid" | "production" | "shipped"
  | "delivered" | "cancelled";

export interface PartnerQuote {
  _id: string;
  _creationTime: number;
  quote_number: string;
  quote_type: string;
  quote_active: boolean;
  quote_activity: QuoteActivity;
  full_name: string;
  total_price_cents: number;
  updated_at: number;
  campaign_info?: {
    campaign_type: string;
    campaign_name: string;
    campaign_param: string;
    is_free: boolean;
    created_at: number;
  };
  project_info: {
    customerInfo: {
      firstName: string; lastName: string; email: string;
      phone: string; companyName?: string; city: string;
      state: string; country: string; street1: string; zip: string;
    };
    projectDetails: {
      signType: string; neonMaterial: string; installation: string;
      backColor: string; backShape: string; signColors: string[];
      maxSize: string; width?: string; length?: string;
      fontChoice: string; signText: string; hasImage: boolean;
      quantity: number; useType: string; additionalNotes?: string;
      manualPriceCents?: number; manualOverridePriceCents?: number;
    };
  };
  quote_result: {
    price?: number; timeframe: string; type: string;
    breakdown?: { basePrice: number; total: number; quantity: number };
  };
  quote_design?: { fileId?: string; name: string; url: string }[];
  admin_images?: {
    fileId: string; name: string; url: string;
    isMockup?: boolean; mockupStatus?: string; uploadedAt: number;
  }[];
  trello_card_url?: string;
}

export const ACTIVITY_LABEL: Record<string, string> = {
  new: "Submitted", pricing: "Pricing", mockup: "Mockup in progress",
  revision: "Revision", approved: "Approved", payment_pending: "Awaiting payment",
  paid: "Paid", production: "In production", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled",
};

export const ACTIVITY_PROGRESS: Record<string, number> = {
  new: 10, pricing: 20, mockup: 35, revision: 45, approved: 55,
  payment_pending: 60, paid: 70, production: 80, shipped: 90,
  delivered: 100, cancelled: 0,
};

export const ACTIVITY_COLOR: Record<string, string> = {
  new: "bg-blue-50 text-blue-600", pricing: "bg-purple-50 text-purple-600",
  mockup: "bg-amber-50 text-amber-600", revision: "bg-orange-50 text-orange-600",
  approved: "bg-green-50 text-green-700", payment_pending: "bg-yellow-50 text-yellow-600",
  paid: "bg-teal-50 text-teal-600", production: "bg-indigo-50 text-indigo-600",
  shipped: "bg-cyan-50 text-cyan-600", delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-50 text-red-500",
};

export const TIER_DISCOUNT: Record<PartnerTier, number> = {
  silver: 20, gold: 25, platinum: 30,
};
