import { desc, eq } from "drizzle-orm";
import { db } from "../database";
import { leaderboardMembers, ppProfiles } from "../database/schema";
import { withUser } from "../middleware/auth";
import { SEASON, tierFor, type League } from "../lib/pp";

const LEAGUES: { key: League; label: string }[] = [
  { key: "investor", label: "INVESTOR LEAGUE" },
  { key: "realtor", label: "REALTOR LEAGUE" },
  { key: "contractor", label: "CONTRACTOR LEAGUE" },
];

export interface BoardRow {
  id: string;
  rank: number;
  name: string;
  ticker: boolean;
  anonymous: boolean;
  tier: string;
  seasonPp: number;
  delta7d: number;
  rankDelta: number;
  isYou: boolean;
}

/** Season leaderboards. The signed-in user is spliced into their own league. */
export const leaderboards = {
  season: withUser.handler(async ({ context }) => {
    const members = await db
      .select()
      .from(leaderboardMembers)
      .where(eq(leaderboardMembers.season, SEASON))
      .orderBy(desc(leaderboardMembers.seasonPp));

    let me: typeof ppProfiles.$inferSelect | undefined;
    if (context.user) {
      [me] = await db.select().from(ppProfiles).where(eq(ppProfiles.userId, context.user.id));
    }

    const leagues = LEAGUES.map(({ key, label }) => {
      const rows: BoardRow[] = members
        .filter((m) => m.league === key)
        .map((m) => ({
          id: m.id,
          rank: 0,
          name: m.name,
          ticker: m.ticker,
          anonymous: m.anonymous,
          tier: m.tier,
          seasonPp: m.seasonPp,
          delta7d: m.delta7d,
          rankDelta: m.rankDelta,
          isYou: false,
        }));

      if (me && me.league === key) {
        rows.push({
          id: "you",
          rank: 0,
          name: me.anonymous ? "Anonymous investor" : (me.ticker ?? context.user!.name ?? "You"),
          ticker: Boolean(me.ticker) && !me.anonymous,
          anonymous: me.anonymous,
          tier: tierFor(me.lifetimeXp, key).key,
          seasonPp: me.seasonXp,
          delta7d: me.seasonXp,
          rankDelta: 0,
          isYou: true,
        });
      }

      rows.sort((a, b) => b.seasonPp - a.seasonPp);
      rows.forEach((r, i) => (r.rank = i + 1));
      return { key, label, rows };
    });

    const tape = members
      .slice()
      .sort((a, b) => b.delta7d - a.delta7d)
      .slice(0, 14)
      .map((m) => ({
        name: m.ticker ? `$${m.name}` : m.name,
        delta: m.delta7d,
        up: m.rankDelta >= 0,
      }));

    return { season: SEASON, leagues, tape };
  }),
};
