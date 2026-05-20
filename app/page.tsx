"use client";

import { useMemo, useState } from "react";
import { Loader2, Dices, Sparkles, ArrowLeftRight } from "lucide-react";
import {
  PACKS,
  TIER_ORDER,
  TIER_LABELS,
  TIER_COLORS,
  TIER_HIT_LABEL,
  BANDS,
  type Tier,
} from "@/lib/packs";
import { runSimulation, type SimulationResult } from "@/lib/simulation";

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${Math.round(n).toLocaleString()}`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function skewLabel(v: number): string {
  if (v <= 0.8) return "Midpoint";
  if (v <= 1.2) return "Slight low-skew";
  if (v <= 1.8) return "Low-skew (realistic)";
  if (v <= 2.5) return "Heavy low-skew";
  return "Floor sourcing";
}

const DEFAULT_QUANTITIES: Record<string, number> = {
  silver: 350,
  gold: 250,
  platinum: 200,
  diamond: 130,
  "black-label": 70,
};

export default function SimulatorPage() {
  const [quantities, setQuantities] =
    useState<Record<string, number>>(DEFAULT_QUANTITIES);
  const [sourcingSkew, setSourcingSkew] = useState(1.5);
  const [grailPercent, setGrailPercent] = useState(0.01);
  const [buybackRate, setBuybackRate] = useState(0);
  const [sourcingEfficiency, setSourcingEfficiency] = useState(0.9);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const expectedHits = useMemo(() => {
    if (!result) return null;
    const exp: Record<string, Record<Tier, number>> = {};
    for (const pack of PACKS) {
      exp[pack.id] = {} as Record<Tier, number>;
      for (const tier of TIER_ORDER) {
        exp[pack.id][tier] =
          (quantities[pack.id] ?? 0) * ((result.oddsUsed[tier] ?? 0) / 100);
      }
    }
    return exp;
  }, [result, quantities]);

  function handleRun() {
    setRunning(true);
    // Yield to UI so the button can flicker, then run
    setTimeout(() => {
      const r = runSimulation({
        quantities,
        sourcingSkew,
        grailPercent,
        buybackRate,
        sourcingEfficiency,
      });
      setResult(r);
      setRunning(false);
    }, 20);
  }

  function handleReset() {
    setQuantities(DEFAULT_QUANTITIES);
    setSourcingSkew(1.5);
    setGrailPercent(0.01);
    setBuybackRate(0);
    setSourcingEfficiency(0.9);
    setResult(null);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-baseline gap-3 mb-2">
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--color-cyan)" }}
          >
            W-PULLS
          </h1>
          <span className="text-sm uppercase tracking-widest text-slate-200 font-mono">
            Pack Simulator
          </span>
        </div>
      </header>

      {/* Inputs panel */}
      <section className="rounded-xl border border-cyan-500/20 bg-slate-950/40 backdrop-blur p-5 mb-6 space-y-6">
        {/* Pack quantities */}
        <div>
          <label className="text-xs uppercase tracking-widest text-cyan-400/60 font-mono mb-3 block">
            Packs to simulate
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PACKS.map((pack) => (
              <div key={pack.id}>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                  {pack.name}
                  <span className="text-cyan-400/60 ml-1">${pack.price}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={quantities[pack.id] ?? 0}
                  onChange={(e) =>
                    setQuantities({
                      ...quantities,
                      [pack.id]: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Controls row */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Sourcing skew */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs uppercase tracking-widest text-cyan-400/60 font-mono">
                Sourcing skew
              </label>
              <span className="text-xs text-slate-200">
                {skewLabel(sourcingSkew)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={sourcingSkew}
              onChange={(e) => setSourcingSkew(parseFloat(e.target.value))}
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>midpoint</span>
              <span>floor</span>
            </div>
          </div>

          {/* GRAIL probability */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs uppercase tracking-widest text-cyan-400/60 font-mono">
                GRAIL probability
              </label>
              <span className="text-xs text-slate-200 font-mono">
                1 in{" "}
                {grailPercent > 0
                  ? Math.round(100 / grailPercent).toLocaleString()
                  : "—"}
              </span>
            </div>
            <select
              value={grailPercent}
              onChange={(e) => setGrailPercent(parseFloat(e.target.value))}
            >
              <option value="0.1">0.1% — 1 in 1,000</option>
              <option value="0.05">0.05% — 1 in 2,000</option>
              <option value="0.01">0.01% — 1 in 10,000</option>
              <option value="0.005">0.005% — 1 in 20,000</option>
            </select>
          </div>

          {/* Buyback rate */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs uppercase tracking-widest text-cyan-400/60 font-mono">
                Buyback rate
              </label>
              <span className="text-xs text-slate-200 font-mono">
                {(buybackRate * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={buybackRate}
              onChange={(e) => setBuybackRate(parseFloat(e.target.value))}
            />
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              {(buybackRate * 100).toFixed(0)}% of customers sell back at 80% EV
            </div>
          </div>

          {/* Sourcing efficiency */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs uppercase tracking-widest text-cyan-400/60 font-mono">
                Sourcing efficiency
              </label>
              <span className="text-xs text-slate-200 font-mono">
                {(sourcingEfficiency * 100).toFixed(0)}% of market value
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1"
              step="0.05"
              value={sourcingEfficiency}
              onChange={(e) =>
                setSourcingEfficiency(parseFloat(e.target.value))
              }
            />
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              How much you pay for inventory vs retail value
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRun}
            disabled={running}
            className="cursor-pointer flex-1 py-3 px-4 rounded-lg font-mono text-sm uppercase tracking-widest font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,255,255,0.15), rgba(0,255,255,0.05))",
              border: "1px solid rgba(0,255,255,0.4)",
              color: "var(--color-cyan)",
              boxShadow: running ? "none" : "0 0 20px rgba(0,255,255,0.1)",
              textShadow: "0 0 6px rgba(0,255,255,0.4)",
            }}
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rolling…
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4" />
                Simulate
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="cursor-pointer px-4 py-3 rounded-lg font-mono text-xs uppercase tracking-widest text-slate-200 hover:text-slate-200 hover:bg-slate-800/40 transition-colors border border-slate-700/50"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Results */}
      {result && (
        <>
          {/* Metric cards */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <MetricCard
              label="Packs sold"
              value={result.totalPacks.toLocaleString()}
            />
            <MetricCard label="Revenue" value={fmtMoney(result.totalRevenue)} />
            <MetricCard
              label="Cards (market value)"
              value={fmtMoney(result.totalMarketValue)}
            />
            <MetricCard
              label="Inventory cost"
              value={fmtMoney(result.inventoryCost)}
            />
            <MetricCard
              label="Profit"
              value={fmtMoney(result.profit)}
              accent={result.profit >= 0 ? "positive" : "negative"}
            />
            <MetricCard
              label="Margin"
              value={fmtPct(result.margin)}
              accent={result.margin >= 0 ? "positive" : "negative"}
            />
          </section>

          {/* Tier hits table */}
          <section className="rounded-xl border border-cyan-500/20 bg-slate-950/40 backdrop-blur p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest text-cyan-400/60 font-mono">
                Tier hits — actual vs expected
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">
                deviation in red = &gt;30% off expected
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyan-500/10">
                    <th className="text-left py-2 px-2 text-xs uppercase tracking-wider text-slate-500 font-medium">
                      Tier
                    </th>
                    {PACKS.map((pack) => (
                      <th
                        key={pack.id}
                        className="text-right py-2 px-2 text-xs uppercase tracking-wider text-slate-500 font-medium"
                      >
                        {pack.name}
                      </th>
                    ))}
                    <th className="text-right py-2 px-2 text-xs uppercase tracking-wider text-slate-500 font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TIER_ORDER.map((tier) => {
                    let total = 0;
                    let expectedTotal = 0;
                    return (
                      <tr key={tier} className="border-b border-slate-800/40">
                        <td className="py-2 px-2">
                          <div className={`${TIER_COLORS[tier]} font-medium`}>
                            {TIER_LABELS[tier]}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {TIER_HIT_LABEL[tier]} · {BANDS[tier][0]}×–
                            {BANDS[tier][1]}×
                          </div>
                        </td>
                        {PACKS.map((pack) => {
                          const actual = result.perPack[pack.id].hits[tier];
                          const expected = expectedHits?.[pack.id]?.[tier] ?? 0;
                          total += actual;
                          expectedTotal += expected;
                          const dev =
                            expected > 0
                              ? ((actual - expected) / expected) * 100
                              : 0;
                          const devColor =
                            Math.abs(dev) > 30 && expected > 1
                              ? "text-rose-400"
                              : "text-slate-400";
                          return (
                            <td
                              key={pack.id}
                              className="text-right py-2 px-2 font-mono"
                            >
                              <div className="text-slate-200">{actual}</div>
                              <div className={`text-[10px] ${devColor}`}>
                                exp {expected.toFixed(1)}
                              </div>
                            </td>
                          );
                        })}
                        <td className="text-right py-2 px-2 font-mono">
                          <div className="text-slate-100 font-semibold">
                            {total}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            exp {expectedTotal.toFixed(1)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top hits */}
          <section className="rounded-xl border border-cyan-500/20 bg-slate-950/40 backdrop-blur p-5">
            <h2 className="text-xs uppercase tracking-widest text-cyan-400/60 font-mono mb-4 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Top pulls this run
            </h2>
            {result.topHits.length === 0 ? (
              <div className="text-sm text-slate-500 py-4 text-center">
                No pulls 1.5× or above pack price this run.
                <div className="text-xs text-slate-400 mt-1">
                  Try rolling again or boost pack quantities.
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {result.topHits.map((hit, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-3 py-2 px-2 items-center border-b border-slate-800/30 last:border-0"
                  >
                    <div
                      className={`col-span-2 ${TIER_COLORS[hit.tier]} font-medium text-xs uppercase tracking-wider`}
                    >
                      {TIER_LABELS[hit.tier]}
                    </div>
                    <div className="col-span-4 text-sm text-slate-200">
                      {hit.packName} pack
                      <span className="text-teal-400 text-xs ml-1">
                        ${hit.packPrice}
                      </span>
                    </div>
                    <div className="col-span-3 text-right font-mono text-slate-100">
                      {fmtMoney(hit.price)}
                    </div>
                    <div className="col-span-3 text-right font-mono text-xs text-slate-500">
                      {hit.ratio.toFixed(1)}× pack
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Footnote */}
          {/* <footer className="mt-8 text-[11px] text-slate-400 font-mono">
            <p>
              Margin = (revenue − inventory cost − buyback paid + buyback
              recovery) ÷ revenue.
              <br />
              Inventory cost = market value × (1 − sourcing efficiency
              discount). Buyback recovery = cards retained × sourcing efficiency
              (resold). Stripe fees not included.
            </p>
          </footer> */}
        </>
      )}

      {!result && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Set your parameters and click <strong>Roll the packs</strong> to run.
        </div>
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "positive" | "negative";
}) {
  const valueColor =
    accent === "positive"
      ? "text-emerald-400"
      : accent === "negative"
        ? "text-rose-400"
        : "text-slate-100";
  return (
    <div className="rounded-lg border border-cyan-500/15 bg-slate-950/60 p-3">
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1">
        {label}
      </div>
      <div
        className={`text-lg md:text-xl font-semibold font-mono ${valueColor}`}
      >
        {value}
      </div>
    </div>
  );
}
