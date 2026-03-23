# NSD Sign Partner Portal

A white-labeled portal for sign companies, agencies, and event partners to submit
neon sign quote requests directly into NSD's **existing Convex quote system** —
with no duplication, no separate database, and no change to existing automations.

---

## Architecture

```
Partner Portal (this app)          NSD Custom Quotes (existing app)
┌─────────────────────────┐        ┌──────────────────────────────┐
│  React frontend          │        │  React frontend (admin)       │
│  - Login / Dashboard     │        │  - Quote management           │
│  - Quote request form    │        │  - Mockup upload              │
│  - Quote status tracker  │        │  - Pricing + approval         │
└────────────┬────────────┘        └──────────────┬───────────────┘
             │  Convex SDK                         │  Convex SDK
             └──────────────────┬──────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Convex Backend        │
                    │   (nsd-custom-quotes)    │
                    │                          │
                    │  quotes table            │
                    │  partners table (new)    │
                    │  Trello automation       │
                    │  Resend emails           │
                    │  Stripe payments         │
                    └──────────────────────────┘
```

Partner quotes land in the **same** `quotes` table as all other NSD quotes.
They are identified by `quote_type: "sign_partner"` and
`campaign_info.campaign_param: <partner_id>`.
All existing Trello, email, pricing, and mockup automations fire identically.

---

## Stack

| Layer    | Tech                                       |
|----------|--------------------------------------------|
| Frontend | React 18 + TypeScript + Tailwind CSS       |
| Backend  | Convex (shared with nsd-custom-quotes)     |
| Auth     | Convex partners table + localStorage token |
| Forms    | React Hook Form + Zod                      |
| Routing  | React Router v6                            |

---

## Setup

### 1. Add to nsd-custom-quotes Convex backend

Copy these files into your `nsd-custom-quotes/convex/` folder:
- `convex/partners.ts` — partner auth, CRUD, reactive quote query
- `convex/partnerQuotes.ts` — quote submission mutation

Add the `partners` table to `nsd-custom-quotes/convex/schema.ts`
(see `convex/schema_partner_addition.ts` for the exact snippet to add).

Deploy the backend:
```bash
cd nsd-custom-quotes
npx convex deploy
```

### 2. Configure this app

```bash
cp .env.example .env
# Set REACT_APP_CONVEX_URL to the same URL as nsd-custom-quotes
```

Find your Convex URL: nsd-custom-quotes Convex dashboard → Settings → URL.

### 3. Install and run

```bash
npm install
npm start
```

---

## Two mutations to add to nsd-custom-quotes

The admin quote detail page calls two mutations that may not exist yet in your
existing `convex/quotes.ts`. Add these if missing:

```typescript
// In convex/quotes.ts

export const updateQuoteActivity = mutation({
  args: { id: v.id("quotes"), activity: v.string() },
  handler: async (ctx, { id, activity }) => {
    await ctx.db.patch(id, { quote_activity: activity, updated_at: Date.now() });
  },
});

export const updatePrice = mutation({
  args: {
    id: v.id("quotes"),
    list_price_cents: v.float64(),
    partner_price_cents: v.float64(),
  },
  handler: async (ctx, { id, list_price_cents, partner_price_cents }) => {
    await ctx.db.patch(id, {
      total_price_cents: partner_price_cents,
      "project_info.projectDetails.manualOverridePriceCents": list_price_cents,
      "project_info.projectDetails.manualPriceCents": partner_price_cents,
      updated_at: Date.now(),
    });
  },
});

export const getById = query({
  args: { id: v.id("quotes") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});
```

---

## Partner tiers

| Tier     | Discount | Orders to unlock |
|----------|----------|-----------------|
| Silver   | 20%      | Default         |
| Gold     | 25%      | 14 completed    |
| Platinum | 30%      | 30 completed    |

Auto-promotion is handled by `checkAndPromoteTier` in `convex/partners.ts`.
Call it from your existing quote completion flow in `nsd-custom-quotes`.

---

## Deployment

```bash
npm run build
# Deploy /build to Vercel, Netlify, or any static host
# Set REACT_APP_CONVEX_URL in host environment variables
```

Recommended URL: `partners.neonsignsdepot.com`

---

## Roadmap

- [ ] Swap localStorage auth token for Convex Auth (convex-auth package)
- [ ] Partner self-signup / onboarding flow
- [ ] Mockup approval from partner portal
- [ ] Zoho Books quote generation for sign partners on approval
- [ ] Email notifications on quote_activity changes (extend existing Resend setup)
