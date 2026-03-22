// supabase/functions/auto-tier-promotion/index.ts
// Deploy: supabase functions deploy auto-tier-promotion
// Trigger: Database webhook on quotes table WHERE status = 'completed'

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TIER_THRESHOLDS = [
  { min: 30, tier: "platinum", discount_pct: 30 },
  { min: 14, tier: "gold",     discount_pct: 25 },
  { min: 0,  tier: "silver",   discount_pct: 20 },
];

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const payload = await req.json();
  const quote = payload.record;

  if (quote.status !== "completed") {
    return new Response("No-op: not a completion event", { status: 200 });
  }

  // Count completed orders for this partner
  const { count } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("partner_id", quote.partner_id)
    .eq("status", "completed");

  const completedCount = count ?? 0;

  // Determine new tier
  const { tier, discount_pct } = TIER_THRESHOLDS.find((t) => completedCount >= t.min)!;

  // Fetch current partner tier
  const { data: partner } = await supabase
    .from("partners")
    .select("tier, email, company_name")
    .eq("id", quote.partner_id)
    .single();

  if (!partner || partner.tier === tier) {
    return new Response("No tier change needed", { status: 200 });
  }

  // Update tier
  await supabase
    .from("partners")
    .update({ tier, discount_pct })
    .eq("id", quote.partner_id);

  // Send notification email via Supabase built-in or your email provider
  console.log(`Partner ${partner.company_name} promoted to ${tier} (${completedCount} orders)`);

  return new Response(
    JSON.stringify({ promoted: true, partner_id: quote.partner_id, new_tier: tier }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});
