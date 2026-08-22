import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export * from "./auth-schema";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

// ─────────────────────────────────────────────────────────────
// EXISTING TABLES — DO NOT MODIFY
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// NEW TABLES — ported from Prisma schema
// ─────────────────────────────────────────────────────────────

/** Neighborhood profiles with demographics, market data, and scoring breakdown. */
export const neighborhoods = sqliteTable(
  "neighborhoods",
  {
    id: text("id").primaryKey(),
    zipCode: text("zip_code").notNull().unique(),
    city: text("city").notNull(),
    county: text("county"),
    state: text("state").notNull(),

    // Demographics
    population: integer("population"),
    medianIncome: integer("median_income"),
    employmentRate: real("employment_rate"),
    crimeScore: real("crime_score"),

    // Market data
    avgHomePrice: real("avg_home_price"),
    priceVelocity: real("price_velocity"),
    inventoryCount: integer("inventory_count"),
    permitCount: integer("permit_count"),

    // Scoring
    investmentScore: real("investment_score"),
    dataCompleteness: real("data_completeness"),
    scoreTier: text("scoreTier"),
    lastScoreUpdate: integer("last_score_update", { mode: "timestamp_ms" }),

    // Score breakdown
    growthScore: real("growth_score"),
    marketScore: real("market_score"),
    infrastructureScore: real("infrastructure_score"),
    qualityScore: real("quality_score"),
    economicScore: real("economic_score"),

    // 17-signal scoring inputs
    educationScore: real("education_score"),
    medianIncomeGrowth: real("median_income_growth"),
    rentGrowth: real("rent_growth"),
    businessGrowth: real("business_growth"),
    newConstructionRate: real("new_construction_rate"),
    publicInvestmentScore: real("public_investment_score"),
    permitGrowth: real("permit_growth"),

    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("neighborhoods_state_idx").on(t.state),
    index("neighborhoods_investment_score_idx").on(t.investmentScore),
    index("neighborhoods_crime_score_idx").on(t.crimeScore),
    index("neighborhoods_permit_count_idx").on(t.permitCount),
    index("neighborhoods_city_state_idx").on(t.city, t.state),
  ],
);

/** User saved search configurations. */
export const savedSearches = sqliteTable(
  "saved_searches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    criteria: text("criteria", { mode: "json" }).notNull(),
    alerts: integer("alerts", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("saved_searches_user_idx").on(t.userId)],
);

/** Renovation projects tracked per property. */
export const renovationProjects = sqliteTable(
  "renovation_projects",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id").notNull(),
    userId: text("user_id").notNull(),
    projectName: text("project_name").notNull(),
    projectType: text("project_type").notNull(),
    estimatedCost: real("estimated_cost").notNull(),
    projectedValueLift: real("projected_value_lift").notNull(),
    projectedROI: real("projected_roi").notNull(),
    timeline: text("timeline").notNull(),
    status: text("status").notNull().default("planned"),
    actualCost: real("actual_cost"),
    actualValueLift: real("actual_value_lift"),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("renovation_projects_property_idx").on(t.propertyId),
    index("renovation_projects_user_idx").on(t.userId),
    index("renovation_projects_status_idx").on(t.status),
  ],
);

/** Building permit records for a property. */
export const buildingPermits = sqliteTable(
  "building_permits",
  {
    id: text("id").primaryKey(),
    permitNumber: text("permit_number").notNull().unique(),
    propertyId: text("property_id"),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zipCode: text("zip_code").notNull(),
    permitType: text("permit_type").notNull(),
    description: text("description"),
    estimatedCost: real("estimated_cost"),
    issueDate: integer("issue_date", { mode: "timestamp_ms" }).notNull(),
    completionDate: integer("completion_date", { mode: "timestamp_ms" }),
    status: text("status").notNull(),
    contractorName: text("contractor_name"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("building_permits_property_idx").on(t.propertyId),
    index("building_permits_zip_idx").on(t.zipCode),
    index("building_permits_status_idx").on(t.status),
    index("building_permits_type_idx").on(t.permitType),
  ],
);

/** Comparable properties used for valuation analysis. */
export const comparableProperties = sqliteTable(
  "comparable_properties",
  {
    id: text("id").primaryKey(),
    subjectPropertyId: text("subject_property_id").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zipCode: text("zip_code").notNull(),
    soldPrice: real("sold_price").notNull(),
    soldDate: integer("sold_date", { mode: "timestamp_ms" }).notNull(),
    bedrooms: integer("bedrooms"),
    bathrooms: real("bathrooms"),
    squareFootage: integer("square_footage"),
    yearBuilt: integer("year_built"),
    propertyType: text("property_type"),
    daysOnMarket: integer("days_on_market"),
    pricePerSqFt: real("price_per_sqft").notNull(),
    distanceMiles: real("distance_miles").notNull(),
    similarityScore: real("similarity_score").notNull(),
    adjustedPrice: real("adjusted_price").notNull(),
    renovationsNoted: text("renovations_noted"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("comparable_properties_subject_idx").on(t.subjectPropertyId),
    index("comparable_properties_zip_idx").on(t.zipCode),
  ],
);

/** Contractor business profiles. */
export const contractorProfiles = sqliteTable(
  "contractor_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    businessName: text("business_name").notNull(),
    license: text("license"),
    insuranceVerified: integer("insurance_verified", { mode: "boolean" }).default(false).notNull(),
    specialties: text("specialties").notNull(),
    serviceRadius: integer("service_radius").notNull(),
    rating: real("rating").default(0),
    reviewCount: integer("review_count").default(0),
    completedProjects: integer("completed_projects").default(0),
    avgProjectCost: real("avg_project_cost"),
    avgTimeline: text("avg_timeline"),
    certifications: text("certifications"),
    portfolioImages: text("portfolio_images"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("contractor_profiles_user_idx").on(t.userId)],
);

/** Reviews left for contractor profiles. */
export const contractorReviews = sqliteTable(
  "contractor_reviews",
  {
    id: text("id").primaryKey(),
    contractorId: text("contractor_id").notNull(),
    userId: text("user_id").notNull(),
    rating: integer("rating").notNull(),
    projectType: text("project_type").notNull(),
    projectCost: real("project_cost"),
    comment: text("comment"),
    wouldRecommend: integer("would_recommend", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("contractor_reviews_contractor_idx").on(t.contractorId),
    index("contractor_reviews_user_idx").on(t.userId),
  ],
);

/** Granular neighborhood insights with forecasts. */
export const neighborhoodInsights = sqliteTable(
  "neighborhood_insights",
  {
    id: text("id").primaryKey(),
    neighborhoodId: text("neighborhood_id"),
    name: text("name").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zipCode: text("zip_code"),
    emergingScore: real("emerging_score").notNull(),
    growthSignals: text("growth_signals").notNull(),
    permitActivity: integer("permit_activity").notNull(),
    priceVelocity: real("price_velocity").notNull(),
    inventoryTrend: text("inventory_trend").notNull(),
    demographicShift: text("demographic_shift"),
    newBusinessCount: integer("new_business_count"),
    transitDevelopment: text("transit_development"),
    appreciationForecast6M: real("appreciation_forecast_6m"),
    appreciationForecast12M: real("appreciation_forecast_12m"),
    appreciationForecast18M: real("appreciation_forecast_18m"),
    confidenceScore: real("confidence_score"),
    dataDate: integer("data_date", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("neighborhood_insights_neighborhood_idx").on(t.neighborhoodId),
    index("neighborhood_insights_zip_idx").on(t.zipCode),
    index("neighborhood_insights_emerging_idx").on(t.emergingScore),
  ],
);

/** Improvement plans tied to a property and optional renovation project. */
export const improvementPlans = sqliteTable(
  "improvement_plans",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id").notNull(),
    renovationProjectId: text("renovation_project_id"),
    userId: text("user_id").notNull(),
    planName: text("plan_name").notNull(),
    improvements: text("improvements").notNull(),
    totalEstimatedCost: real("total_estimated_cost").notNull(),
    costRangeLow: real("cost_range_low").notNull(),
    costRangeHigh: real("cost_range_high").notNull(),
    projectedValueLift: real("projected_value_lift").notNull(),
    projectedAppraisalValue: real("projected_appraisal_value").notNull(),
    currentAppraisalValue: real("current_appraisal_value").notNull(),
    roi: real("roi").notNull(),
    timeline: text("timeline").notNull(),
    priority: text("priority").notNull(),
    reasoning: text("reasoning"),
    marketComparison: text("market_comparison"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("improvement_plans_property_idx").on(t.propertyId),
    index("improvement_plans_user_idx").on(t.userId),
    index("improvement_plans_project_idx").on(t.renovationProjectId),
  ],
);

/** User investment persona and behavior profile. */
export const userPersonas = sqliteTable(
  "user_personas",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    personaType: text("persona_type").notNull(),
    riskTolerance: text("risk_tolerance").notNull(),
    investmentStyle: text("investment_style").notNull(),
    budgetRange: text("budget_range").notNull(),
    preferredAreas: text("preferred_areas").notNull(),
    propertyTypes: text("property_types").notNull(),
    renovationTypes: text("renovation_types").notNull(),
    timeHorizon: text("time_horizon").notNull(),
    activityScore: real("activity_score").default(0).notNull(),
    preferences: text("preferences").notNull(),
    behaviorPatterns: text("behavior_patterns").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("user_personas_user_idx").on(t.userId)],
);

/** ZIP-level heatmap data with price changes, permit density, and forecasts. */
export const heatmaps = sqliteTable(
  "heatmaps",
  {
    id: text("id").primaryKey(),
    zipCode: text("zip_code").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    avgPrice: real("avg_price"),
    priceChange3M: real("price_change_3m"),
    priceChange6M: real("price_change_6m"),
    priceChange12M: real("price_change_12m"),
    permitDensity: real("permit_density"),
    renovationActivity: real("renovation_activity"),
    emergingScore: real("emerging_score"),
    investorActivity: real("investor_activity"),
    daysOnMarket: integer("days_on_market"),
    inventoryLevel: integer("inventory_level"),
    appreciationForecast: real("appreciation_forecast"),
    dataDate: integer("data_date", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    uniqueIndex("heatmaps_zip_date_idx").on(t.zipCode, t.dataDate),
    index("heatmaps_emerging_idx").on(t.emergingScore),
  ],
);

/** Predicted contractor availability by week. */
export const contractorAvailabilities = sqliteTable(
  "contractor_availabilities",
  {
    id: text("id").primaryKey(),
    contractorId: text("contractor_id").notNull(),
    weekStart: integer("week_start", { mode: "timestamp_ms" }).notNull(),
    availabilityScore: real("availability_score").notNull(),
    currentWorkload: integer("current_workload").notNull(),
    seasonalFactor: real("seasonal_factor").notNull(),
    weatherImpact: real("weather_impact").notNull(),
    permitQueueDepth: integer("permit_queue_depth").notNull(),
    predictedStartDate: integer("predicted_start_date", { mode: "timestamp_ms" }).notNull(),
    confidenceLevel: text("confidence_level").notNull(),
    factors: text("factors", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    uniqueIndex("contractor_avail_contractor_week_idx").on(t.contractorId, t.weekStart),
    index("contractor_avail_week_idx").on(t.weekStart),
  ],
);

/** Realtor engagement tracking per user-property interaction. */
export const realtorEngagements = sqliteTable(
  "realtor_engagements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id"),
    sessionDuration: integer("session_duration").notNull(),
    pageViews: integer("page_views").notNull(),
    calculatorUses: integer("calculator_uses").default(0).notNull(),
    savedProperties: integer("saved_properties").default(0).notNull(),
    contactRequests: integer("contact_requests").default(0).notNull(),
    documentDownloads: integer("document_downloads").default(0).notNull(),
    returnVisits: integer("return_visits").default(0).notNull(),
    lastEngagement: integer("last_engagement", { mode: "timestamp_ms" }).default(now).notNull(),
    engagementScore: real("engagement_score").default(0).notNull(),
    conversionProbability: real("conversion_probability").default(0).notNull(),
    predictedConversionDate: integer("predicted_conversion_date", { mode: "timestamp_ms" }),
    conversionStage: text("conversion_stage").default("awareness").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("realtor_engagements_user_idx").on(t.userId),
    index("realtor_engagements_property_idx").on(t.propertyId),
    index("realtor_engagements_stage_idx").on(t.conversionStage),
  ],
);

/** Investor-ready badge for a property with scoring and metrics. */
export const investorReadyBadges = sqliteTable(
  "investor_ready_badges",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id").notNull().unique(),
    overallScore: real("overall_score").notNull(),
    cashFlowScore: real("cash_flow_score").notNull(),
    appreciationScore: real("appreciation_score").notNull(),
    rentalDemandScore: real("rental_demand_score").notNull(),
    badgeLevel: text("badge_level").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    reasoning: text("reasoning").notNull(),
    metrics: text("metrics").notNull(),
    projectedCashFlow: real("projected_cash_flow").notNull(),
    projectedAppreciation: real("projected_appreciation").notNull(),
    occupancyRate: real("occupancy_rate"),
    capRate: real("cap_rate"),
    cashOnCashReturn: real("cash_on_cash_return"),
    qualifyingFactors: text("qualifying_factors").notNull(),
    awardedAt: integer("awarded_at", { mode: "timestamp_ms" }).default(now).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("investor_badges_property_idx").on(t.propertyId),
    index("investor_badges_level_idx").on(t.badgeLevel),
    index("investor_badges_active_idx").on(t.isActive),
  ],
);

/** Portfolio stress test runs with scenario results. */
export const portfolioStressTests = sqliteTable(
  "portfolio_stress_tests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    testName: text("test_name").notNull(),
    portfolioSnapshot: text("portfolio_snapshot", { mode: "json" }).notNull(),
    baselineMetrics: text("baseline_metrics", { mode: "json" }).notNull(),
    scenarios: text("scenarios", { mode: "json" }).notNull(),
    results: text("results", { mode: "json" }).notNull(),
    interestRateShock: real("interest_rate_shock"),
    rentShock: real("rent_shock"),
    vacancyShock: real("vacancy_shock"),
    propertyValueShock: real("property_value_shock"),
    overallRiskScore: real("overall_risk_score").notNull(),
    recommendations: text("recommendations", { mode: "json" }).notNull(),
    testDate: integer("test_date", { mode: "timestamp_ms" }).default(now).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("portfolio_stress_user_idx").on(t.userId),
    index("portfolio_stress_date_idx").on(t.testDate),
  ],
);

/** Market alerts pushed to users based on thresholds. */
export const marketAlerts = sqliteTable(
  "market_alerts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    alertType: text("alert_type").notNull(),
    severity: text("severity").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    thresholdType: text("threshold_type").notNull(),
    thresholdValue: real("threshold_value").notNull(),
    currentValue: real("current_value").notNull(),
    percentageChange: real("percentage_change"),
    zipCode: text("zip_code"),
    neighborhood: text("neighborhood"),
    propertyId: text("property_id"),
    isRead: integer("is_read", { mode: "boolean" }).default(false).notNull(),
    isDismissed: integer("is_dismissed", { mode: "boolean" }).default(false).notNull(),
    actionUrl: text("action_url"),
    metadata: text("metadata", { mode: "json" }),
    triggeredAt: integer("triggered_at", { mode: "timestamp_ms" }).default(now).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("market_alerts_user_idx").on(t.userId),
    index("market_alerts_read_idx").on(t.isRead),
    index("market_alerts_severity_idx").on(t.severity),
    index("market_alerts_type_idx").on(t.alertType),
    index("market_alerts_triggered_idx").on(t.triggeredAt),
  ],
);

/** User alert notification preferences and thresholds. */
export const userAlertSettings = sqliteTable(
  "user_alert_settings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    enablePriceAlerts: integer("enable_price_alerts", { mode: "boolean" }).default(true).notNull(),
    priceChangeThreshold: real("price_change_threshold").default(5.0).notNull(),
    enableInventoryAlerts: integer("enable_inventory_alerts", { mode: "boolean" }).default(true).notNull(),
    inventoryChangeThreshold: real("inventory_change_threshold").default(15.0).notNull(),
    enablePermitAlerts: integer("enable_permit_alerts", { mode: "boolean" }).default(true).notNull(),
    permitSurgeThreshold: integer("permit_surge_threshold").default(10).notNull(),
    enableAppreciationAlerts: integer("enable_appreciation_alerts", { mode: "boolean" }).default(true).notNull(),
    appreciationThreshold: real("appreciation_threshold").default(8.0).notNull(),
    enableOpportunityAlerts: integer("enable_opportunity_alerts", { mode: "boolean" }).default(true).notNull(),
    opportunityScoreThreshold: real("opportunity_score_threshold").default(75.0).notNull(),
    watchedZipCodes: text("watched_zip_codes", { mode: "json" }).notNull(),
    watchedNeighborhoods: text("watched_neighborhoods", { mode: "json" }).notNull(),
    watchedProperties: text("watched_properties", { mode: "json" }).notNull(),
    notificationMethod: text("notification_method").default("in-app").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("user_alert_settings_user_idx").on(t.userId)],
);

/** User-defined market alert configurations with filters and frequency. */
export const userAlertConfigs = sqliteTable(
  "user_alert_configs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    zipCodes: text("zip_codes", { mode: "json" }),
    cities: text("cities", { mode: "json" }),
    states: text("states", { mode: "json" }),
    investmentScoreMin: real("investment_score_min"),
    priceVelocityMin: real("price_velocity_min"),
    inventoryMax: integer("inventory_max"),
    priceDropMin: real("price_drop_min"),
    frequency: text("frequency").default("DAILY").notNull(),
    active: integer("active", { mode: "boolean" }).default(true).notNull(),
    lastTriggered: integer("last_triggered", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("user_alert_configs_user_idx").on(t.userId),
    index("user_alert_configs_active_idx").on(t.active),
    index("user_alert_configs_type_idx").on(t.type),
  ],
);

/** Triggered instances of user-defined alert configurations. */
export const userAlertNotifications = sqliteTable(
  "user_alert_notifications",
  {
    id: text("id").primaryKey(),
    alertId: text("alert_id").notNull(),
    triggered: integer("triggered", { mode: "timestamp_ms" }).default(now).notNull(),
    conditions: text("conditions", { mode: "json" }),
    properties: text("properties", { mode: "json" }),
    read: integer("read", { mode: "boolean" }).default(false).notNull(),
  },
  (t) => [
    index("user_alert_notifications_alert_idx").on(t.alertId),
    index("user_alert_notifications_read_idx").on(t.read),
    index("user_alert_notifications_triggered_idx").on(t.triggered),
  ],
);

/** Import log tracking for MLS data and other ETL jobs. */
export const importLogs = sqliteTable(
  "import_logs",
  {
    id: text("id").primaryKey(),
    status: text("status").notNull(),
    source: text("source"),
    startTime: integer("start_time", { mode: "timestamp_ms" }).notNull(),
    endTime: integer("end_time", { mode: "timestamp_ms" }),
    duration: integer("duration"),
    propertiesFetched: integer("properties_fetched").default(0).notNull(),
    propertiesInserted: integer("properties_inserted").default(0).notNull(),
    propertiesUpdated: integer("properties_updated").default(0).notNull(),
    propertiesFailed: integer("properties_failed").default(0).notNull(),
    errorMessage: text("error_message"),
    details: text("details", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("import_logs_start_idx").on(t.startTime),
    index("import_logs_status_idx").on(t.status),
    index("import_logs_source_idx").on(t.source),
  ],
);

/** XP events — append-only ledger for gamification points. */
export const xpEvents = sqliteTable(
  "xp_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    league: text("league").notNull(),
    actionType: text("action_type").notNull(),
    points: integer("points").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    meta: text("meta", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    uniqueIndex("xp_events_user_dedupe_idx").on(t.userId, t.dedupeKey),
    index("xp_events_user_date_idx").on(t.userId, t.createdAt),
    index("xp_events_league_date_idx").on(t.league, t.createdAt),
    index("xp_events_action_date_idx").on(t.actionType, t.createdAt),
  ],
);

/** User game profile — level, streaks, display preferences. */
export const userGameProfiles = sqliteTable(
  "user_game_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    league: text("league").notNull(),
    lifetimeXp: integer("lifetime_xp").default(0).notNull(),
    seasonXp: integer("season_xp").default(0).notNull(),
    seasonKey: text("season_key").default("").notNull(),
    level: integer("level").default(1).notNull(),
    tierKey: text("tier_key").default("T1").notNull(),
    ticker: text("ticker").unique(),
    displayMode: text("display_mode").default("ANON").notNull(),
    showOnLeaderboard: integer("show_on_leaderboard", { mode: "boolean" }).default(true).notNull(),
    currentStreak: integer("current_streak").default(0).notNull(),
    longestStreak: integer("longest_streak").default(0).notNull(),
    lastActivityDate: integer("last_activity_date", { mode: "timestamp_ms" }),
    streakFreezes: integer("streak_freezes").default(1).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [index("user_game_profiles_league_xp_idx").on(t.league, t.seasonXp)],
);

/** Badge awards — which user earned which badge and when. */
export const userBadgeAwards = sqliteTable(
  "user_badge_awards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    badgeId: text("badge_id").notNull(),
    tier: text("tier").notNull(),
    seasonKey: text("season_key"),
    awardedAt: integer("awarded_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    uniqueIndex("user_badge_awards_user_badge_idx").on(t.userId, t.badgeId),
    index("user_badge_awards_user_idx").on(t.userId),
  ],
);

/** Nightly league standings — powers rank deltas and sparklines. */
export const leagueSnapshots = sqliteTable(
  "league_snapshots",
  {
    id: text("id").primaryKey(),
    league: text("league").notNull(),
    snapshotDate: integer("snapshot_date", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id").notNull(),
    rank: integer("rank").notNull(),
    seasonXp: integer("season_xp").notNull(),
    xpToday: integer("xp_today").notNull(),
    xp7d: integer("xp_7d").notNull(),
    rankDelta: integer("rank_delta").default(0).notNull(),
  },
  (t) => [
    uniqueIndex("league_snap_league_date_user_idx").on(t.league, t.snapshotDate, t.userId),
    index("league_snap_league_date_rank_idx").on(t.league, t.snapshotDate, t.rank),
    index("league_snap_user_date_idx").on(t.userId, t.snapshotDate),
  ],
);

/** Purchased leads — tracks lead purchases by realtors. */
export const purchasedLeads = sqliteTable(
  "purchased_leads",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id").notNull(),
    leadType: text("lead_type").default("PROPERTY").notNull(),
    buyerId: text("buyer_id").notNull(),
    sellerId: text("seller_id"),
    pricePaid: real("price_paid").notNull(),
    stripePaymentId: text("stripe_payment_id"),
    stripeSessionId: text("stripe_session_id"),
    status: text("status").default("PURCHASED").notNull(),
    exclusivity: text("exclusivity").notNull(),
    tier: text("tier").notNull(),
    leadData: text("lead_data", { mode: "json" }),
    notes: text("notes"),
    contactedAt: integer("contacted_at", { mode: "timestamp_ms" }),
    qualifiedAt: integer("qualified_at", { mode: "timestamp_ms" }),
    closedAt: integer("closed_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (t) => [
    index("purchased_leads_buyer_idx").on(t.buyerId),
    index("purchased_leads_lead_idx").on(t.leadId),
    index("purchased_leads_status_idx").on(t.status),
    index("purchased_leads_date_idx").on(t.createdAt),
    index("purchased_leads_stripe_idx").on(t.stripePaymentId),
  ],
);
