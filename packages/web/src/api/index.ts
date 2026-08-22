import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { auth } from "./auth";
import { ping } from "./routes/ping";
import { properties } from "./routes/properties";
import { zips } from "./routes/zips";
import { leads } from "./routes/leads";
import { roi } from "./routes/roi";
import { alerts } from "./routes/alerts";
import { renovation } from "./routes/renovation";
import { gamification } from "./routes/gamification";
import { leaderboards } from "./routes/leaderboards";
import { billing } from "./routes/billing";
import { profile } from "./routes/profile";
import { admin } from "./routes/admin";
import { dashboard } from "./routes/dashboard";
import stripeWebhook from "./routes/stripe-webhook";

// API features are oRPC procedures, one file per feature in ./routes/,
// composed into this router — typed end-to-end via the clients
// (web: src/web/lib/api.ts, mobile: lib/api.ts).
export const router = {
  ping,
  properties,
  zips,
  leads,
  roi,
  alerts,
  renovation,
  gamification,
  leaderboards,
  billing,
  profile,
  admin,
  dashboard,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/", stripeWebhook);

export default app;
