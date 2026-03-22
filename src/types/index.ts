// src/types/index.ts

export type PartnerTier = "silver" | "gold" | "platinum";

export interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  partner_type: "sign_shop" | "event_company" | "interior_designer" | "agency" | "other";
  tier: PartnerTier;
  discount_pct: number;        // e.g. 20
  portal_slug: string;         // e.g. "signarama-greenville" → /portal/signarama-greenville
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export type SignType = "logo_image" | "text_only";
export type Material = "led_flex_neon" | "led_flex_neon_uv" | "channel_letter";
export type InstallationType = "indoors" | "outdoors";
export type BackColor = "transparent" | "black" | "other";
export type BackShape =
  | "cut_to_shape"
  | "cut_to_circle"
  | "cut_to_square_rect"
  | "cut_to_lettering";

export type QuoteStatus =
  | "draft"
  | "submitted"
  | "awaiting_mockup"
  | "mockup_review"
  | "management_review"
  | "approved"
  | "sent_to_client"
  | "completed"
  | "cancelled";

export interface QuoteRequest {
  id: string;
  quote_number: string;          // e.g. QT-NSD500058
  partner_id: string;
  partner_tag: "sign_partner";   // always set for portal submissions

  // Sign specs (mirrors quote.neonsignsdepot.com fields)
  sign_type: SignType;
  material: Material;
  installation_type: InstallationType;
  width_inches?: number;
  height_inches?: number;
  back_color: BackColor;
  back_color_other?: string;
  back_shape: BackShape;
  sign_colors: string;           // free text / Pantone codes
  quantity: number;
  additional_notes?: string;

  // Files
  design_files: DesignFile[];

  // End-client info (white-labelled, not sent to client)
  client_name?: string;
  client_email?: string;

  // Pricing
  list_price?: number;
  partner_price?: number;        // list_price * (1 - discount_pct/100)
  discount_pct: number;

  status: QuoteStatus;
  submitted_at: string;
  updated_at: string;
}

export interface DesignFile {
  id: string;
  quote_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface NSDWebhookPayload {
  source: "partner_portal";
  partner_tag: "sign_partner";
  partner_id: string;
  partner_company: string;
  partner_tier: PartnerTier;
  discount_pct: number;
  quote: Omit<QuoteRequest, "id" | "quote_number" | "partner_tag">;
}
