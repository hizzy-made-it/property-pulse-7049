import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../database";
import { roiScenarios } from "../database/schema";
import { authed, withUser } from "../middleware/auth";
import { award } from "../lib/pp";

export const roiInput = z.object({
  price: z.number(),
  down: z.number(),
  rate: z.number(),
  term: z.number(),
  rent: z.number(),
  vac: z.number(),
  taxes: z.number(),
  ins: z.number(),
  maint: z.number(),
  mgmt: z.number(),
});

export type RoiInput = z.infer<typeof roiInput>;

/**
 * Standard amortisation model, identical to the prototype's:
 * 3% annual appreciation, 2% closing costs, 2% annual rent growth, 10-year hold.
 */
export function computeRoi(i: RoiInput) {
  const term = Math.max(1, i.term);
  const loan = i.price * (1 - i.down / 100);
  const r = i.rate / 1200;
  const n = term * 12;
  const payment = r > 0 ? (loan * r) / (1 - Math.pow(1 + r, -n)) : loan / n;

  const grossMonthly = i.rent * (1 - i.vac / 100);
  const expenses = i.taxes / 12 + i.ins / 12 + (i.rent * (i.maint + i.mgmt)) / 100;
  const noiMonthly = grossMonthly - expenses;
  const capRate = i.price > 0 ? ((noiMonthly * 12) / i.price) * 100 : 0;
  const cashFlowMonthly = noiMonthly - payment;
  const invested = (i.price * i.down) / 100 + i.price * 0.02;
  const cashOnCash = invested > 0 ? ((cashFlowMonthly * 12) / invested) * 100 : 0;

  const equity: number[] = [];
  const cumulative: number[] = [];
  let balance = loan;
  let cum = 0;
  for (let y = 0; y <= 10; y++) {
    equity.push(Math.max(0, i.price * Math.pow(1.03, y) - balance));
    cumulative.push(cum);
    for (let m = 0; m < 12; m++) balance = Math.max(0, balance - (payment - balance * r));
    cum += cashFlowMonthly * 12 * Math.pow(1.02, y);
  }

  const final = equity[10] + cumulative[10];
  const annualized =
    invested > 0 && final > 0 ? (Math.pow(final / invested, 1 / 10) - 1) * 100 : 0;

  return {
    capRate,
    cashOnCash,
    annualized,
    cashFlowMonthly,
    payment,
    noiMonthly,
    invested,
    equity,
    cumulative,
  };
}

export const roi = {
  calculate: withUser.input(roiInput).handler(({ input }) => computeRoi(input)),

  /** Saving a scenario is the +25 PP action. Repeat labels are separate scenarios. */
  save: authed
    .input(
      z.object({
        label: z.string().min(1),
        propertyId: z.string().nullable().optional(),
        inputs: roiInput,
      }),
    )
    .handler(async ({ input, context }) => {
      const results = computeRoi(input.inputs);
      const id = crypto.randomUUID();
      await db.insert(roiScenarios).values({
        id,
        userId: context.user.id,
        label: input.label,
        propertyId: input.propertyId ?? null,
        inputs: input.inputs,
        results,
      });
      const result = await award(context.user.id, "ROI_SAVE", id);
      return { id, awarded: result.awarded ? result : null };
    }),

  list: authed.handler(({ context }) =>
    db
      .select()
      .from(roiScenarios)
      .where(eq(roiScenarios.userId, context.user.id))
      .orderBy(desc(roiScenarios.createdAt)),
  ),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db
      .delete(roiScenarios)
      .where(and(eq(roiScenarios.id, input.id), eq(roiScenarios.userId, context.user.id)));
    return { ok: true };
  }),
};
