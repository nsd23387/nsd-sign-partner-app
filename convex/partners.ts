// convex/partners.ts
// Add this file to your existing nsd-custom-quotes/convex/ folder.
// It adds partner auth + CRUD without touching any existing functions.

import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// ── Auth ──────────────────────────────────────────────────────────────────────

// Simple session token stored in localStorage on the partner frontend.
// For production, migrate to Convex Auth (convex-auth package).
export const signIn = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const partner = await ctx.runQuery(internal.partners.getByEmail, { email });
    if (!partner || !partner.is_active) {
      return { success: false, error: "Invalid email or password" };
    }

    // In production use bcrypt. For now compare plain token.
    // Replace with: const valid = await bcrypt.compare(password, partner.auth_token);
    const valid = partner.auth_token === password;
    if (!valid) {
      return { success: false, error: "Invalid email or password" };
    }

    // Return a session token (partner _id encoded, short-lived in production)
    return {
      success: true,
      session_token: partner._id,   // swap for JWT in production
      partner: {
        id:           partner._id,
        company_name: partner.company_name,
        contact_name: partner.contact_name,
        email:        partner.email,
        tier:         partner.tier,
        discount_pct: partner.discount_pct,
        partner_type: partner.partner_type,
        portal_slug:  partner.portal_slug,
      },
    };
  },
});

// ── Queries ───────────────────────────────────────────────────────────────────

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return ctx.db
      .query("partners")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("partners") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("partners").order("desc").collect();
  },
});

// ── Partner quotes — reads from the SHARED quotes table ──────────────────────

export const getPartnerQuotes = query({
  args: { partner_id: v.id("partners") },
  handler: async (ctx, { partner_id }) => {
    // Partner quotes are stored in the main quotes table.
    // They are identified by campaign_info.campaign_param === partner_id
    // AND quote_type === "sign_partner"
    const all = await ctx.db
      .query("quotes")
      .filter((q) =>
        q.and(
          q.eq(q.field("quote_type"), "sign_partner"),
          q.eq(q.field("campaign_info.campaign_param"), partner_id)
        )
      )
      .order("desc")
      .collect();

    return all;
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    company_name:  v.string(),
    contact_name:  v.string(),
    email:         v.string(),
    phone:         v.optional(v.string()),
    partner_type:  v.union(
      v.literal("sign_shop"), v.literal("event_company"),
      v.literal("interior_designer"), v.literal("agency"), v.literal("other")
    ),
    auth_token:    v.string(),
    portal_slug:   v.string(),
    tier:          v.union(v.literal("silver"), v.literal("gold"), v.literal("platinum")),
    discount_pct:  v.float64(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("partners")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) throw new Error("A partner with this email already exists");

    return ctx.db.insert("partners", {
      ...args,
      is_active:  true,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id:            v.id("partners"),
    company_name:  v.optional(v.string()),
    contact_name:  v.optional(v.string()),
    phone:         v.optional(v.string()),
    partner_type:  v.optional(v.union(
      v.literal("sign_shop"), v.literal("event_company"),
      v.literal("interior_designer"), v.literal("agency"), v.literal("other")
    )),
    tier:          v.optional(v.union(v.literal("silver"), v.literal("gold"), v.literal("platinum"))),
    discount_pct:  v.optional(v.float64()),
    is_active:     v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updated_at: Date.now() });
  },
});

// ── Auto tier promotion ───────────────────────────────────────────────────────
// Call this from your existing quote completion mutation in quotes.ts
// when quote_type === "sign_partner"

export const checkAndPromoteTier = mutation({
  args: { partner_id: v.id("partners") },
  handler: async (ctx, { partner_id }) => {
    const completedCount = await ctx.db
      .query("quotes")
      .filter((q) =>
        q.and(
          q.eq(q.field("quote_type"), "sign_partner"),
          q.eq(q.field("campaign_info.campaign_param"), partner_id),
          q.eq(q.field("quote_activity"), "delivered")  // match your existing delivered status
        )
      )
      .collect()
      .then((r) => r.length);

    const partner = await ctx.db.get(partner_id);
    if (!partner) return;

    let newTier = partner.tier;
    let newDiscount = partner.discount_pct;

    if (completedCount >= 30 && partner.tier !== "platinum") {
      newTier = "platinum"; newDiscount = 30;
    } else if (completedCount >= 14 && partner.tier === "silver") {
      newTier = "gold"; newDiscount = 25;
    }

    if (newTier !== partner.tier) {
      await ctx.db.patch(partner_id, {
        tier: newTier, discount_pct: newDiscount, updated_at: Date.now(),
      });
    }
  },
});
