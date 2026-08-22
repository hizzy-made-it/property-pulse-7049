/**
 * Comparable-sales similarity and confidence, per SCORING_SIGNALS_AND_ACCURACY.
 *
 * similarity = 100 − (bedΔ×10) − (bathΔ×15) − (sqftΔ%×100)
 *                  − (typeMismatch×20) − (milesOver2×5) − (monthsOver3×2)
 */

export type CompSubject = {
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  /** Miles from the subject property. */
  miles?: number;
  /** Months since the sale/listing date. */
  months?: number;
};

/** Hard matching gates — a candidate outside any of these is not a comp at all. */
export const GATES = {
  beds: 1,
  baths: 0.5,
  sqftPct: 0.2,
  months: 6,
  miles: 2,
} as const;

export function passesGates(subject: CompSubject, cand: CompSubject): boolean {
  if (subject.type !== cand.type) return false;
  if (Math.abs(subject.beds - cand.beds) > GATES.beds) return false;
  if (Math.abs(subject.baths - cand.baths) > GATES.baths) return false;
  if (subject.sqft > 0 && Math.abs(cand.sqft - subject.sqft) / subject.sqft > GATES.sqftPct)
    return false;
  if ((cand.months ?? 0) > GATES.months) return false;
  if ((cand.miles ?? 0) > GATES.miles) return false;
  return true;
}

export function similarity(subject: CompSubject, cand: CompSubject): number {
  const bedPenalty = Math.abs(subject.beds - cand.beds) * 10;
  const bathPenalty = Math.abs(subject.baths - cand.baths) * 15;
  const sqftPenalty =
    subject.sqft > 0 ? (Math.abs(cand.sqft - subject.sqft) / subject.sqft) * 100 : 0;
  const typePenalty = subject.type === cand.type ? 0 : 20;
  const milesPenalty = Math.max(0, (cand.miles ?? 0) - 2) * 5;
  const monthsPenalty = Math.max(0, (cand.months ?? 0) - 3) * 2;
  const score =
    100 - bedPenalty - bathPenalty - sqftPenalty - typePenalty - milesPenalty - monthsPenalty;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export type Confidence = "HIGH" | "MEDIUM" | "LOW" | "NONE";

/** High: 10+ comps over 70. Medium: 5-9 over 60. Low: 1-4. None: 0. */
export function confidenceFor(similarities: number[]): Confidence {
  const n = similarities.length;
  if (n === 0) return "NONE";
  const strong = similarities.filter((s) => s > 70).length;
  const fair = similarities.filter((s) => s > 60).length;
  if (n >= 10 && strong >= 10) return "HIGH";
  if (n >= 5 && fair >= 5) return "MEDIUM";
  return "LOW";
}

/** Freshness thresholds in days, by source category, from the accuracy doc. */
export const FRESHNESS_DAYS = {
  demographics: 548,
  mls: 60,
  crime: 183,
  schools: 548,
  economic: 183,
} as const;
