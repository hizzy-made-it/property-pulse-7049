import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../database";
import { subscriptions } from "../database/schema";
import { authed, withUser } from "../middleware/auth";

/**
 * Billing is deliberately stubbed: the flows and the state changes are real,
 * no payment processor is wired and nothing is ever charged.
 */
export const PLANS = [
  {
    key: "free",
    name: "OBSERVER",
    priceMonthly: 0,
    audience: "Anyone",
    blurb: "Search, scores, and the market map. No alerts, no saved analysis.",
    features: [
      "Property search and scores",
      "Market map, all metrics",
      "ROI calculator (unsaved)",
      "PulsePoints and leaderboards",
    ],
  },
  {
    key: "investor",
    name: "INVESTOR",
    priceMonthly: 99,
    audience: "Investors",
    blurb: "The full analysis spine — alerts, saved scenarios, stress testing.",
    features: [
      "Everything in Observer",
      "Unlimited saved properties and scenarios",
      "ZIP watch list and fired alerts",
      "Improvement planner and stress test",
      "Contractor match table",
    ],
  },
  {
    key: "desk",
    name: "DESK",
    priceMonthly: 299,
    audience: "Teams",
    blurb: "Seats, shared watch lists, and lead credits against the marketplace.",
    features: [
      "Everything in Investor",
      "5 seats, shared watch lists",
      "$500 of lead credit each month",
      "Priority alert delivery",
    ],
  },
] as const;

export const billing = {
  plans: withUser.handler(() => PLANS),

  current: authed.handler(async ({ context }) => {
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, context.user.id));
    const plan = PLANS.find((p) => p.key === (row?.plan ?? "free")) ?? PLANS[0];
    return { plan: plan.key, name: plan.name, priceMonthly: plan.priceMonthly, status: row?.status ?? "active" };
  }),

  /** Stubbed checkout — records the chosen plan, charges nothing. */
  subscribe: authed
    .input(z.object({ plan: z.enum(["free", "investor", "desk"]) }))
    .handler(async ({ input, context }) => {
      const plan = PLANS.find((p) => p.key === input.plan)!;
      await db
        .insert(subscriptions)
        .values({
          id: crypto.randomUUID(),
          userId: context.user.id,
          plan: plan.key,
          priceMonthly: plan.priceMonthly,
          status: "active",
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: { plan: plan.key, priceMonthly: plan.priceMonthly, status: "active" },
        });
      return { plan: plan.key, stubbed: true as const };
    }),
};
