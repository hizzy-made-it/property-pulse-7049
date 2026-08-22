import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import { db } from "../database";
import { properties, zips as zipsTable } from "../database/schema";
import { withUser } from "../middleware/auth";

const metrics = ["emerging", "velocity", "permits"] as const;
export type HeatMetric = (typeof metrics)[number];

/**
 * Market-map data. The heat grid is a deterministic figure derived from the ZIP
 * table — swapping in a real choropleth later means replacing the renderer, not
 * this contract.
 */
export const zips = {
  list: withUser.handler(() => db.select().from(zipsTable).orderBy(desc(zipsTable.emergingScore))),

  /** Heat cells for a chosen metric, normalised 0–1 so the ramp is metric-agnostic. */
  heat: withUser
    .input(z.object({ metric: z.enum(metrics).default("emerging") }))
    .handler(async ({ input }) => {
      const rows = await db.select().from(zipsTable);
      const value = (r: (typeof rows)[number]) =>
        input.metric === "velocity"
          ? r.priceVelocity
          : input.metric === "permits"
            ? r.permits
            : r.emergingScore;

      const values = rows.map(value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = max - min || 1;

      return {
        metric: input.metric,
        label:
          input.metric === "velocity"
            ? "PRICE VELOCITY"
            : input.metric === "permits"
              ? "PERMIT ACTIVITY"
              : "EMERGING SCORE",
        cells: rows
          .map((r) => ({
            zip: r.zip,
            name: r.name,
            county: r.county,
            raw: value(r),
            display:
              input.metric === "velocity"
                ? `+${r.priceVelocity.toFixed(1)}%`
                : input.metric === "permits"
                  ? `${r.permits}`
                  : `${r.emergingScore}`,
            intensity: (value(r) - min) / span,
          }))
          .sort((a, b) => b.intensity - a.intensity),
      };
    }),

  get: withUser.input(z.object({ zip: z.string() })).handler(async ({ input }) => {
    const [row] = await db.select().from(zipsTable).where(eq(zipsTable.zip, input.zip));
    if (!row) throw new ORPCError("NOT_FOUND", { message: "ZIP not found" });
    const listings = await db.select().from(properties).where(eq(properties.zip, input.zip));
    return { ...row, listingCount: listings.length, listings };
  }),
};
