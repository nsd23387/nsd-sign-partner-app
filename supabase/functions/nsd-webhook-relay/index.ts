// supabase/functions/nsd-webhook-relay/index.ts
// Deploy: supabase functions deploy nsd-webhook-relay
// This receives quote submissions from the partner portal
// and relays them to your NSD quote management system,
// automatically tagging them as sign_partner quotes.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NSD_SYSTEM_URL = Deno.env.get("NSD_SYSTEM_WEBHOOK_URL")!;
const NSD_API_KEY    = Deno.env.get("NSD_SYSTEM_API_KEY") ?? "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.json();

  // Validate it's a partner portal submission
  if (payload.source !== "partner_portal" || payload.partner_tag !== "sign_partner") {
    return new Response("Invalid source", { status: 400 });
  }

  // Forward to NSD quote management system
  // Payload is identical to a normal quote submission — NSD system sees no difference
  // except for the partner_tag field which triggers the sign-partner workflow
  const res = await fetch(NSD_SYSTEM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(NSD_API_KEY ? { "Authorization": `Bearer ${NSD_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      // Core fields your NSD system expects
      sign_type:         payload.quote.sign_type,
      material:          payload.quote.material,
      installation_type: payload.quote.installation_type,
      width_inches:      payload.quote.width_inches,
      height_inches:     payload.quote.height_inches,
      back_color:        payload.quote.back_color,
      back_shape:        payload.quote.back_shape,
      sign_colors:       payload.quote.sign_colors,
      quantity:          payload.quote.quantity,
      additional_notes:  payload.quote.additional_notes,

      // Partner metadata — triggers sign-partner workflow in NSD system
      partner_tag:      "sign_partner",
      partner_id:        payload.partner_id,
      partner_company:   payload.partner_company,
      partner_tier:      payload.partner_tier,
      discount_pct:      payload.discount_pct,

      // Source tracking
      source: "partner_portal",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("NSD system error:", text);
    return new Response("Upstream error: " + text, { status: 502 });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
