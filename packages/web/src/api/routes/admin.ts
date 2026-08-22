import { z } from "zod";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../database";
import {
  contractors,
  improvements,
  leadPurchases,
  leads,
  projects,
  properties,
  user,
  userRoles,
  zips,
} from "../database/schema";
import { adminOnly } from "../middleware/auth";

const propertyInput = z.object({
  id: z.string(),
  addr: z.string(),
  city: z.string(),
  state: z.string().default("FL"),
  zip: z.string(),
  price: z.number(),
  beds: z.number(),
  baths: z.number(),
  sqft: z.number(),
  lot: z.string().default("—"),
  built: z.number(),
  type: z.string(),
  score: z.number(),
  growth: z.number(),
  housing: z.number(),
  infrastructure: z.number(),
  quality: z.number(),
  rent: z.number(),
  capRate: z.number(),
  cashFlow: z.number(),
  hood: z.string(),
  income: z.string(),
  employment: z.string(),
  crime: z.string(),
  velocity: z.string(),
  dom: z.number(),
  listedAt: z.string(),
  mls: z.string(),
  status: z.string().default("ACTIVE"),
  photo: z.string().nullable().optional(),
});

const zipInput = z.object({
  zip: z.string(),
  name: z.string(),
  county: z.string(),
  avgPrice: z.number(),
  emergingScore: z.number(),
  priceVelocity: z.number(),
  permits: z.number(),
  inventoryMonths: z.number(),
  medianIncome: z.number(),
  employment: z.number(),
});

const leadInput = z.object({
  id: z.string(),
  propertyId: z.string(),
  audience: z.enum(["realtor", "contractor"]),
  tier: z.string(),
  exclusivity: z.string(),
  exLabel: z.string(),
  expiresLabel: z.string(),
  score: z.number(),
  location: z.number(),
  trend: z.number(),
  financial: z.number(),
  demand: z.number(),
  roi: z.string(),
  conversion: z.string(),
  insight: z.string(),
  views: z.number(),
  interested: z.number(),
  price: z.number(),
});

/** Data editor — the user owns the market spine and can rewrite any of it. */
export const admin = {
  overview: adminOnly.handler(async () => {
    const counts = await Promise.all(
      [properties, zips, leads, leadPurchases, contractors, projects, improvements, user].map(
        async (table) => {
          const [row] = await db.select({ n: sql<number>`count(*)` }).from(table);
          return Number(row?.n ?? 0);
        },
      ),
    );
    return {
      properties: counts[0],
      zips: counts[1],
      leads: counts[2],
      purchases: counts[3],
      contractors: counts[4],
      projects: counts[5],
      improvements: counts[6],
      users: counts[7],
    };
  }),

  properties: adminOnly.handler(() =>
    db.select().from(properties).orderBy(desc(properties.score)),
  ),
  upsertProperty: adminOnly.input(propertyInput).handler(async ({ input }) => {
    await db
      .insert(properties)
      .values(input)
      .onConflictDoUpdate({ target: properties.id, set: input });
    return { ok: true };
  }),
  deleteProperty: adminOnly.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    await db.delete(properties).where(eq(properties.id, input.id));
    return { ok: true };
  }),

  zips: adminOnly.handler(() => db.select().from(zips).orderBy(asc(zips.zip))),
  upsertZip: adminOnly.input(zipInput).handler(async ({ input }) => {
    await db.insert(zips).values(input).onConflictDoUpdate({ target: zips.zip, set: input });
    return { ok: true };
  }),
  deleteZip: adminOnly.input(z.object({ zip: z.string() })).handler(async ({ input }) => {
    await db.delete(zips).where(eq(zips.zip, input.zip));
    return { ok: true };
  }),

  leads: adminOnly.handler(() => db.select().from(leads).orderBy(desc(leads.score))),
  upsertLead: adminOnly.input(leadInput).handler(async ({ input }) => {
    await db.insert(leads).values(input).onConflictDoUpdate({ target: leads.id, set: input });
    return { ok: true };
  }),
  deleteLead: adminOnly.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    await db.delete(leads).where(eq(leads.id, input.id));
    return { ok: true };
  }),

  users: adminOnly.handler(async () => {
    const rows = await db.select().from(user);
    const roles = await db.select().from(userRoles);
    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      roles: roles.filter((r) => r.userId === u.id).map((r) => r.role),
    }));
  }),

  grantRole: adminOnly
    .input(z.object({ userId: z.string(), role: z.string() }))
    .handler(async ({ input }) => {
      await db
        .insert(userRoles)
        .values({ id: crypto.randomUUID(), userId: input.userId, role: input.role })
        .onConflictDoNothing();
      return { ok: true };
    }),
};
