import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../database";
import { properties as propertiesTable, savedProperties, zips } from "../database/schema";
import { authed, withUser } from "../middleware/auth";
import { award } from "../lib/pp";

const sortValues = ["score", "priceAsc", "priceDesc", "newest"] as const;

const searchInput = z.object({
  city: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  beds: z.number().optional(),
  baths: z.number().optional(),
  types: z.array(z.string()).optional(),
  zip: z.string().optional(),
  sort: z.enum(sortValues).default("score"),
});

/** Property search — filters apply instantly, so this is one cheap query. */
export const properties = {
  search: withUser.input(searchInput).handler(async ({ input, context }) => {
    const where = [];
    if (input.city) where.push(eq(propertiesTable.city, input.city));
    if (input.zip) where.push(eq(propertiesTable.zip, input.zip));
    if (input.minPrice !== undefined) where.push(gte(propertiesTable.price, input.minPrice));
    if (input.maxPrice !== undefined) where.push(lte(propertiesTable.price, input.maxPrice));
    if (input.beds) where.push(gte(propertiesTable.beds, input.beds));
    if (input.baths) where.push(gte(propertiesTable.baths, input.baths));
    if (input.types?.length) where.push(inArray(propertiesTable.type, input.types));

    const order =
      input.sort === "priceAsc"
        ? asc(propertiesTable.price)
        : input.sort === "priceDesc"
          ? desc(propertiesTable.price)
          : input.sort === "newest"
            ? asc(propertiesTable.dom)
            : desc(propertiesTable.score);

    const rows = await db
      .select()
      .from(propertiesTable)
      .where(where.length ? and(...where) : undefined)
      .orderBy(order);

    const saved = context.user
      ? await db
          .select({ propertyId: savedProperties.propertyId })
          .from(savedProperties)
          .where(eq(savedProperties.userId, context.user.id))
      : [];
    const savedSet = new Set(saved.map((s) => s.propertyId));

    return rows.map((p) => ({ ...p, saved: savedSet.has(p.id) }));
  }),

  /** Distinct facet values for the filter rail. */
  facets: withUser.handler(async () => {
    const rows = await db.select().from(propertiesTable);
    return {
      cities: [...new Set(rows.map((r) => r.city))].sort(),
      types: [...new Set(rows.map((r) => r.type))].sort(),
      priceMin: Math.min(...rows.map((r) => r.price)),
      priceMax: Math.max(...rows.map((r) => r.price)),
    };
  }),

  get: withUser.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, input.id));
    if (!property) throw new ORPCError("NOT_FOUND", { message: "Property not found" });

    const [zipRow] = await db.select().from(zips).where(eq(zips.zip, property.zip));

    let saved = false;
    if (context.user) {
      const [row] = await db
        .select()
        .from(savedProperties)
        .where(
          and(
            eq(savedProperties.userId, context.user.id),
            eq(savedProperties.propertyId, property.id),
          ),
        );
      saved = Boolean(row);
    }

    const comparables = await db
      .select()
      .from(propertiesTable)
      .where(and(eq(propertiesTable.zip, property.zip)))
      .limit(4);

    return {
      ...property,
      saved,
      zipData: zipRow ?? null,
      verdict: property.score >= 70 ? "BUY" : "HOLD",
      comparables: comparables.filter((c) => c.id !== property.id).slice(0, 3),
    };
  }),

  /** Save toggle. First save of a given property awards +10 PP, once, forever. */
  toggleSave: authed
    .input(z.object({ propertyId: z.string() }))
    .handler(async ({ input, context }) => {
      const [existing] = await db
        .select()
        .from(savedProperties)
        .where(
          and(
            eq(savedProperties.userId, context.user.id),
            eq(savedProperties.propertyId, input.propertyId),
          ),
        );

      if (existing) {
        await db.delete(savedProperties).where(eq(savedProperties.id, existing.id));
        return { saved: false, awarded: null };
      }

      await db.insert(savedProperties).values({
        id: crypto.randomUUID(),
        userId: context.user.id,
        propertyId: input.propertyId,
      });
      const result = await award(context.user.id, "PROPERTY_SAVE", input.propertyId);
      return { saved: true, awarded: result.awarded ? result : null };
    }),

  saved: authed.handler(async ({ context }) => {
    const rows = await db
      .select({ property: propertiesTable, savedAt: savedProperties.createdAt })
      .from(savedProperties)
      .innerJoin(propertiesTable, eq(propertiesTable.id, savedProperties.propertyId))
      .where(eq(savedProperties.userId, context.user.id))
      .orderBy(desc(savedProperties.createdAt));
    return rows.map((r) => ({ ...r.property, saved: true, savedAt: r.savedAt }));
  }),
};
