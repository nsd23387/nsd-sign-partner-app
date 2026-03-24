// convex/schema_partner_addition.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS TABLE to your existing convex/schema.ts in nsd-custom-quotes.
// Do NOT replace your existing schema — just add the partners table alongside
// your existing quotes, team, suppliers, etc. tables.
//
// In your schema.ts, inside defineSchema({ ... }) add:
// ─────────────────────────────────────────────────────────────────────────────
//
//   partners: defineTable({
//     ...fields below...
//   }).index("by_auth_token", ["auth_token"])
//     .index("by_slug", ["portal_slug"])
//     .index("by_email", ["email"]),
//
// ─────────────────────────────────────────────────────────────────────────────

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const partnersTable = defineTable({
  // Identity
  company_name:  v.string(),
  contact_name:  v.string(),
  email:         v.string(),
  phone:         v.optional(v.string()),
  partner_type:  v.union(
    v.literal("sign_shop"),
    v.literal("event_company"),
    v.literal("interior_designer"),
    v.literal("agency"),
    v.literal("other")
  ),

  // Auth — simple hashed token for now; swap for Convex Auth when ready
  auth_token:    v.string(),   // bcrypt hash of their password
  portal_slug:   v.string(),   // e.g. "signarama-greenville"

  // Tier & pricing
  tier:          v.optional(v.string()),  // "partner" — kept optional for backwards compat
  discount_pct:  v.float64(),  // 15 (base), wholesale tiers: 25, 35, 45

  // Status
  is_active:     v.boolean(),
  created_at:    v.float64(),  // Date.now()
  updated_at:    v.float64(),
})
  .index("by_auth_token", ["auth_token"])
  .index("by_slug", ["portal_slug"])
  .index("by_email", ["email"]);

// ─────────────────────────────────────────────────────────────────────────────
// ALSO: The existing quotes table needs no schema changes.
//
// Partner quotes use these EXISTING fields:
//   quote_type:  set to "sign_partner"    ← filters partner quotes from NSD quotes
//   campaign_info.campaign_type: "partner"
//   campaign_info.campaign_name: partner company name
//   campaign_info.campaign_param: partner _id (Convex ID)
//   full_name:   partner contact name
//   project_info.customerInfo: end-client info (white-labelled)
//   project_info.projectDetails: all sign specs (unchanged)
//   total_price_cents: partner price (after discount)
//   quote_result.breakdown: full pricing with discount applied
//
// This means partner quotes flow through ALL existing automations:
//   ✓ Trello card creation
//   ✓ Email notifications
//   ✓ Admin dashboard visibility
//   ✓ Pricing engine
//   ✓ Mockup upload workflow
//   ✓ Payment processing
// ─────────────────────────────────────────────────────────────────────────────
