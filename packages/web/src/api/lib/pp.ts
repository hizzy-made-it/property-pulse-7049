/**
 * PulsePoints economy — server-side source of truth.
 * Award values, tier ladder, level curve and the ledger writer all live here so
 * the web and mobile clients can never mint points on their own.
 */
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../database";
import { badges, ppEvents, ppProfiles } from "../database/schema";

export const SEASON = "2026Q3";

export type AwardKind =
  | "PROPERTY_SAVE"
  | "WATCH_ADD"
  | "ROI_SAVE"
  | "LEAD_PURCHASE"
  | "STRESS_TEST"
  | "DAILY_BRIEF"
  | "STREAK_3"
  | "STREAK_7"
  | "STREAK_30";

/** Points per award. Deliberately modest on paid actions — not pay-to-win. */
export const AWARDS: Record<AwardKind, { points: number; label: string }> = {
  PROPERTY_SAVE: { points: 10, label: "PROPERTY SAVED" },
  WATCH_ADD: { points: 10, label: "ZIP WATCHED" },
  ROI_SAVE: { points: 25, label: "SCENARIO SAVED" },
  LEAD_PURCHASE: { points: 20, label: "LEAD ACQUIRED" },
  STRESS_TEST: { points: 40, label: "STRESS TEST RUN" },
  DAILY_BRIEF: { points: 15, label: "DAILY BRIEF READ" },
  STREAK_3: { points: 25, label: "3 MARKET DAYS" },
  STREAK_7: { points: 75, label: "7 MARKET DAYS" },
  STREAK_30: { points: 300, label: "30 MARKET DAYS" },
};

/** Awards limited to one per calendar day rather than one per subject. */
const DAILY_KINDS: AwardKind[] = ["STRESS_TEST", "DAILY_BRIEF"];

export type League = "investor" | "realtor" | "contractor";

const TIER_FLOORS = [0, 500, 1500, 4000, 10000, 25000];
const CAP_LABELS = ["Micro Cap", "Small Cap", "Mid Cap", "Large Cap", "Blue Chip", "Mega Cap"];

const TIER_NAMES: Record<League, string[]> = {
  investor: ["Scout", "Analyst", "Strategist", "Portfolio Manager", "Mogul", "Tycoon"],
  realtor: ["Agent", "Dealmaker", "Closer", "Rainmaker", "Powerbroker", "Market Maker"],
  contractor: ["Apprentice", "Craftsman", "Foreman", "Builder", "Master Builder", "Titan"],
};

/** Tier chips shade up the accent ramp — bg / fg pairs straight from the tokens. */
export const TIER_CHIPS = [
  { bg: "#e7e7ea", fg: "#424244" },
  { bg: "#d6ebff", fg: "#2c455d" },
  { bg: "#b5d9fd", fg: "#1d2d3d" },
  { bg: "#749dc4", fg: "#f5f5f8" },
  { bg: "#416180", fg: "#f5f5f8" },
  { bg: "#1d2d3d", fg: "#f5f5f8" },
];

export interface TierInfo {
  key: string;
  index: number;
  name: string;
  capLabel: string;
  floor: number;
  chip: { bg: string; fg: string };
  next: { key: string; name: string; capLabel: string; floor: number; toGo: number } | null;
  progress: number;
}

export function tierFor(lifetimeXp: number, league: League = "investor"): TierInfo {
  let index = 0;
  for (let i = TIER_FLOORS.length - 1; i >= 0; i--) {
    if (lifetimeXp >= TIER_FLOORS[i]) {
      index = i;
      break;
    }
  }
  const names = TIER_NAMES[league] ?? TIER_NAMES.investor;
  const floor = TIER_FLOORS[index];
  const nextFloor = TIER_FLOORS[index + 1];
  const next =
    nextFloor === undefined
      ? null
      : {
          key: `T${index + 2}`,
          name: names[index + 1],
          capLabel: CAP_LABELS[index + 1],
          floor: nextFloor,
          toGo: nextFloor - lifetimeXp,
        };
  return {
    key: `T${index + 1}`,
    index,
    name: names[index],
    capLabel: CAP_LABELS[index],
    floor,
    chip: TIER_CHIPS[index],
    next,
    progress: next ? (lifetimeXp - floor) / (next.floor - floor) : 1,
  };
}

/** xpForLevel(n) = round(100 * n^1.5) — cumulative XP required to reach level n. */
export function xpForLevel(n: number): number {
  return Math.round(100 * Math.pow(n, 1.5));
}

export function levelFor(lifetimeXp: number): { level: number; into: number; span: number } {
  let level = 1;
  while (xpForLevel(level + 1) <= lifetimeXp) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, into: lifetimeXp - base, span: next - base };
}

export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function id(): string {
  return crypto.randomUUID();
}

export async function ensureProfile(userId: string, league: League = "investor") {
  const [existing] = await db.select().from(ppProfiles).where(eq(ppProfiles.userId, userId));
  if (existing) return existing;
  await db.insert(ppProfiles).values({ userId, league }).onConflictDoNothing();
  const [created] = await db.select().from(ppProfiles).where(eq(ppProfiles.userId, userId));
  return created;
}

export interface AwardResult {
  awarded: boolean;
  points: number;
  label: string;
  kind: AwardKind;
  /** Streak bonuses that fired alongside the primary award. */
  bonuses: { kind: AwardKind; points: number; label: string }[];
  lifetimeXp: number;
  seasonXp: number;
  streak: number;
}

/**
 * Writes one award to the ledger. The unique index on (userId, kind, subjectId)
 * makes once-per-subject awards idempotent; daily kinds pass the day as subject.
 */
export async function award(
  userId: string,
  kind: AwardKind,
  subjectId?: string | null,
): Promise<AwardResult> {
  const profile = await ensureProfile(userId);
  const def = AWARDS[kind];
  const subject = DAILY_KINDS.includes(kind) ? dayKey() : (subjectId ?? null);

  const inserted = await db
    .insert(ppEvents)
    .values({
      id: id(),
      userId,
      kind,
      points: def.points,
      label: def.label,
      subjectId: subject,
      season: SEASON,
    })
    .onConflictDoNothing()
    .returning();

  const bonuses: AwardResult["bonuses"] = [];
  if (inserted.length === 0) {
    return {
      awarded: false,
      points: 0,
      label: def.label,
      kind,
      bonuses,
      lifetimeXp: profile.lifetimeXp,
      seasonXp: profile.seasonXp,
      streak: profile.streak,
    };
  }

  // Streak: any awarded action counts as activity for the day.
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  let streak = profile.streak;
  if (profile.lastActiveDay !== today) {
    streak = profile.lastActiveDay === yesterday ? profile.streak + 1 : 1;
  }

  let total = def.points;
  for (const [milestone, bonusKind] of [
    [3, "STREAK_3"],
    [7, "STREAK_7"],
    [30, "STREAK_30"],
  ] as const) {
    if (streak === milestone && profile.lastActiveDay !== today) {
      const bonus = AWARDS[bonusKind];
      const rows = await db
        .insert(ppEvents)
        .values({
          id: id(),
          userId,
          kind: bonusKind,
          points: bonus.points,
          label: bonus.label,
          subjectId: `${SEASON}:${milestone}`,
          season: SEASON,
        })
        .onConflictDoNothing()
        .returning();
      if (rows.length) {
        total += bonus.points;
        bonuses.push({ kind: bonusKind, points: bonus.points, label: bonus.label });
      }
    }
  }

  const lifetimeXp = profile.lifetimeXp + total;
  const seasonXp = profile.seasonXp + total;
  await db
    .update(ppProfiles)
    .set({ lifetimeXp, seasonXp, streak, lastActiveDay: today })
    .where(eq(ppProfiles.userId, userId));

  await grantBadges(userId, kind, lifetimeXp);

  return { awarded: true, points: total, label: def.label, kind, bonuses, lifetimeXp, seasonXp, streak };
}

const BADGE_RULES: { key: string; label: string; test: (ctx: BadgeCtx) => boolean }[] = [
  { key: "FIRST_TRADE", label: "FIRST TRADE", test: (c) => c.kind === "PROPERTY_SAVE" },
  { key: "ANALYST", label: "ANALYST", test: (c) => c.kind === "ROI_SAVE" },
  { key: "RISK_DESK", label: "RISK DESK", test: (c) => c.kind === "STRESS_TEST" },
  { key: "MARKET_WATCH", label: "MARKET WATCH", test: (c) => c.kind === "WATCH_ADD" },
  { key: "SMALL_CAP", label: "SMALL CAP", test: (c) => c.lifetimeXp >= 500 },
  { key: "MID_CAP", label: "MID CAP", test: (c) => c.lifetimeXp >= 1500 },
];

interface BadgeCtx {
  kind: AwardKind;
  lifetimeXp: number;
}

async function grantBadges(userId: string, kind: AwardKind, lifetimeXp: number) {
  const ctx: BadgeCtx = { kind, lifetimeXp };
  const earned = BADGE_RULES.filter((r) => r.test(ctx));
  if (!earned.length) return;
  await db
    .insert(badges)
    .values(earned.map((b) => ({ id: id(), userId, key: b.key, label: b.label })))
    .onConflictDoNothing();
}

/** 30-day PP history for the "Your Position" sparkline. */
export async function sparkline(userId: string): Promise<number[]> {
  const since = new Date(Date.now() - 29 * 86_400_000);
  since.setHours(0, 0, 0, 0);
  const rows = await db
    .select({
      day: sql<string>`strftime('%Y-%m-%d', ${ppEvents.createdAt} / 1000, 'unixepoch')`,
      points: sql<number>`sum(${ppEvents.points})`,
    })
    .from(ppEvents)
    .where(and(eq(ppEvents.userId, userId), gte(ppEvents.createdAt, since)))
    .groupBy(sql`1`);

  const byDay = new Map(rows.map((r) => [r.day, Number(r.points)]));
  const series: number[] = [];
  let running = 0;
  for (let i = 29; i >= 0; i--) {
    running += byDay.get(dayKey(new Date(Date.now() - i * 86_400_000))) ?? 0;
    series.push(running);
  }
  return series;
}

export async function xpToday(userId: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${ppEvents.points}), 0)` })
    .from(ppEvents)
    .where(and(eq(ppEvents.userId, userId), gte(ppEvents.createdAt, start)));
  return Number(row?.total ?? 0);
}
