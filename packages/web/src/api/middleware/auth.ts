import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { base } from "../__core/app";
import { auth } from "../auth";
import { db } from "../database";
import { userRoles } from "../database/schema";

/** Optional auth — `context.user` is the session user or null. */
export const withUser = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  return next({
    context: { user: session?.user ?? null, session: session?.session ?? null },
  });
});

/** Protected procedures — rejects unauthenticated calls; `context.user` is non-null. */
export const authed = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED");
  return next({ context: { user: session.user, session: session.session } });
});

/** Admin-only procedures — the data editor lives behind this. */
export const adminOnly = authed.use(async ({ context, next }) => {
  const roles = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, context.user.id));
  if (!roles.some((r) => r.role === "admin")) {
    throw new ORPCError("FORBIDDEN", { message: "Admin role required" });
  }
  return next({ context });
});
