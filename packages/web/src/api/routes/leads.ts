import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../database";
import { leadPurchases, leads as leadsTable, properties } from "../database/schema";
import { authed, withUser } from "../middleware/auth";
import { award } from "../lib/pp";

const audiences = ["realtor", "contractor"] as const;

/** Lead marketplace. Payments are stubbed — the purchase records state, nothing is charged. */
export const leads = {
  list: withUser
    .input(
      z.object({
        audience: z.enum(audiences).default("realtor"),
        tier: z.string().optional(),
        exclusivity: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const where = [eq(leadsTable.audience, input.audience)];
      if (input.tier && input.tier !== "All") where.push(eq(leadsTable.tier, input.tier));
      if (input.exclusivity && input.exclusivity !== "All") {
        where.push(eq(leadsTable.exclusivity, input.exclusivity));
      }

      const rows = await db
        .select({ lead: leadsTable, property: properties })
        .from(leadsTable)
        .innerJoin(properties, eq(properties.id, leadsTable.propertyId))
        .where(and(...where))
        .orderBy(desc(leadsTable.score));

      const owned = context.user
        ? await db
            .select({ leadId: leadPurchases.leadId })
            .from(leadPurchases)
            .where(eq(leadPurchases.userId, context.user.id))
        : [];
      const ownedSet = new Set(owned.map((o) => o.leadId));

      return rows.map(({ lead, property }) => ({
        ...lead,
        purchased: ownedSet.has(lead.id),
        property,
        specLine: `${property.city}, ${property.state} ${property.zip} · ${property.beds} bd / ${property.baths} ba · ${property.sqft.toLocaleString("en-US")} sqft · built ${property.built}`,
      }));
    }),

  purchase: authed.input(z.object({ leadId: z.string() })).handler(async ({ input, context }) => {
    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, input.leadId));
    if (!lead) throw new ORPCError("NOT_FOUND", { message: "Lead not found" });

    const rows = await db
      .insert(leadPurchases)
      .values({
        id: crypto.randomUUID(),
        userId: context.user.id,
        leadId: lead.id,
        pricePaid: lead.price,
      })
      .onConflictDoNothing()
      .returning();

    if (!rows.length) return { purchased: true, alreadyOwned: true, awarded: null };

    const result = await award(context.user.id, "LEAD_PURCHASE", lead.id);
    return { purchased: true, alreadyOwned: false, awarded: result.awarded ? result : null };
  }),

  /** Purchased-lead pipeline for the realtor and contractor dashboards. */
  purchased: authed.handler(async ({ context }) => {
    const rows = await db
      .select({ purchase: leadPurchases, lead: leadsTable, property: properties })
      .from(leadPurchases)
      .innerJoin(leadsTable, eq(leadsTable.id, leadPurchases.leadId))
      .innerJoin(properties, eq(properties.id, leadsTable.propertyId))
      .where(eq(leadPurchases.userId, context.user.id))
      .orderBy(desc(leadPurchases.createdAt));

    return rows.map(({ purchase, lead, property }) => ({
      id: purchase.id,
      leadId: lead.id,
      status: purchase.status,
      pricePaid: purchase.pricePaid,
      purchasedAt: purchase.createdAt,
      tier: lead.tier,
      score: lead.score,
      conversion: lead.conversion,
      addr: property.addr,
      city: property.city,
      zip: property.zip,
    }));
  }),

  setStatus: authed
    .input(z.object({ purchaseId: z.string(), status: z.string() }))
    .handler(async ({ input, context }) => {
      await db
        .update(leadPurchases)
        .set({ status: input.status })
        .where(
          and(eq(leadPurchases.id, input.purchaseId), eq(leadPurchases.userId, context.user.id)),
        );
      return { ok: true };
    }),
};
