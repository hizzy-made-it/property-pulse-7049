import { z } from "zod";
import { asc, desc } from "drizzle-orm";
import { db } from "../database";
import { contractors, improvements, projects } from "../database/schema";
import { authed, withUser } from "../middleware/auth";
import { award } from "../lib/pp";

/** Analysis-suite data: improvement planner, stress test, contractor match. */
export const renovation = {
  improvements: withUser.handler(() =>
    db.select().from(improvements).orderBy(asc(improvements.sortOrder)),
  ),

  contractors: withUser.handler(() =>
    db.select().from(contractors).orderBy(desc(contractors.match)),
  ),

  projects: withUser.handler(() => db.select().from(projects).orderBy(asc(projects.starts))),

  /**
   * Stress test. Scenario toggles knock the base annual cash flow down; the
   * verdict is textual, never colour-coded.
   */
  stressTest: authed
    .input(
      z.object({
        baseAnnualCashFlow: z.number().default(3744),
        rateShock: z.boolean().default(false),
        vacancy: z.boolean().default(false),
        priceDrop: z.boolean().default(false),
        maintenanceSpike: z.boolean().default(false),
      }),
    )
    .handler(async ({ input, context }) => {
      let cashFlow = input.baseAnnualCashFlow;
      const applied: string[] = [];
      if (input.rateShock) {
        cashFlow -= 2280;
        applied.push("RATE +2.0 PTS");
      }
      if (input.vacancy) {
        cashFlow -= 1470;
        applied.push("VACANCY 15%");
      }
      if (input.priceDrop) {
        cashFlow -= 640;
        applied.push("PRICE −12%");
      }
      if (input.maintenanceSpike) {
        cashFlow -= 980;
        applied.push("MAINTENANCE ×2");
      }

      const verdict =
        cashFlow >= 3000
          ? "HOLDS UNDER STRESS"
          : cashFlow >= 1500
            ? "THIN BUT SOLVENT"
            : cashFlow >= 0
              ? "BREAK-EVEN RISK"
              : "NEGATIVE CARRY";

      const result = await award(context.user.id, "STRESS_TEST");
      return {
        cashFlow: Math.round(cashFlow),
        verdict,
        applied,
        awarded: result.awarded ? result : null,
      };
    }),
};
