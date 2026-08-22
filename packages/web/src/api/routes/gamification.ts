import { z } from "zod";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "../database";
import {
  badges,
  leaderboardMembers,
  ppEvents,
  ppProfiles,
  savedProperties,
  watchedZips,
} from "../database/schema";
import { authed } from "../middleware/auth";
import {
  SEASON,
  award,
  dayKey,
  ensureProfile,
  levelFor,
  sparkline,
  tierFor,
  xpToday,
  type League,
} from "../lib/pp";

const leagues = ["investor", "realtor", "contractor"] as const;

/** The superset payload the "Your Position" panel reads on every dashboard. */
export const gamification = {
  profile: authed.handler(async ({ context }) => {
    const profile = await ensureProfile(context.user.id);
    const league = profile.league as League;
    const tier = tierFor(profile.lifetimeXp, league);
    const level = levelFor(profile.lifetimeXp);

    const [ahead] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leaderboardMembers)
      .where(
        and(
          eq(leaderboardMembers.league, league),
          eq(leaderboardMembers.season, SEASON),
          gt(leaderboardMembers.seasonPp, profile.seasonXp),
        ),
      );

    const earned = await db
      .select()
      .from(badges)
      .where(eq(badges.userId, context.user.id))
      .orderBy(desc(badges.earnedAt));

    const [savedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(savedProperties)
      .where(eq(savedProperties.userId, context.user.id));
    const [watchCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchedZips)
      .where(eq(watchedZips.userId, context.user.id));

    const recent = await db
      .select()
      .from(ppEvents)
      .where(eq(ppEvents.userId, context.user.id))
      .orderBy(desc(ppEvents.createdAt))
      .limit(8);

    const briefClaimedToday = recent.some(
      (e) => e.kind === "DAILY_BRIEF" && e.subjectId === dayKey(),
    );

    return {
      season: SEASON,
      league,
      ticker: profile.ticker,
      anonymous: profile.anonymous,
      totalPoints: profile.seasonXp,
      lifetimeXp: profile.lifetimeXp,
      xpToday: await xpToday(context.user.id),
      sparkline: await sparkline(context.user.id),
      tier,
      level,
      streak: profile.streak,
      briefClaimedToday,
      leaderboard: { position: Number(ahead?.count ?? 0) + 1 },
      badges: earned,
      recent,
      nextMilestones: [
        {
          key: "SAVED_10",
          label: "10 PROPERTIES SAVED",
          current: Math.min(10, Number(savedCount?.count ?? 0)),
          target: 10,
        },
        {
          key: "WATCH_5",
          label: "5 ZIPS WATCHED",
          current: Math.min(5, Number(watchCount?.count ?? 0)),
          target: 5,
        },
      ],
    };
  }),

  /** Daily brief: read once per market day, +15 PP, protects the streak. */
  claimDailyBrief: authed.handler(async ({ context }) => {
    const result = await award(context.user.id, "DAILY_BRIEF");
    return result;
  }),

  setLeague: authed
    .input(z.object({ league: z.enum(leagues) }))
    .handler(async ({ input, context }) => {
      await ensureProfile(context.user.id);
      await db
        .update(ppProfiles)
        .set({ league: input.league })
        .where(eq(ppProfiles.userId, context.user.id));
      return { ok: true };
    }),

  setIdentity: authed
    .input(
      z.object({
        anonymous: z.boolean(),
        ticker: z
          .string()
          .regex(/^[A-Z]{2,5}$/, "2–5 uppercase letters")
          .nullable(),
      }),
    )
    .handler(async ({ input, context }) => {
      await ensureProfile(context.user.id);
      await db
        .update(ppProfiles)
        .set({ anonymous: input.anonymous, ticker: input.ticker })
        .where(eq(ppProfiles.userId, context.user.id));
      return { ok: true };
    }),
};
