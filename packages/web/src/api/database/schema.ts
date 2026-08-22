import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export * from "./auth-schema";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** Roles a user holds: investor | realtor | contractor | admin. One user may hold several. */
export const userRoles = sqliteTable(
  "user_roles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    isPrimary: integer("is_primary", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [uniqueIndex("user_roles_user_role_idx").on(t.userId, t.role)],
);

/** Subscription state — payments are stubbed, this records the chosen plan. */
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  priceMonthly: integer("price_monthly").notNull().default(0),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).default(now).notNull(),
});

/** ZIP-level market data — the spine every score reads from. */
export const zips = sqliteTable("zips", {
  zip: text("zip").primaryKey(),
  name: text("name").notNull(),
  county: text("county").notNull(),
  avgPrice: integer("avg_price").notNull(),
  emergingScore: integer("emerging_score").notNull(),
  priceVelocity: real("price_velocity").notNull(),
  permits: integer("permits").notNull(),
  inventoryMonths: real("inventory_months").notNull(),
  medianIncome: integer("median_income").notNull(),
  employment: real("employment").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
});

export const properties = sqliteTable(
  "properties",
  {
    id: text("id").primaryKey(),
    addr: text("addr").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull().default("FL"),
    zip: text("zip").notNull(),
    price: integer("price").notNull(),
    beds: integer("beds").notNull(),
    baths: real("baths").notNull(),
    sqft: integer("sqft").notNull(),
    lot: text("lot").notNull().default("—"),
    built: integer("built").notNull(),
    type: text("type").notNull(),
    score: integer("score").notNull(),
    growth: integer("growth").notNull(),
    housing: integer("housing").notNull(),
    infrastructure: integer("infrastructure").notNull(),
    quality: integer("quality").notNull(),
    rent: integer("rent").notNull(),
    capRate: real("cap_rate").notNull(),
    cashFlow: integer("cash_flow").notNull(),
    hood: text("hood").notNull(),
    income: text("income").notNull(),
    employment: text("employment").notNull(),
    crime: text("crime").notNull(),
    velocity: text("velocity").notNull(),
    dom: integer("dom").notNull(),
    listedAt: text("listed_at").notNull(),
    mls: text("mls").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    photo: text("photo"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("properties_zip_idx").on(t.zip), index("properties_score_idx").on(t.score)],
);

export const savedProperties = sqliteTable(
  "saved_properties",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [uniqueIndex("saved_user_property_idx").on(t.userId, t.propertyId)],
);

export const watchedZips = sqliteTable(
  "watched_zips",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    zip: text("zip").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [uniqueIndex("watched_user_zip_idx").on(t.userId, t.zip)],
);

/** Alerts that fired against a watched ZIP. */
export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey(),
  zip: text("zip").notNull(),
  signal: text("signal").notNull(),
  detail: text("detail").notNull(),
  firedAt: text("fired_at").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
});

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  propertyId: text("property_id").notNull(),
  audience: text("audience").notNull().default("realtor"),
  tier: text("tier").notNull(),
  exclusivity: text("exclusivity").notNull(),
  exLabel: text("ex_label").notNull(),
  expiresLabel: text("expires_label").notNull(),
  score: integer("score").notNull(),
  location: integer("location").notNull(),
  trend: integer("trend").notNull(),
  financial: integer("financial").notNull(),
  demand: integer("demand").notNull(),
  roi: text("roi").notNull(),
  conversion: text("conversion").notNull(),
  insight: text("insight").notNull(),
  views: integer("views").notNull(),
  interested: integer("interested").notNull(),
  price: integer("price").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
});

export const leadPurchases = sqliteTable(
  "lead_purchases",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    leadId: text("lead_id").notNull(),
    pricePaid: integer("price_paid").notNull(),
    status: text("status").notNull().default("NEW"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [uniqueIndex("purchase_user_lead_idx").on(t.userId, t.leadId)],
);

export const roiScenarios = sqliteTable("roi_scenarios", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  label: text("label").notNull(),
  propertyId: text("property_id"),
  inputs: text("inputs", { mode: "json" }).notNull(),
  results: text("results", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
});

/** Improvement-planner catalogue. */
export const improvements = sqliteTable("improvements", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cost: integer("cost").notNull(),
  value: integer("value").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const contractors = sqliteTable("contractors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  trade: text("trade").notNull(),
  zips: text("zips").notNull(),
  rating: real("rating").notNull(),
  jobs: integer("jobs").notNull(),
  leadTime: text("lead_time").notNull(),
  match: integer("match").notNull(),
});

/** Contractor upcoming projects, realtor purchased-lead pipeline support. */
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  title: text("title").notNull(),
  addr: text("addr").notNull(),
  zip: text("zip").notNull(),
  scope: text("scope").notNull(),
  value: integer("value").notNull(),
  stage: text("stage").notNull(),
  starts: text("starts").notNull(),
});

/** Every PulsePoints award, append-only — the economy's ledger. */
export const ppEvents = sqliteTable(
  "pp_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),
    points: integer("points").notNull(),
    label: text("label").notNull(),
    subjectId: text("subject_id"),
    season: text("season").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("pp_events_user_idx").on(t.userId),
    index("pp_events_season_idx").on(t.season),
    uniqueIndex("pp_events_once_idx").on(t.userId, t.kind, t.subjectId),
  ],
);

export const ppProfiles = sqliteTable("pp_profiles", {
  userId: text("user_id").primaryKey(),
  league: text("league").notNull().default("investor"),
  ticker: text("ticker"),
  anonymous: integer("anonymous", { mode: "boolean" }).default(true).notNull(),
  lifetimeXp: integer("lifetime_xp").notNull().default(0),
  seasonXp: integer("season_xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastBriefAt: integer("last_brief_at", { mode: "timestamp_ms" }),
  lastActiveDay: text("last_active_day"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
});

export const badges = sqliteTable(
  "badges",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    earnedAt: integer("earned_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [uniqueIndex("badges_user_key_idx").on(t.userId, t.key)],
);

/** A position the user owns. propertyId nullable so off-platform holdings can be entered manually. */
export const holdings = sqliteTable(
  "holdings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id"),
    label: text("label").notNull(),
    city: text("city").notNull(),
    zip: text("zip").notNull(),
    acquiredAt: text("acquired_at").notNull(),
    purchasePrice: integer("purchase_price").notNull(),
    currentValue: integer("current_value").notNull(),
    loanBalance: integer("loan_balance").notNull().default(0),
    rate: real("rate").notNull().default(0),
    monthlyRent: integer("monthly_rent").notNull().default(0),
    monthlyExpenses: integer("monthly_expenses").notNull().default(0),
    status: text("status").notNull().default("held"),
    soldAt: text("sold_at"),
    soldPrice: integer("sold_price"),
    photo: text("photo"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("holdings_user_idx").on(t.userId), index("holdings_zip_idx").on(t.zip)],
);

/** The rises and falls — a chartable value series for a holding, property or ZIP. */
export const valuationHistory = sqliteTable(
  "valuation_history",
  {
    id: text("id").primaryKey(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    asOf: text("as_of").notNull(),
    value: integer("value").notNull(),
    source: text("source").notNull().default("seed"),
  },
  (t) => [
    index("valuation_subject_idx").on(t.subjectType, t.subjectId),
    uniqueIndex("valuation_subject_asof_idx").on(t.subjectType, t.subjectId, t.asOf),
  ],
);

/** Bids the user submitted as a contractor. Attaches to a project or property when one exists. */
export const bids = sqliteTable(
  "bids",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id"),
    projectId: text("project_id"),
    label: text("label").notNull(),
    scope: text("scope").notNull(),
    zip: text("zip").notNull().default(""),
    amount: integer("amount").notNull(),
    submittedAt: text("submitted_at").notNull(),
    decidedAt: text("decided_at"),
    status: text("status").notNull().default("submitted"),
    awardedAmount: integer("awarded_amount"),
    competitorCount: integer("competitor_count").notNull().default(0),
    marginPct: real("margin_pct").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("bids_user_idx").on(t.userId), index("bids_status_idx").on(t.status)],
);

/** Per-provider sync metadata. No secrets — keys live in the root .env only. */
export const providerConnections = sqliteTable("provider_connections", {
  provider: text("provider").primaryKey(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp_ms" }),
  lastSyncStatus: text("last_sync_status"),
  recordCount: integer("record_count").notNull().default(0),
  notes: text("notes"),
});

/** Static registry of all 40 scoring signals — the UI reads this, so signal 41 is a seed row. */
export const signalDefs = sqliteTable(
  "signal_defs",
  {
    key: text("key").primaryKey(),
    label: text("label").notNull(),
    category: text("category").notNull(),
    weight: real("weight").notNull(),
    unit: text("unit").notNull().default(""),
    leadMonthsLow: integer("lead_months_low").notNull().default(0),
    leadMonthsHigh: integer("lead_months_high").notNull().default(0),
    higherIsBetter: integer("higher_is_better", { mode: "boolean" }).default(true).notNull(),
    providerKey: text("provider_key").notNull(),
    core: integer("core", { mode: "boolean" }).default(true).notNull(),
    whyIgnored: text("why_ignored").notNull().default(""),
    curve: text("curve", { mode: "json" }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("signal_defs_category_idx").on(t.category)],
);

/** Per-ZIP signal readings, long format — one row per signal per ZIP. */
export const zipSignals = sqliteTable(
  "zip_signals",
  {
    id: text("id").primaryKey(),
    zip: text("zip").notNull(),
    signalKey: text("signal_key").notNull(),
    value: real("value").notNull(),
    prevValue: real("prev_value"),
    asOf: text("as_of").notNull(),
    source: text("source").notNull().default("seed"),
    confidence: text("confidence").notNull().default("medium"),
  },
  (t) => [uniqueIndex("zip_signals_zip_key_idx").on(t.zip, t.signalKey)],
);

/** Investment score over time per ZIP. */
export const scoreHistory = sqliteTable(
  "score_history",
  {
    id: text("id").primaryKey(),
    zip: text("zip").notNull(),
    asOf: text("as_of").notNull(),
    score: integer("score").notNull(),
    completenessPct: integer("completeness_pct").notNull().default(100),
    preliminary: integer("preliminary", { mode: "boolean" }).default(false).notNull(),
  },
  (t) => [uniqueIndex("score_history_zip_asof_idx").on(t.zip, t.asOf)],
);

/** Seeded rival members so leaderboards read as a populated market. */
export const leaderboardMembers = sqliteTable("leaderboard_members", {
  id: text("id").primaryKey(),
  league: text("league").notNull(),
  name: text("name").notNull(),
  ticker: integer("ticker", { mode: "boolean" }).default(false).notNull(),
  anonymous: integer("anonymous", { mode: "boolean" }).default(false).notNull(),
  tier: text("tier").notNull(),
  seasonPp: integer("season_pp").notNull(),
  delta7d: integer("delta_7d").notNull(),
  rankDelta: integer("rank_delta").notNull(),
  season: text("season").notNull(),
});
