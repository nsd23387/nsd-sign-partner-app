// convex/partnerQuotes.ts
// Add this file to your existing nsd-custom-quotes/convex/ folder.
//
// This mutation writes a partner quote into the SAME quotes table
// as all other quotes. The only difference is:
//   quote_type = "sign_partner"
//   campaign_info.campaign_param = partner._id
//
// All existing automations (Trello, email, pricing, mockups) fire identically.

import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Partner quote submission — mirrors your existing quote creation mutation
// but pre-populates partner metadata and applies the discount.
export const submitPartnerQuote = mutation({
  args: {
    partner_id:   v.id("partners"),
    partner_company: v.string(),
    partner_tier: v.string(),
    discount_pct: v.float64(),

    // Sign specs — same shape as project_info.projectDetails in your schema
    projectDetails: v.object({
      signType:            v.string(),
      neonMaterial:        v.string(),
      installation:        v.string(),
      backColor:           v.string(),
      backShape:           v.string(),
      signColors:          v.array(v.string()),
      maxSize:             v.string(),
      width:               v.optional(v.string()),
      length:              v.optional(v.string()),
      fontChoice:          v.string(),
      signText:            v.string(),
      hasImage:            v.boolean(),
      quantity:            v.float64(),
      useType:             v.string(),
      additionalNotes:     v.optional(v.string()),
      rgbLighting:         v.optional(v.boolean()),
      rushOrder:           v.optional(v.boolean()),
      waterproofing:       v.optional(v.boolean()),
      multiColorDescription: v.optional(v.string()),
    }),

    // End-client info (white-labelled — shown to NSD internally but
    // not exposed to the end customer in any automated emails)
    clientInfo: v.object({
      firstName:   v.string(),
      lastName:    v.string(),
      email:       v.string(),
      phone:       v.optional(v.string()),
      companyName: v.optional(v.string()),
      // Address defaults — required by schema, fill with partner address if unknown
      street1:  v.string(),
      street2:  v.optional(v.string()),
      city:     v.string(),
      state:    v.string(),
      zip:      v.string(),
      country:  v.string(),
    }),

    // Pre-calculated price from the pricing engine (cents)
    list_price_cents:    v.float64(),
    partner_price_cents: v.float64(),
  },

  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate quote number using same format as existing system
    // Your existing system uses: YY + 8 alphanumeric — replicate here
    const year = new Date().getFullYear().toString().slice(-2);
    const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
    const quote_number = `${year}${rand}`;

    const quoteId = await ctx.db.insert("quotes", {
      // ── Core identity ──────────────────────────────────────────────
      quote_number,
      quote_type:    "sign_partner",   // ← key differentiator
      quote_active:  true,
      quote_activity: "new",           // matches your existing initial status
      public_token:  crypto.randomUUID(),
      full_name:     `${args.clientInfo.firstName} ${args.clientInfo.lastName}`,
      updated_at:    now,

      // ── Partner metadata via campaign_info ─────────────────────────
      // Reuses existing campaign_info field — no schema change needed
      campaign_info: {
        campaign_type:  "partner",
        campaign_name:  args.partner_company,
        campaign_param: args.partner_id,   // partner's Convex _id
        is_free:        false,
        created_at:     now,
      },

      // ── Sign specs ─────────────────────────────────────────────────
      project_info: {
        customerInfo: {
          firstName:   args.clientInfo.firstName,
          lastName:    args.clientInfo.lastName,
          email:       args.clientInfo.email,
          phone:       args.clientInfo.phone ?? "",
          companyName: args.clientInfo.companyName,
          street1:     args.clientInfo.street1,
          street2:     args.clientInfo.street2,
          city:        args.clientInfo.city,
          state:       args.clientInfo.state,
          zip:         args.clientInfo.zip,
          country:     args.clientInfo.country,
        },
        projectDetails: {
          ...args.projectDetails,
          useType: "Business",
          additionalNotes: args.projectDetails.additionalNotes,
          manualPriceCents:         args.partner_price_cents,
          manualOverridePriceCents: args.list_price_cents,
        },
      },

      // Address mirrors customerInfo
      address_info: {
        street1: args.clientInfo.street1,
        street2: args.clientInfo.street2,
        city:    args.clientInfo.city,
        state:   args.clientInfo.state,
        zip:     args.clientInfo.zip,
        country: args.clientInfo.country,
      },

      // ── Pricing ────────────────────────────────────────────────────
      total_price_cents: args.partner_price_cents,
      quote_result: {
        price:     args.partner_price_cents / 100,
        timeframe: "3-4 weeks",
        type:      "manual",
        manualOverride: true,
        breakdown: {
          basePrice:              args.list_price_cents / 100,
          subtotal:               args.list_price_cents / 100,
          total:                  args.partner_price_cents / 100,
          addOnFees:              0,
          complexityScore:        0,
          complexityTier:         "standard",
          markupMultiplier:       1,
          neonMaterialMultiplier: 1,
          quantity:               args.projectDetails.quantity,
          sizeTier:               "standard",
        },
      },

      // ── Scene render defaults (required by schema) ─────────────────
      sceneRender: {
        createdAt: now,
        enabled:   false,
        status:    "pending",
        version:   1,
      },
    });

    return { quoteId, quote_number };
  },
});

// Upload design files for a partner quote
// Uses your existing Convex file storage
export const addDesignFiles = mutation({
  args: {
    quote_id: v.id("quotes"),
    files: v.array(v.object({
      fileId: v.optional(v.id("_storage")),
      name:   v.string(),
      url:    v.string(),
    })),
  },
  handler: async (ctx, { quote_id, files }) => {
    const quote = await ctx.db.get(quote_id);
    if (!quote) throw new Error("Quote not found");

    const existing = quote.quote_design ?? [];
    await ctx.db.patch(quote_id, {
      quote_design: [...existing, ...files],
      updated_at:   Date.now(),
    });
  },
});
