# W-Pulls Pack Simulator

Standalone Next.js app for simulating V3 flat-odds pack economics. Pure
client-side Monte Carlo — no database, no auth, no external dependencies
beyond Next.js + React.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS 4
- lucide-react (icons only)

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Build for production

```bash
pnpm build
pnpm start
```

For static hosting (e.g., Vercel, Cloudflare Pages), the app exports
fully client-side — no API routes — so it works on any static host.

## What it does

Simulates outcomes for the V3 pack ladder ($25 → $500) with flat odds
across every pack:

| Tier | Probability | Band |
|------|-------------|------|
| Common (H1) | 40.5% | 0.5×–0.75× pack |
| Uncommon (H2) | 30.5% | 0.75×–1.0× pack |
| Rare (H3) | 25.3% | 1.0×–2.0× pack |
| Ultra Rare (H4) | 3.0% | 2.0×–4.0× pack |
| Banger (H5) | 0.6% (variable) | 4.0×–7.0× pack |
| Grail (H6) | 0.01% (configurable) | 7.0×–10.0× pack |

When GRAIL probability changes, the residual moves to BANGER to keep
the total at 100%.

### Inputs

- **Pack quantities** — how many of each pack tier to simulate
- **Sourcing skew** — `Math.pow(rand, n)` exponent for price distribution
  within each band. 1.0 = uniform, 1.5 = matches your seed (low-skewed),
  3.0 = floor sourcing.
- **GRAIL probability** — pick from preset rates (1-in-1k through 1-in-20k)
- **Buyback rate** — % of customers who sell their card back at 80% of EV.
  Buyback cards are valued for resale at sourcing-efficiency × MV.
- **Sourcing efficiency** — fraction of card market value you actually pay
  for inventory. V3 assumes 90%.

### Outputs

- **Metric cards** — revenue, inventory cost, profit, margin
- **Tier hits table** — actual vs expected counts per pack/tier. Numbers
  in red mean >30% deviation from expected (typical for low-probability
  tiers with binomial variance).
- **Top pulls** — biggest individual hits, with multiplier of pack price.

### Math

```
revenue            = sum(pack_price × quantity) for all packs
market_value       = sum of all randomly-drawn card prices
inventory_cost     = market_value × sourcing_efficiency
buyback_paid       = sum(0.8 × pack_EV) for buyback customers
buyback_recovery   = retained_card_value × sourcing_efficiency

profit  = revenue − inventory_cost − buyback_paid + buyback_recovery
margin  = profit ÷ revenue × 100
```

### Caveats

- No Stripe processing fees (~3%) included.
- Doesn't model inventory constraints — in production, the picker bumps
  up if a tier is out of stock. Here every pull lands in its rolled tier.
- Sourcing-efficiency haircut applies uniformly; in reality, some tiers
  are easier to source at discount than others.

## File layout

```
wpulls-simulator/
├── app/
│   ├── layout.tsx       Root layout
│   ├── page.tsx         Simulator UI (client component)
│   └── globals.css      Tailwind 4 + custom CSS vars
├── lib/
│   ├── packs.ts         Constants: tiers, bands, packs, colors
│   └── simulation.ts    Monte Carlo logic (pure functions)
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

## Deploy

Drop into Coolify, Vercel, Netlify, or any static host. No env vars
required, no DB needed.

For Coolify at `sim.hq.team`:
- Project name: `wpulls-simulator`
- Build command: `pnpm build`
- Start command: `pnpm start`
- Port: 3000
- No env vars

## Why a separate app

Decoupled from the main W-Pulls codebase so you can:
- Iterate on simulation logic without touching production code
- Share with clients/investors without exposing the app
- Run locally for back-of-envelope projections
- Keep the main app focused on customer flows
