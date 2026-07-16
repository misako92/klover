# Klover

> **Work in progress** — personal portfolio project, under active development. Not yet deployed to production.

Klover is a SaaS dashboard that helps French e-commerce businesses comply with **EPR regulations** (*Responsabilité Élargie du Producteur* — Extended Producer Responsibility, from the French AGEC law). Companies selling packaged products in France must declare their packaging volumes to accredited eco-organisms (CITEO, Léko…) and pay eco-contributions — with fines up to €150k for non-compliance. Klover turns that obligation into a guided workflow:

**Import sales → Classify products → Verify → Declare → Pay the right amount.**

## Features

- **CSV sales import** with column mapping, validation and error reporting
- **Product classification** — packaging types (household/professional), materials, reusability, with rule-based heuristics and an AI-assisted classification service
- **Eco-contribution calculator** implementing the 2026 CITEO tariff schedules (household & professional streams, reusable packaging bonuses)
- **Declarations workspace** — generate, track and export declarations per eco-organism
- **Analytics dashboard** — tonnage breakdown, contribution forecasting, compliance KPIs
- **Multi-tenant organizations** — team members, roles, invitations
- **Billing** — Stripe subscriptions (Starter/Growth, monthly/annual) with plan limits and webhook-driven state
- **E-commerce integrations** (Shopify, WooCommerce) — in progress
- **Mock mode** — seeded demo data layer for the dashboard, no Stripe/Resend required (authentication still needs a free Supabase project)

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, React 19) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) + Prisma ORM, Row Level Security |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Payments | Stripe (subscriptions + signed webhooks) |
| UI | Tailwind CSS 4, shadcn/ui (Radix), Framer Motion, Recharts |
| Email | Resend |
| Monitoring | Sentry |
| Quality | Vitest, Biome (lint + format), GitHub Actions CI |

## Getting started

Prerequisites: Node.js 20+, npm.

```bash
git clone <repo-url>
cd klover
npm install
cp .env.example .env
```

```bash
npm run dev
# open http://localhost:3000
```

The marketing site runs with no external service. The dashboard requires authentication, so a (free) Supabase project is needed even in mock mode — mock mode replaces the compliance data layer with seeded demo data so Stripe/Resend are not required.

### Full setup (Supabase + Stripe)

1. Create a [Supabase](https://supabase.com) project; copy the URL, anon key and database connection strings into `.env`. Set `MOCK_MODE=false` / `NEXT_PUBLIC_MOCK_MODE=false` to use real data instead of the demo data layer.
2. Apply the schema and seed demo data:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
3. Apply the RLS policies in `supabase/policies.sql` (Supabase SQL editor).
4. Create Stripe products/prices and fill in the `STRIPE_*` variables; point a webhook at `/api/webhooks/stripe` (use `stripe listen` locally).

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run test` | Run the Vitest suite |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run check` | Biome lint + format check |
| `npm run db:seed` | Seed the database with demo data |

## Project structure

```
src/
├── app/            # App Router: (marketing) site, (main) auth, (app) dashboard
│   ├── actions/    # Server Actions (auth, products, declarations, billing…)
│   └── api/        # Route handlers (Stripe webhook)
├── components/     # UI components (shadcn/ui based)
├── features/       # Domain logic (compliance data layer, tariffs)
├── lib/            # Utilities (auth, security, stripe, prisma clients)
├── services/       # Business services (classification, contribution, export…)
└── ...
prisma/             # Schema, migrations, seed
supabase/           # RLS policies
```

## Roadmap

- [ ] Finish Shopify / WooCommerce integrations
- [ ] Transactional emails (invitations, alerts) via Resend
- [ ] Migrate remaining marketing components from `.jsx` to `.tsx`
- [ ] Upgrade Next.js to clear remaining `npm audit` advisories
- [ ] Public demo deployment on Vercel (demo account + beta banner)
- [ ] Multi eco-organism tariff profiles beyond CITEO 2026

## License

[MIT](LICENSE)
