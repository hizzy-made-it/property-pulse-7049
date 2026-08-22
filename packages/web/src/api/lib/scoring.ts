/**
 * The investment score — one number, 40 weighted signals, 5 categories.
 *
 * Mechanics per SCORING_SIGNALS_AND_ACCURACY:
 *  - each signal is scored through a banded curve, not linearly
 *  - a missing signal is skipped and its weight redistributes proportionally
 *    *within its own category*, so a category is always worth its published weight
 *  - data completeness is tracked, and anything under 70% is flagged PRELIMINARY
 */

import { CATEGORIES, weightedDefs, type Band, type CategoryKey } from "./signals";

export const TIERS = [
  { min: 85, label: "EXCELLENT" },
  { min: 70, label: "VERY GOOD" },
  { min: 55, label: "GOOD" },
  { min: 40, label: "FAIR" },
  { min: 0, label: "POOR" },
] as const;

export function tierFor(score: number): string {
  return TIERS.find((t) => score >= t.min)?.label ?? "POOR";
}

/** Score one raw reading through its banded curve. */
export function scoreSignal(curve: Band[], value: number): number {
  for (const [lo, hi, s0, s1] of curve) {
    if (value >= lo && value < hi) {
      const span = hi - lo;
      if (!Number.isFinite(span) || span <= 0) return clamp01to100(s0);
      const t = (value - lo) / span;
      return clamp01to100(s0 + t * (s1 - s0));
    }
  }
  const last = curve[curve.length - 1];
  return last ? clamp01to100(last[3]) : 0;
}

function clamp01to100(n: number) {
  return Math.max(0, Math.min(100, n));
}

export type Reading = { value: number; prevValue?: number | null; asOf?: string; source?: string };

export type Contribution = {
  key: string;
  label: string;
  category: CategoryKey;
  categoryLabel: string;
  core: boolean;
  unit: string;
  value: number;
  signalScore: number;
  /** Effective weight after in-category redistribution. */
  weight: number;
  /** signalScore x weight / 100 — the points this signal puts on the board. */
  weighted: number;
  /** Change in weighted points vs the previous reading. Drives "why it's moving". */
  delta: number;
  direction: "up" | "down" | "flat";
  leadMonthsLow: number;
  leadMonthsHigh: number;
  whyIgnored: string;
  providerKey: string;
};

export type ScoreResult = {
  score: number;
  tier: string;
  completenessPct: number;
  preliminary: boolean;
  presentCount: number;
  totalCount: number;
  categories: {
    key: CategoryKey;
    label: string;
    weight: number;
    /** 0-100 score for the category on its own terms. */
    score: number;
    present: number;
    total: number;
  }[];
  contributions: Contribution[];
  /** Top 5 movers by weighted delta — the WHY IT'S MOVING panel. */
  movers: Contribution[];
  /** Weighted lead-time band across the movers, in months. */
  leadBand: { low: number; high: number };
};

/**
 * Compute the score from whatever readings exist. Missing signals are skipped and
 * their weight is redistributed within their category.
 */
export function computeScore(readings: Record<string, Reading | undefined>): ScoreResult {
  const defs = weightedDefs();
  const contributions: Contribution[] = [];
  const cats = CATEGORIES.map((c) => {
    const inCat = defs.filter((d) => d.category === c.key);
    const present = inCat.filter((d) => readings[d.key] != null);
    // Redistribute inside the category: present weights are scaled up to fill it.
    const presentWeight = present.reduce((a, d) => a + d.weight, 0);
    const factor = presentWeight > 0 ? c.weight / presentWeight : 0;
    let catPoints = 0;

    for (const d of present) {
      const r = readings[d.key];
      if (!r) continue;
      const weight = d.weight * factor;
      const signalScore = scoreSignal(d.curve, r.value);
      const weighted = (signalScore * weight) / 100;
      const prev = r.prevValue == null ? null : scoreSignal(d.curve, r.prevValue);
      const delta = prev == null ? 0 : ((signalScore - prev) * weight) / 100;
      catPoints += weighted;
      contributions.push({
        key: d.key,
        label: d.label,
        category: d.category,
        categoryLabel: c.label,
        core: d.core,
        unit: d.unit,
        value: r.value,
        signalScore: round1(signalScore),
        weight: round2(weight),
        weighted: round2(weighted),
        delta: round2(delta),
        direction: delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat",
        leadMonthsLow: d.leadMonthsLow,
        leadMonthsHigh: d.leadMonthsHigh,
        whyIgnored: d.whyIgnored,
        providerKey: d.providerKey,
      });
    }

    return {
      key: c.key,
      label: c.label,
      weight: c.weight,
      score: c.weight > 0 ? round1((catPoints / c.weight) * 100) : 0,
      points: catPoints,
      present: present.length,
      total: inCat.length,
    };
  });

  const score = Math.round(cats.reduce((a, c) => a + c.points, 0));
  const totalCount = defs.length;
  const presentCount = contributions.length;
  // Completeness is weight-based, not count-based: a missing 10-weight signal
  // hurts confidence more than a missing 2-weight one.
  const presentWeightRaw = defs
    .filter((d) => readings[d.key] != null)
    .reduce((a, d) => a + d.weight, 0);
  const completenessPct = Math.round(presentWeightRaw);

  const movers = [...contributions]
    .filter((c) => Math.abs(c.delta) > 0.01)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  const moverWeight = movers.reduce((a, m) => a + Math.abs(m.delta), 0);
  const leadBand =
    movers.length && moverWeight > 0
      ? {
          low: Math.round(
            movers.reduce((a, m) => a + m.leadMonthsLow * Math.abs(m.delta), 0) / moverWeight,
          ),
          high: Math.round(
            movers.reduce((a, m) => a + m.leadMonthsHigh * Math.abs(m.delta), 0) / moverWeight,
          ),
        }
      : { low: 0, high: 0 };

  return {
    score,
    tier: tierFor(score),
    completenessPct,
    preliminary: completenessPct < 70,
    presentCount,
    totalCount,
    categories: cats.map(({ points: _points, ...c }) => c),
    contributions: contributions.sort((a, b) => b.weighted - a.weighted),
    movers,
    leadBand,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
