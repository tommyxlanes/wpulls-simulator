import {
  BASE_ODDS,
  BANDS,
  PACKS,
  TIER_ORDER,
  type Tier,
  type Pack,
} from "./packs";

export interface SimulationParams {
  /** Number of packs to simulate per pack id */
  quantities: Record<string, number>;
  /** Math.pow exponent for price skew within band. 1=uniform, 1.5=low-skew (realistic), 3=floor */
  sourcingSkew: number;
  /** GRAIL probability as a percentage (e.g. 0.01 for 1-in-10,000) */
  grailPercent: number;
  /** Buyback rate 0-1 (fraction of customers who sell back) */
  buybackRate: number;
  /** Inventory sourcing efficiency 0-1 (e.g. 0.9 = bought cards at 90% of MV) */
  sourcingEfficiency: number;
}

export interface SimulationHit {
  tier: Tier;
  price: number;
  packName: string;
  packPrice: number;
  ratio: number;
}

export interface SimulationResult {
  perPack: Record<
    string,
    {
      hits: Record<Tier, number>;
      revenue: number;
    }
  >;
  totalPacks: number;
  totalRevenue: number;
  totalMarketValue: number;
  inventoryCost: number;
  totalBuybackPaid: number;
  buybackRecovery: number;
  profit: number;
  margin: number;
  oddsUsed: Record<Tier, number>;
  topHits: SimulationHit[];
}

function buildOdds(grailPercent: number): Record<Tier, number> {
  // Base totals minus GRAIL — give the residual to BANGER so we always sum to 100
  const baseSum = Object.values(BASE_ODDS).reduce((a, b) => a + b, 0);
  const remainder = 100 - baseSum - grailPercent;
  return {
    ...BASE_ODDS,
    BANGER: BASE_ODDS.BANGER + remainder,
    GRAIL: grailPercent,
  };
}

function rollTier(odds: Record<Tier, number>): Tier {
  const r = Math.random() * 100;
  let cum = 0;
  for (const tier of TIER_ORDER) {
    cum += odds[tier] ?? 0;
    if (r <= cum) return tier;
  }
  return "COMMON";
}

function rollPrice(tier: Tier, packPrice: number, skewPower: number): number {
  const [min, max] = BANDS[tier];
  const skewed = Math.pow(Math.random(), skewPower);
  return packPrice * (min + skewed * (max - min));
}

function packExpectedValue(pack: Pack, odds: Record<Tier, number>): number {
  return TIER_ORDER.reduce((sum, tier) => {
    const [min, max] = BANDS[tier];
    const midMultiplier = (min + max) / 2;
    return sum + ((odds[tier] ?? 0) / 100) * midMultiplier * pack.price;
  }, 0);
}

function emptyHitsRecord(): Record<Tier, number> {
  return TIER_ORDER.reduce(
    (acc, tier) => {
      acc[tier] = 0;
      return acc;
    },
    {} as Record<Tier, number>,
  );
}

export function runSimulation(params: SimulationParams): SimulationResult {
  const odds = buildOdds(params.grailPercent);

  let totalRevenue = 0;
  let totalMarketValue = 0;
  let totalBuybackPaid = 0;
  let totalCardsKept = 0;
  let totalPacks = 0;

  const perPack: SimulationResult["perPack"] = {};
  const allBigHits: SimulationHit[] = [];

  for (const pack of PACKS) {
    const count = params.quantities[pack.id] ?? 0;
    totalPacks += count;

    perPack[pack.id] = {
      hits: emptyHitsRecord(),
      revenue: count * pack.price,
    };
    totalRevenue += count * pack.price;

    // Pre-compute buyback amount per pack (80% of EV)
    const packEV = packExpectedValue(pack, odds);
    const buybackPerPack = 0.8 * packEV;

    for (let i = 0; i < count; i++) {
      const tier = rollTier(odds);
      const price = rollPrice(tier, pack.price, params.sourcingSkew);

      perPack[pack.id].hits[tier]++;
      totalMarketValue += price;

      if (Math.random() < params.buybackRate) {
        totalBuybackPaid += buybackPerPack;
        // Card is returned to us; we can resell at MV with sourcing efficiency haircut
        totalCardsKept += price;
      }

      // Track hits worth ≥1.5× the pack price as "notable"
      if (price >= pack.price * 1.5) {
        allBigHits.push({
          tier,
          price,
          packName: pack.name,
          packPrice: pack.price,
          ratio: price / pack.price,
        });
      }
    }
  }

  const inventoryCost = totalMarketValue * params.sourcingEfficiency;
  const buybackRecovery = totalCardsKept * params.sourcingEfficiency;
  const profit =
    totalRevenue - inventoryCost - totalBuybackPaid + buybackRecovery;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  allBigHits.sort((a, b) => b.ratio - a.ratio);

  return {
    perPack,
    totalPacks,
    totalRevenue,
    totalMarketValue,
    inventoryCost,
    totalBuybackPaid,
    buybackRecovery,
    profit,
    margin,
    oddsUsed: odds,
    topHits: allBigHits.slice(0, 10),
  };
}
