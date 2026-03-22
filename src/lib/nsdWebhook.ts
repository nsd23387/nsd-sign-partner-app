// src/lib/nsdWebhook.ts
// Sends a structured payload to your NSD quote management system
// so partner portal submissions are indistinguishable from normal quotes
// except for the partner_tag and partner metadata fields.

import { NSDWebhookPayload, QuoteRequest, Partner } from "types";

export async function submitQuoteToNSD(
  quote: Omit<QuoteRequest, "id" | "quote_number" | "partner_tag">,
  partner: Partner
): Promise<{ success: boolean; quote_number?: string; error?: string }> {
  const payload: NSDWebhookPayload = {
    source: "partner_portal",
    partner_tag: "sign_partner",
    partner_id: partner.id,
    partner_company: partner.company_name,
    partner_tier: partner.tier,
    discount_pct: partner.discount_pct,
    quote,
  };

  try {
    const res = await fetch(process.env.REACT_APP_NSD_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text };
    }

    const data = await res.json();
    return { success: true, quote_number: data.quote_number };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
