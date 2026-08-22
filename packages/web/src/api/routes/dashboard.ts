import { eq, desc } from "drizzle-orm";
import { db } from "../database";
import { 
  savedProperties, properties, roiScenarios, leadPurchases, 
  leads as leadsTable, watchedZips, zips, alerts as alertsTable 
} from "../database/schema";
import { authed } from "../middleware/auth";

/** Dashboard summary — returns all user-specific data in one call. */
export const dashboard = {
  summary: authed.handler(async ({ context }) => {
    const userId = context.user.id;

    const [
      savedProps,
      savedCalcs,
      watched,
      purchased,
      firedAlerts,
    ] = await Promise.all([
      db
        .select({ property: properties, savedAt: savedProperties.createdAt })
        .from(savedProperties)
        .innerJoin(properties, eq(properties.id, savedProperties.propertyId))
        .where(eq(savedProperties.userId, userId))
        .orderBy(desc(savedProperties.createdAt))
        .limit(20),
      db
        .select()
        .from(roiScenarios)
        .where(eq(roiScenarios.userId, userId))
        .orderBy(desc(roiScenarios.createdAt))
        .limit(10),
      db
        .select({ watch: watchedZips, zip: zips })
        .from(watchedZips)
        .leftJoin(zips, eq(zips.zip, watchedZips.zip))
        .where(eq(watchedZips.userId, userId))
        .orderBy(desc(watchedZips.createdAt))
        .limit(20),
      db
        .select({ purchase: leadPurchases, lead: leadsTable, property: properties })
        .from(leadPurchases)
        .innerJoin(leadsTable, eq(leadsTable.id, leadPurchases.leadId))
        .innerJoin(properties, eq(properties.id, leadsTable.propertyId))
        .where(eq(leadPurchases.userId, userId))
        .orderBy(desc(leadPurchases.createdAt))
        .limit(10),
      db
        .select()
        .from(alertsTable)
        .orderBy(desc(alertsTable.createdAt))
        .limit(10),
    ]);

    return {
      savedProperties: savedProps.map(({ property, savedAt }) => ({
        ...property,
        saved: true,
        savedAt,
      })),
      roiAnalyses: savedCalcs.map((c) => ({
        id: c.id,
        label: c.label,
        propertyId: c.propertyId,
        inputs: c.inputs,
        results: c.results,
        createdAt: c.createdAt,
      })),
      watchedZips: watched.map(({ watch, zip }) => ({
        zip: watch.zip,
        name: zip?.name ?? watch.zip,
        addedAt: watch.createdAt,
      })),
      purchasedLeads: purchased.map(({ purchase, lead, property }) => ({
        id: purchase.id,
        leadId: lead.id,
        tier: lead.tier,
        score: lead.score,
        conversion: lead.conversion,
        pricePaid: purchase.pricePaid,
        status: purchase.status,
        addr: property.addr,
        city: property.city,
        zip: property.zip,
      })),
      recentAlerts: firedAlerts,
      counts: {
        savedProperties: savedProps.length,
        roiAnalyses: savedCalcs.length,
        watchedZips: watched.length,
        purchasedLeads: purchased.length,
      },
    };
  }),
};
