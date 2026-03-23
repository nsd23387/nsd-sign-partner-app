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
  | "Quote Submitted"
  | "Awaiting Response"
  | "Quote Approved"
  | "Awaiting Deposit"
  | "Deposit Paid"
  | "Pending Management Review"
  | "Admin Review Changes Requested"
  | "Mockups In Review"
  | "Revisions Requested"
  | "Revisions Adjusted"
  | "Design Approved"
  | "Quote Paid"
  | "Delivered"
  | "Not Interested";

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
    campaign_param?: string;
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
  "Quote Submitted": "Submitted",
  "Awaiting Response": "Awaiting your response",
  "Quote Approved": "Approved",
  "Awaiting Deposit": "Awaiting deposit",
  "Deposit Paid": "Deposit paid",
  "Pending Management Review": "Mockup in review",
  "Admin Review Changes Requested": "Revision in progress",
  "Mockups In Review": "Mockups ready",
  "Revisions Requested": "Revision requested",
  "Revisions Adjusted": "Revisions done",
  "Design Approved": "Design approved",
  "Quote Paid": "Paid — in production",
  "Delivered": "Delivered",
  "Not Interested": "Cancelled",
};

export const ACTIVITY_PROGRESS: Record<string, number> = {
  "Quote Submitted": 10, "Awaiting Deposit": 20, "Deposit Paid": 30,
  "Pending Management Review": 40, "Admin Review Changes Requested": 45,
  "Mockups In Review": 55, "Awaiting Response": 60,
  "Revisions Requested": 65, "Revisions Adjusted": 70,
  "Design Approved": 75, "Quote Approved": 80,
  "Quote Paid": 88, "Delivered": 100, "Not Interested": 0,
};

export const ACTIVITY_COLOR: Record<string, string> = {
  "Quote Submitted": "bg-blue-50 text-blue-600",
  "Awaiting Deposit": "bg-amber-50 text-amber-600",
  "Deposit Paid": "bg-teal-50 text-teal-600",
  "Pending Management Review": "bg-purple-50 text-purple-600",
  "Admin Review Changes Requested": "bg-orange-50 text-orange-600",
  "Mockups In Review": "bg-indigo-50 text-indigo-600",
  "Awaiting Response": "bg-yellow-50 text-yellow-700",
  "Revisions Requested": "bg-orange-50 text-orange-600",
  "Revisions Adjusted": "bg-blue-50 text-blue-600",
  "Design Approved": "bg-green-50 text-green-600",
  "Quote Approved": "bg-green-50 text-green-600",
  "Quote Paid": "bg-green-100 text-green-700",
  "Delivered": "bg-green-200 text-green-800",
  "Not Interested": "bg-red-50 text-red-500",
};

export const TIER_DISCOUNT: Record<PartnerTier, number> = {
  silver: 20, gold: 25, platinum: 30,
};
