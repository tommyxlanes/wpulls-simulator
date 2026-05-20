export type Tier =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "ULTRA_RARE"
  | "BANGER"
  | "GRAIL";

export const TIER_ORDER: Tier[] = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "ULTRA_RARE",
  "BANGER",
  "GRAIL",
];

export const TIER_LABELS: Record<Tier, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  ULTRA_RARE: "Ultra Rare",
  BANGER: "Banger",
  GRAIL: "Grail",
};

export const TIER_HIT_LABEL: Record<Tier, string> = {
  COMMON: "H1",
  UNCOMMON: "H2",
  RARE: "H3",
  ULTRA_RARE: "H4",
  BANGER: "H5",
  GRAIL: "H6",
};

export const TIER_COLORS: Record<Tier, string> = {
  COMMON: "text-slate-400",
  UNCOMMON: "text-emerald-400",
  RARE: "text-blue-400",
  ULTRA_RARE: "text-purple-400",
  BANGER: "text-rose-400",
  GRAIL: "text-amber-400",
};

/**
 * V3 flat-odds base probabilities.
 * GRAIL is configurable at the simulation level; BANGER absorbs the remainder
 * so the total stays at 100.
 */
export const BASE_ODDS: Record<Exclude<Tier, "GRAIL">, number> = {
  COMMON: 40.5,
  UNCOMMON: 30.5,
  RARE: 25.3,
  ULTRA_RARE: 3.0,
  BANGER: 0.6,
};

/**
 * Value bands as multiplier ranges of pack price.
 * Tightened from V3 — GRAIL capped at 10× pack price.
 */
export const BANDS: Record<Tier, [number, number]> = {
  COMMON: [0.5, 0.75],
  UNCOMMON: [0.75, 1.0],
  RARE: [1.0, 2.0],
  ULTRA_RARE: [2.0, 4.0],
  BANGER: [4.0, 7.0],
  GRAIL: [7.0, 10.0],
};

export interface Pack {
  id: string;
  name: string;
  price: number;
}

export const PACKS: Pack[] = [
  { id: "silver", name: "Silver", price: 25 },
  { id: "gold", name: "Gold", price: 50 },
  { id: "platinum", name: "Platinum", price: 100 },
  { id: "diamond", name: "Diamond", price: 250 },
  { id: "black-label", name: "Black Label", price: 500 },
];
