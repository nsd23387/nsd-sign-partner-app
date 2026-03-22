# NSD Sign Partner Portal

A white-labeled portal for sign companies, agencies, and event partners to submit
neon sign quote requests directly to NSD — feeding seamlessly into the existing
quote management system with automatic `sign_partner` tagging.

---

## Stack

| Layer       | Tech                                      |
|-------------|-------------------------------------------|
| Frontend    | React 18 + TypeScript + Tailwind CSS      |
| Auth & DB   | Supabase (Postgres + Auth + Storage)      |
| Forms       | React Hook Form + Zod                     |
| Routing     | React Router v6                           |
| Icons       | Lucide React                              |
| NSD bridge  | Webhook POST → existing quote system      |

---

## Local setup

```bash
# 1. Clone
git clone https://github.com/nsd23387/nsd-sign-partner-app.git
cd nsd-sign-partner-app

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env
# Fill in REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY, REACT_APP_NSD_WEBHOOK_URL

# 4. Run
npm start
```

---

## Supabase setup

1. Create a project at https://supabase.com
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
3. Go to **Storage** → create a bucket named `design-files` (set to public)
4. Copy your project URL and anon key into `.env`

### Creating a partner account manually (first partner)

```sql
-- 1. Create auth user in Supabase Dashboard > Auth > Users
-- 2. Then insert partner row:
insert into public.partners (auth_user_id, company_name, contact_name, email, partner_type, tier, discount_pct, portal_slug)
values (
  '<auth-user-uuid-from-step-1>',
  'Signarama Greenville',
  'Candace Lahr',
  'candace@signarama-greenville.com',
  'sign_shop',
  'silver',
  20,
  'signarama-greenville'
);
```

---

## NSD webhook

Every quote submitted through the portal fires a POST to `REACT_APP_NSD_WEBHOOK_URL`
with this payload shape:

```json
{
  "source": "partner_portal",
  "partner_tag": "sign_partner",
  "partner_id": "...",
  "partner_company": "Signarama Greenville",
  "partner_tier": "silver",
  "discount_pct": 20,
  "quote": {
    "sign_type": "logo_image",
    "material": "led_flex_neon",
    "installation_type": "indoors",
    "width_inches": 38,
    "height_inches": 38,
    "back_color": "black",
    "back_shape": "cut_to_circle",
    "sign_colors": "Purple (Pantone 266C)",
    "quantity": 1,
    "additional_notes": "...",
    "client_name": "Salon Luxe",
    "client_email": "...",
    ...
  }
}
```

Your existing system just needs to accept this POST and create the quote as normal —
the `partner_tag: "sign_partner"` field triggers the existing sign-partner flow
(Trello card, Zoho Books quote, separate approval path, etc.).

---

## Partner tiers

| Tier     | Discount | Unlock at      |
|----------|----------|----------------|
| Silver   | 20%      | Default        |
| Gold     | 25%      | 14 orders      |
| Platinum | 30%      | 30 orders      |

Update a partner's tier manually in Supabase, or automate via a Supabase
Edge Function that watches the `quotes` table and promotes on completion count.

---

## Deployment

```bash
npm run build
# Deploy /build to Netlify, Vercel, or any static host
# Set environment variables in your host's dashboard
```

Recommended URL structure: `partners.neonsignsdepot.com`

---

## Roadmap / next steps

- [ ] NSD Admin dashboard (manage all partner accounts + inbound quotes)
- [ ] Automated tier promotion via Supabase Edge Function
- [ ] Email notifications to partner on status changes
- [ ] Partner onboarding / self-signup flow
- [ ] Mockup preview viewer inside quote detail page
- [ ] Zoho Books integration for sign-partner quote generation
