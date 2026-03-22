// supabase/functions/notify-partner-status/index.ts
// Deploy: supabase functions deploy notify-partner-status
// Trigger: Database webhook on quotes table on UPDATE where status changes
//
// Set up in Supabase Dashboard > Database > Webhooks:
//   Table: quotes | Event: UPDATE | URL: this function's URL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!; // or swap for SendGrid, Postmark, etc.
const FROM_EMAIL     = "quotes@neonsignsdepot.com";

const STATUS_MESSAGES: Record<string, { subject: string; body: (company: string, quoteNum: string) => string }> = {
  awaiting_mockup: {
    subject: "Your quote is with our design team",
    body: (c, q) => `Hi ${c},\n\nGreat news — quote ${q} has been received and is now with our design team. We'll have your mockups ready shortly.\n\nNeon Signs Depot Partner Team`,
  },
  mockup_review: {
    subject: "Mockups are ready for review",
    body: (c, q) => `Hi ${c},\n\nYour mockups for quote ${q} are ready! Log in to your partner portal to review them.\n\npartners.neonsignsdepot.com\n\nNeon Signs Depot Partner Team`,
  },
  approved: {
    subject: "Your quote has been approved",
    body: (c, q) => `Hi ${c},\n\nQuote ${q} has been approved and will be sent to your client shortly.\n\nNeon Signs Depot Partner Team`,
  },
  completed: {
    subject: "Order complete — your sign has shipped",
    body: (c, q) => `Hi ${c},\n\nOrder ${q} is complete and has shipped. Thank you for your continued partnership!\n\nNeon Signs Depot Partner Team`,
  },
};

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { record, old_record } = await req.json();

  // Only fire when status actually changed
  if (record.status === old_record?.status) {
    return new Response("No status change", { status: 200 });
  }

  const msg = STATUS_MESSAGES[record.status];
  if (!msg) return new Response("No notification for this status", { status: 200 });

  // Get partner email
  const { data: partner } = await supabase
    .from("partners")
    .select("email, company_name")
    .eq("id", record.partner_id)
    .single();

  if (!partner) return new Response("Partner not found", { status: 404 });

  // Send via Resend (swap for your email provider)
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      [partner.email],
      subject: msg.subject,
      text:    msg.body(partner.company_name, record.quote_number),
    }),
  });

  console.log(`Notified ${partner.email} — ${record.status}`);
  return new Response("OK", { status: 200 });
});
