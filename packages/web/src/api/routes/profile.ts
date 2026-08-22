import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../database";
import { subscriptions, userRoles } from "../database/schema";
import { authed, withUser } from "../middleware/auth";
import { ensureProfile, type League } from "../lib/pp";

const roleValues = ["investor", "realtor", "contractor", "admin"] as const;
export type Role = (typeof roleValues)[number];

/** Identity: session user, the roles they hold, and their stubbed plan. */
export const profile = {
  me: withUser.handler(async ({ context }) => {
    if (!context.user) return null;
    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, context.user.id));
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, context.user.id));
    const pp = await ensureProfile(context.user.id);
    return {
      id: context.user.id,
      name: context.user.name,
      email: context.user.email,
      image: context.user.image ?? null,
      roles: roles.map((r) => r.role as Role),
      primaryRole: (roles.find((r) => r.isPrimary)?.role ?? roles[0]?.role ?? null) as Role | null,
      plan: sub?.plan ?? "free",
      league: pp.league as League,
      onboarded: roles.length > 0,
    };
  }),

  addRole: authed
    .input(z.object({ role: z.enum(roleValues), primary: z.boolean().default(false) }))
    .handler(async ({ input, context }) => {
      if (input.primary) {
        await db
          .update(userRoles)
          .set({ isPrimary: false })
          .where(eq(userRoles.userId, context.user.id));
      }
      await db
        .insert(userRoles)
        .values({
          id: crypto.randomUUID(),
          userId: context.user.id,
          role: input.role,
          isPrimary: input.primary,
        })
        .onConflictDoUpdate({
          target: [userRoles.userId, userRoles.role],
          set: { isPrimary: input.primary },
        });
      await ensureProfile(context.user.id, input.role === "admin" ? "investor" : input.role);
      return { ok: true };
    }),

  removeRole: authed
    .input(z.object({ role: z.enum(roleValues) }))
    .handler(async ({ input, context }) => {
      await db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, context.user.id), eq(userRoles.role, input.role)));
      return { ok: true };
    }),

  setPrimaryRole: authed
    .input(z.object({ role: z.enum(roleValues) }))
    .handler(async ({ input, context }) => {
      await db
        .update(userRoles)
        .set({ isPrimary: false })
        .where(eq(userRoles.userId, context.user.id));
      await db
        .update(userRoles)
        .set({ isPrimary: true })
        .where(and(eq(userRoles.userId, context.user.id), eq(userRoles.role, input.role)));
      return { ok: true };
    }),
};
