import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../database";
import { alerts as alertsTable, watchedZips, zips } from "../database/schema";
import { authed, withUser } from "../middleware/auth";
import { award } from "../lib/pp";

/** Market alerts — watched ZIP chips plus the fired-alert table under them. */
export const alerts = {
  watched: authed.handler(async ({ context }) => {
    const rows = await db
      .select({ watch: watchedZips, zip: zips })
      .from(watchedZips)
      .leftJoin(zips, eq(zips.zip, watchedZips.zip))
      .where(eq(watchedZips.userId, context.user.id))
      .orderBy(desc(watchedZips.createdAt));
    return rows.map((r) => ({
      zip: r.watch.zip,
      name: r.zip?.name ?? r.watch.zip,
      addedAt: r.watch.createdAt,
    }));
  }),

  watch: authed.input(z.object({ zip: z.string() })).handler(async ({ input, context }) => {
    const rows = await db
      .insert(watchedZips)
      .values({ id: crypto.randomUUID(), userId: context.user.id, zip: input.zip })
      .onConflictDoNothing()
      .returning();
    if (!rows.length) return { watching: true, awarded: null };
    const result = await award(context.user.id, "WATCH_ADD", input.zip);
    return { watching: true, awarded: result.awarded ? result : null };
  }),

  unwatch: authed.input(z.object({ zip: z.string() })).handler(async ({ input, context }) => {
    await db
      .delete(watchedZips)
      .where(and(eq(watchedZips.userId, context.user.id), eq(watchedZips.zip, input.zip)));
    return { watching: false };
  }),

  /** Fired alerts. Signed-in users see their watched ZIPs; visitors see the full feed. */
  fired: withUser.handler(async ({ context }) => {
    if (!context.user) return db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt)).limit(8);
    const watched = await db
      .select({ zip: watchedZips.zip })
      .from(watchedZips)
      .where(eq(watchedZips.userId, context.user.id));
    if (!watched.length) return [];
    return db
      .select()
      .from(alertsTable)
      .where(
        inArray(
          alertsTable.zip,
          watched.map((w) => w.zip),
        ),
      )
      .orderBy(desc(alertsTable.createdAt));
  }),
};
