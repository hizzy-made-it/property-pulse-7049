# PropertyPulse — Mobile Pivot to Position Book + API Seam

Plan for approval. Nothing below is built yet.

---

## 1. What the eight documents actually change

I read all eight. Most of it confirms what's already built. Four things are new and material.

### 1.1 The real scoring model exists — and it supersedes the prototype math

`SCORING_SIGNALS_AND_ACCURACY` specifies a **17-signal, 5-category weighted model**, not the ad-hoc
score the prototype used:

| Category | Weight | Signals |
|---|---|---|
| Growth Indicators | 35% | Population growth 10 · Job growth 10 · Median income growth 10 · Education attainment 5 |
| Housing Market Dynamics | 25% | Price velocity 10 · Inventory months 5 · Rent growth 5 · Price-to-income 5 |
| Infrastructure Development | 20% | Building permits 10 · New construction rate 5 · Public investment 5 |
| Quality of Life | 15% | Crime safety 8 · School quality 4 · Walkability 3 |
| Economic Fundamentals | 5% | Employment rate 3 · Business growth 2 |

Plus mechanics the current build has none of:
- **Banded scoring curves** per signal (not linear) — e.g. price velocity peaks at 5–15% and *drops* above 15% as bubble risk.
- **Missing-data handling:** skip the factor, redistribute its weight proportionally *within its category*, track a **data-completeness %**, and flag any score under 70% completeness as **PRELIMINARY**.
- **Score tiers:** 85+ Excellent · 70–84 Very Good · 55–69 Good · 40–54 Fair · 0–39 Poor.
- **Comps similarity formula:** `100 − (bedΔ×10) − (bathΔ×15) − (sqftΔ%×100) − (typeMismatch×20) − (milesOver2×5) − (monthsOver3×2)`, with confidence levels (High ≥10 comps >70% · Medium 5–9 >60% · Low 1–4 · None 0).
- **Alert validation gates:** hot-market alerts need score ≥85; sustainable-growth alerts need velocity 5–15%; tight-market needs inventory <3mo; value-opportunity needs a ≥10% price drop. Frequency locks: 24h / 7d / 30d.
- **Data freshness thresholds** per source (demographics 18mo, MLS 60d, crime 6mo, schools 18mo, BLS 6mo) — which is exactly the metadata the Connections screen should surface.
- **Score history** so a ZIP can say "72 → 78 over 6 months". This is a chartable series we currently don't store.

Doc benchmarks: 32 neighborhoods, 2,847 properties, quality score 96/100, top ZIPs Winter Park 32789 (91.2), Lake Nona 32827 (89.7), Celebration 34747 (86.3). Our seed has 12 ZIPs and 12 properties, and does not include 32789/32827/34747 as scored leaders.

### 1.2 There is a second, separate scoring system: lead intent

The gap analysis specifies a **behavioural lead-qualification engine**, distinct from PulsePoints:

| Signal | Points |
|---|---|
| Property save | +15 |
| Market analysis run | +10 |
| Recurring searches | +20 |
| Alert creation | +25 |
| Contact request | +40 |
| Premium subscription | +30 |
| Document upload | +35 |

**Threshold: 60+ points within 30 days** = a qualified lead. Lead quality tiers 1–5 map onto the
investment-score bands. This is the mechanism that *creates* the leads the marketplace sells — right
now our leads are purely seeded.

### 1.3 Lead pricing in the docs contradicts your locked pricing

| | Docs | Currently built (your instruction) |
|---|---|---|
| Realtor leads | Exclusive $150–200 · Semi $75–120 · Shared $30–50 | flat "from $500" |
| Contractor leads | Exclusive $100–250 · Semi $50–120 · Shared $30–60 | flat $500 |
| Subscriptions | Basic $10 · Premium $29 · Professional $99 · Enterprise $299 | OBSERVER $0 · INVESTOR $99 · DESK $299 |

The financial model is built on those lower numbers (investor ARPU $1,980/yr ≈ $165/mo blended,
realtor ARPU $3,960/yr, contractor $1,320/yr; 5-yr revenue $47.7M; LTV:CAC 10.4:1).

**I have changed nothing here.** See question Q1 at the bottom.

### 1.4 AI-first strategy = five features that are not in scope yet

`AI_First_Strategy` proposes: Intent-Aware Research Accelerator, Behavioral Intent Decoder,
Predictive Renovation Opportunity Engine, Adaptive Onboarding Engine, Self-Healing Data Pipeline.
The Behavioral Intent Decoder is just §1.2 with an ML layer on top. I am **not** building these in
this round — flagging so you know I read them and deliberately deferred.

### 1.5 What the docs confirm rather than change

- **Portfolio tracking is a real roadmap item** ("Monitor owned properties and overall portfolio performance", Professional tier) — your mobile pivot is on-plan, not a detour.
- Mobile app is listed as Phase 9 / months 19–24 in the doc roadmap. You're pulling it forward. Fine, but it means mobile is a demo surface ahead of the data, which is exactly why the provider seam matters.
- The docs describe a Next.js codebase with Mapbox GL and Stripe. We're on the Runable managed stack. **Ignoring all stack references** as previously agreed.

---

## 1.6 DECISIONS (locked, from your answers — 22 Aug)

| Question | Your call |
|---|---|
| Navigation | **4 tabs + a More sheet** holding Search, Watchlist, Connections (§2 rewritten) |
| Pricing | **(c)** Keep $99/$299, add Basic $10 + Premium $29 beneath, leads move to three-band exclusive/semi/shared |
| Scoring engine | **Swap the 17-signal model in now** |
| Bids | Attach to the 4 seeded `projects` where one exists, free-standing otherwise |
| Lead-intent engine | **Deferred** to a follow-up round |
| Signals | **Max them out** — surface where a property is gaining off metrics people are too lazy to monitor (§2A, new) |

---

## 2A. Signals, maxed out — two scores, not one

You want the metrics nobody watches. The mistake would be to bolt them onto the 17-signal model and
inflate it to 40 weighted inputs — that destroys the auditability your accuracy doc is built on, and
it buries the interesting signals under the boring ones. So: **two scores, side by side.**

### Score 1 — INVESTMENT SCORE (0–100), unchanged from your methodology doc

The 17 signals, 5 categories, published weights, banded curves, completeness %, PRELIMINARY flag.
This is the defensible, explainable number. It matches what you've already documented to investors.
Untouched.

### Score 2 — EDGE SCORE (0–100), new — the lazy-to-monitor layer

**23 leading indicators across 5 categories**, chosen because each one (a) moves *before* price does,
(b) is publicly obtainable, and (c) is a genuine pain to track manually, which is exactly why it's
still alpha. Every signal carries a **lead time** — how far ahead of the price move it fires.

**Transaction Micro-structure — 30%** *(shortest lead, highest reliability)*

| Signal | Lead | Why it's ignored |
|---|---|---|
| DOM **acceleration** (2nd derivative, not the level) | 1–3 mo | Everyone quotes median DOM; nobody differentiates it |
| Price-cut frequency + median cut depth | 1–2 mo | Requires listing-history diffing, not a headline stat |
| Pending-to-active ratio | 1.5 mo | Turns ~45 days before closed-price indices |
| Withdrawal / relist rate | 2–4 mo | Pure seller-conviction tell, published nowhere |
| Cash-purchase share | 3–6 mo | Institutional footprint, buried in deed records |
| Absentee / out-of-state buyer share | 3–9 mo | Needs mailing-address vs. situs-address comparison |

**Supply Pipeline Pressure — 20%**

| Signal | Lead | Why it's ignored |
|---|---|---|
| Permit **mix shift** — reno/ADU vs. new-build ratio | 9–18 mo | Gentrification precursor; needs permit-type classification |
| Commercial permit adjacency within 1 mile | 12–24 mo | Amenity arrival; nobody joins commercial to residential geo |
| Permit-to-completion cycle time | 6–12 mo | Municipal friction — predicts when supply actually lands |
| Utility hookups / new water-meter installs | 6–12 mo | Ground truth for occupancy growth, beats Census by a year |

**Carry-Cost Risk — 20%** *(Florida-specific, and where cash flow quietly dies)*

| Signal | Lead | Why it's ignored |
|---|---|---|
| Insurance premium trajectory | 3–12 mo | The #1 killer of FL cash flow, modelled by almost no one |
| Roof-age distribution | 6–18 mo | FL insurers refuse 15yr+ roofs → forced-sale supply |
| Assessed-to-market gap (reassessment lag) | 12 mo | Predicts the tax shock after purchase |
| HOA / **CDD** fee escalation | 6–12 mo | Central Florida CDD debt is brutal and rarely priced in |
| Flood / wind zone reclassification risk | 6–24 mo | FEMA map amendments repriced overnight |

**Demand Migration — 20%**

| Signal | Lead | Why it's ignored |
|---|---|---|
| USPS change-of-address + IRS county migration flows | 6–12 mo | Free data, awful format |
| Large-employer announcements in the commute shed | 12–24 mo | Requires news/permit correlation, not a feed |
| **School rezoning proposals** | 3–9 mo | Boundary changes move prices fast; buried in board agendas |
| Transit / road project **let dates** (SunRail, I-4, Brightline) | 12–36 mo | Everyone reacts to the announcement; the let date is the real trigger |

**Yield & Distress — 10%**

| Signal | Lead | Why it's ignored |
|---|---|---|
| Rent-to-price spread vs. metro median | 3–9 mo | Yield compression = capital inflow already underway |
| Rental concession prevalence (free-month offers) | 1–3 mo | Softens before any rent index moves |
| STR ADR + occupancy trend, and regulatory risk | 3–12 mo | Orlando-critical, changes with one ordinance |
| Pre-foreclosure / foreclosure filing trend | 6–12 mo | The distress-supply pipeline |
| Vacancy proxy (mail-return + idle utility rate) | 3–6 mo | Real vacancy, not the survey estimate |

### How it surfaces in the product

- **Two plates side by side** on every ZIP and property: `INVESTMENT 78` and `EDGE 91`, each with its tier word. Divergence is the whole point — a 62/94 is "boring on paper, moving underneath", which is the product's actual pitch.
- **A "WHY IT'S MOVING" list**: the top 5 contributing edge signals, each as a row — signal name, current value, direction glyph, lead time, and a one-line *why this matters*. That is the answer to "where is this property gaining".
- **Lead-time band** on the EDGE plate: `SIGNALS LEAD 3–9 MO`, computed as the weighted lead of its contributing signals.
- **Every signal states its provider and freshness.** Unconnected providers mean that signal is absent, its weight redistributes within its category, and completeness drops — so the Connections screen visibly *raises the resolution of the scores* as keys get added. That's the strongest possible argument for connecting a key, and it's honest.
- `edgeHistory` charted next to `scoreHistory`, so you can see edge diverge from investment before price follows.

Storage: `zipSignals` widens to hold all 40 signals (17 core + 23 edge) with a per-signal
`asOf`, `source` and `confidence`; `signalDefs` (seeded, static) holds each signal's label, category,
weight, lead-time band, unit, direction-is-good flag, provider key, and the "why nobody tracks it"
copy — so the UI is data-driven and adding signal #41 is a seed row, not a refactor.

Seeded honestly: all 40 signals get plausible Central Florida values for the 12 ZIPs, with three
ZIPs deliberately built as **divergence cases** (low investment / high edge) so the feature
demonstrates itself in a demo.

---

## 2. Navigation: 4 tabs + More sheet (your choice)

Your call: **4 tabs + a More sheet holding Search, Watchlist, Connections.** Building that.

**Tab bar — 4 destinations + More (5 bar slots, 86dp each at 430dp):**

| Slot | Icon | Content |
|---|---|---|
| **Portfolio** | grid | Aggregate: total value, equity, monthly cash flow, 12-month value line chart with touch scrub, allocation bars, PulsePoints strip, signal feed. |
| **Positions** | layers | Your holdings. Rows with value, cost basis, delta, INVESTMENT + EDGE plates. → position detail. |
| **Bids** | hammer | Bids submitted as a contractor. Segmented **OPEN / WON / LOST**, win-rate figure, bid-vs-award chart. |
| **Board** | trophy | Existing PP-10 season board, unchanged. |
| **More** | ellipsis | Opens a sheet (§2.1). |

**2.1 The More sheet** — a `Blueprint`-framed modal sheet, not a nav dump. Full-width 44dp rows,
each with icon + label + a one-line value readout so the sheet is informative, not just a menu:

| Row | Readout | Route |
|---|---|---|
| Search | `12 MARKETS · 12 LISTINGS` | `/search` (existing PP-03) |
| Watchlist | `6 SAVED · 4 ZIPS WATCHED` | `/watchlist` (new — saved properties + watched ZIPs, segmented) |
| Connections | `3 OF 8 CONNECTED` | `/settings/connections` |
| Market Map | `HEAT GRID · 12 ZIPS` | `/market-map` |
| ROI Calculator | `—` | `/roi` |
| Settings | account + theme + sign out | `/settings` |

**One mitigation I'm applying without asking:** burying Search costs discovery, so Portfolio and
Positions each get a 44dp search icon in their AppBar that routes straight to `/search`. Search stays
one tap away from the two screens you'll actually live on, and the More sheet keeps it findable. Say
the word if you'd rather it be strictly sheet-only.

The current Desk tab (PP-05) is absorbed into Portfolio — its PulsePoints hero, milestones, badges
and signal feed move there; its saved-positions list becomes Watchlist. Nothing is lost.

---

## 3. Database — new tables

Current schema has 18 tables and **no** portfolio, holdings, valuation-history, bids, or provider
tables. Adding:

| Table | Purpose | Key columns |
|---|---|---|
| `holdings` | A position the user owns | userId, propertyId (nullable — allows manual off-platform entries), label, city, zip, acquiredAt, purchasePrice, currentValue, loanBalance, rate, monthlyRent, monthlyExpenses, status (`held`/`sold`), soldAt, soldPrice |
| `valuationHistory` | The rises and falls — chartable series | subjectType (`holding`/`property`/`zip`), subjectId, asOf, value, source (`seed`/provider key) |
| `bids` | Bids submitted as a contractor | userId, propertyId (nullable), projectId (nullable), label, scope, amount, submittedAt, decidedAt, status (`draft`/`submitted`/`shortlisted`/`won`/`lost`), awardedAmount, competitorCount, marginPct |
| `providerConnections` | Per-provider sync metadata | provider, label, category, lastSyncAt, lastSyncStatus, recordCount, notes. **No secrets** — keys stay in root `.env`; `connected` is derived server-side from key presence. |
| `signalDefs` | **Static registry of all 40 signals** — makes the UI data-driven | key, label, category, score (`investment`/`edge`), weight, unit, leadMonthsLow, leadMonthsHigh, higherIsBetter, providerKey, whyIgnored (the "nobody tracks this" line), curve (JSON bands) |
| `zipSignals` | Per-ZIP signal readings | zipId, signalKey, value, asOf, source, confidence — **long format**, one row per signal, so signal #41 is a seed row not a migration |
| `scoreHistory` | Both scores over time per ZIP | zipId, asOf, investmentScore, edgeScore, completenessPct, preliminary |

`leadIntentEvents` **dropped from this round** — lead-intent engine deferred per your answer.

Seed additions: **6 holdings** for the test account (mix of held + one sold, across our 12
properties), **24 months of `valuationHistory`** per holding and per ZIP with realistic
non-monotonic movement — some positions must be *down*, or the "rises and falls" framing is a lie —
**9 bids** attached to the 4 seeded projects where one exists and free-standing otherwise, across
open/won/lost, all 8 provider rows, **40 signal definitions**, **480 signal readings** (40 × 12
ZIPs), and 12 months of `scoreHistory` per ZIP.

**Pricing changes (your answer c):** `subscriptions` plan enum widens to
`observer` $0 / `basic` $10 / `premium` $29 / `investor` $99 / `desk` $299. `leads` gains
`exclusivity` (`exclusive`/`semi`/`shared`) and per-band pricing — realtor $150–200 / $75–120 /
$30–50, contractor $100–250 / $50–120 / $30–60. Web `pricing.tsx` and `marketplace.tsx` update to
match; five tiers still fit the blueprint frame as a 2+3 grid on web and a vertical stack on mobile.

New route files, each exporting its bare feature name (konsistent requirement):
`portfolio.ts`, `positions.ts`, `bids.ts`, `providers.ts`. Plus rewriting `properties.ts` scoring
calls to go through a new `lib/scoring.ts` implementing §1.1.

---

## 4. Provider adapter layer — all 8 sources, key-ready

`packages/web/src/api/providers/` — one module per source behind one interface:

```
types.ts      ProviderAdapter { key, label, category, envVars[], docsUrl,
                                connected(): boolean, freshness: {updateEvery, staleAfter},
                                fetch*(...): Promise<T>  // falls back to seeded data
                              }
index.ts      registry (composition only)
attom.ts      ATTOM Data      — property/AVM/tax     ATTOM_API_KEY
bridge.ts     Zillow/Bridge   — listings, rent       BRIDGE_API_KEY
realtor.ts    Realtor/RapidAPI— listings, DOM        RAPIDAPI_KEY
mapbox.ts     Mapbox          — choropleth tiles     MAPBOX_TOKEN
plaid.ts      Plaid           — cash, mortgage bal.  PLAID_CLIENT_ID / PLAID_SECRET
accounting.ts QuickBooks/Xero — project P&L          QBO_CLIENT_ID / XERO_CLIENT_ID
fred.ts       FRED            — rates, macro         FRED_API_KEY
rentcast.ts   RentCast        — rent comps           RENTCAST_API_KEY
```

Rules I'll hold to:
- All vars go in the **single root `.env`**, absent by default. Absent = `connected: false`.
- **Keys never reach the client.** `providers.list` returns `{key,label,category,connected,lastSyncAt,freshness,staleFor}` and nothing else.
- Every screen renders from seeded data today. Adding a key swaps the source **without touching a screen**.
- Each adapter maps provider fields onto the 17 signals in §1.1, so connecting ATTOM raises data completeness and can flip a ZIP out of PRELIMINARY.
- Mapbox plugs into the existing `heat-grid.tsx` seam, as agreed.

Connections screen (mobile + web): a row per provider — name, category, what it feeds, CONNECTED /
NOT CONNECTED as a hairline-framed tag, last sync, staleness against the doc's freshness thresholds,
and the env var name to set. No key input field in the UI — that's a server-side deploy concern and
putting a paste box in the app is a security mistake.

---

## 5. Charts — victory-native + Skia, no red, no green

Install in one command before Metro restarts:
`bunx expo install victory-native @shopify/react-native-skia react-native-reanimated react-native-gesture-handler`

**Risk I'm flagging up front:** the dashboard previews mobile through react-native-web, and Skia on
web needs CanvasKit/WASM. If it doesn't render in the preview I fall back to `react-native-svg`
charts and tell you — I won't ship a white screen.

Chart inventory (8 total, no screen gets more than two):

| Screen | Chart | Type |
|---|---|---|
| Portfolio | 12-month portfolio value, touch-scrub with a readout | line + area |
| Portfolio | Allocation by city | horizontal hairline bars |
| Position detail | Value history vs. cost basis | line + dashed reference line |
| Position detail | Monthly cash flow, 12 mo | thin columns |
| Bids | Bid amount vs. award amount | paired columns |
| Bids | Win rate over time | line |
| ZIP / property | **INVESTMENT vs. EDGE, 12 mo — the divergence chart** | 2-series line, edge dashed |
| ZIP / property | Top edge-signal contributions | horizontal hairline bars, signed |

The divergence chart is the money shot of the whole signals feature: two lines, and the gap between
them is "what the market hasn't priced yet." It's the one place I'll allow 2 series.

**The colour constraint, stated explicitly because this is where it breaks:** a falling line is
**not red**. Direction is carried by (a) a `▼` glyph, (b) the numeric delta in text, (c) line
treatment — rises solid accent, falls the same accent as a dashed stroke with no area fill. The only
tonal variation available is the accent ramp (`accentQuiet` → `accent` → `primary`) plus neutrals.
No red, no green, no amber, anywhere, including inside chart internals and tooltips.

---

## 6. "Better rules" — the rulebook + the web backport

You said: *"size restrictions and tightness on mobile. ensure to implement additions for mobile into
web app too."* Two deliverables.

**(a) `mobile-rules.md` at the app root** — the existing informal contract in `constants/layout.ts`
written down and extended, so it's enforceable in review:

- Ceilings: content column 430dp max, centred with hairline rails beyond it; gutter 20; tab bar 56+inset, capped to the column.
- Floors: body text ≥15, secondary ≥13, uppercase micro 10–11 *only* when letter-spaced; touch targets ≥44dp with 8dp hit-slop; primary buttons ≥48dp.
- Media: card 16:10, hero 4:3, thumb 1:1. No full-bleed banner strips.
- **Charts (new):** height 160–200 for a primary chart, 110–140 inline; **max 2 series**; **max 2 charts per screen**; ≤4 x-axis labels; ≤3 gridline hairlines; no legend above 2 items; every chart must state its value in text as well as in pixels.
- Density: max 3 stats per `StatRow`; filter chips scroll horizontally, never wrap; max 2 tags per row on cards; section spacing 28.
- Every screen keeps its `PP-NN · SECTION` kicker and the `SAME INPUTS · SAME SCORES` footer.

**(b) Web gets the same features and the same discipline:**
- New pages: `/portfolio`, `/positions`, `/positions/:id`, `/bids`, `/settings/connections` (+ `queries/` files for each).
- A written web container/density contract in `design.md`: max content 1200 with a 720 reading column for prose, the same type floors, the same chart limits, the same 3-stat rule, hairline rules instead of card fills.
- Charts on web reuse the same series shapes from the same routes — one source of truth, two renderers.

---

## 7. Build order

1. Deps + Skia web-render smoke test (fail fast).
2. Schema: 8 tables → `db:push` → extend `seed.ts` (40 signal defs, 480 readings, 24mo history non-monotonic, 3 divergence ZIPs).
3. `lib/scoring.ts` — investment score: 17 signals, banded curves, weight redistribution, completeness, tiers. `lib/edge.ts` — edge score: 23 signals, 5 categories, weighted lead-time band, top-contribution ranking. `lib/comps.ts` — similarity + confidence.
4. Providers: `types.ts` + 8 adapters + registry + `providers.ts` route, each mapping to its signal keys.
5. Routes: `portfolio`, `positions`, `bids`, `signals` (+ both scores wired into `properties`/`zips`), pricing/lead-band updates in `billing`/`leads`.
6. Mobile: chart primitives into `components/blueprint.tsx`, `(tabs)/_layout.tsx` → 4 tabs + More, More sheet, then Portfolio / Positions / Bids / Watchlist / Connections / position detail / signals detail.
7. `mobile-rules.md`, then the density pass across the 4 existing mobile screens.
8. Web backport: `/portfolio`, `/positions`, `/positions/:id`, `/bids`, `/watchlist`, `/settings/connections`, signals panel on `property`/`market-map`, five-tier `pricing`, three-band `marketplace` + queries + density pass.
9. Verify: mobile typecheck, root `bun run lint`, root `bun run build`, then every new screen smoked in-browser at **1024 and 390** with the error-capture hook, screenshots reviewed.
10. Update `design.md` + `task.md`. Re-deliver mobile (index 0) + web.

This is a large round — 8 tables, 40 signals, 8 adapters, 7 mobile screens, 6 web pages. I'll build
it in the order above and deliver once it's all green rather than half-shipping.

Not touching GitHub — you said "nothing yet".

---

## 8. Open items

All six questions from the first round are answered and locked in §1.6. Two things left:

**A — Confirm the 23 edge signals (§2A).** That list is my proposal, not from your documents. If any
signal is dead weight, or you know one I've missed that you personally watch, say so now — it's a
seed row plus an adapter mapping later, but it's cheapest to get right before I write `lib/edge.ts`.

**B — Deferred, on the record, so nothing is silently lost:**
- Lead-intent engine (behavioural qualification, 60pt/30d) — your call, next round.
- The five AI-first solutions from `AI_First_Strategy`.
- ZIP coverage: docs benchmark 32 neighborhoods incl. Winter Park 32789, Lake Nona 32827,
  Celebration 34747 as the top three. We seed 12 ZIPs and none of those three. Expanding the seed to
  32 ZIPs and matching the doc's leaders is a follow-up unless you want it in this round.

---

## 9. FINAL DECISIONS (22 Aug) — supersede §2A and §8

1. **ONE SCORE, not two.** No separate EDGE score. The 23 edge signals fold into the single
   **INVESTMENT SCORE (0–100)** alongside the doc's 17 = **40 weighted signals, 5 categories.**
   Category weights hold at Growth 35 / Housing 25 / Infrastructure 20 / QoL 15 / Economic 5; each
   edge signal is assigned into whichever of the five it belongs to and the category's internal
   weights are renormalised to sum to its category weight. Missing-data redistribution, completeness
   %, PRELIMINARY <70%, and the 5 score tiers all still apply, now across 40 inputs.
   - Edge signals keep their `leadMonthsLow/High` and `whyIgnored` copy in `signalDefs` — they just
     drive **one** number now. The "WHY IT'S MOVING" panel survives: top 5 contributing signals by
     weighted delta, each with lead time and its why-nobody-tracks-this line. That is still the
     answer to "where is this property gaining."
   - The §5 divergence chart is **cut** (no second series to diverge). Replaced by: score history
     12mo (single line) + top signal contributions (signed hairline bars).

2. **Geography: Orange, Seminole, Volusia, Flagler counties only.** Ignore the docs' 32-neighborhood
   Central Florida benchmark and its top three (Winter Park 32789 is Orange so it qualifies; Lake
   Nona 32827 is Orange, qualifies; **Celebration 34747 is Osceola — out of scope, drop it**).
   Seed ZIPs to be drawn from those four counties only, with a `county` column added to `zips`.
   Suggested coverage: Orange (Winter Park 32789, Lake Nona 32827, Downtown 32801, Apopka 32703),
   Seminole (Sanford 32771, Altamonte 32701, Oviedo 32765, Lake Mary 32746), Volusia (Daytona 32114,
   DeLand 32720, Port Orange 32127, New Smyrna 32168), Flagler (Palm Coast 32164, Bunnell 32110).

3. Everything else in §1.6 stands: 4 tabs + More sheet, pricing (c) five tiers + three-band leads,
   bids on projects, lead-intent deferred.

**STATUS: planning complete, implementation NOT started.** Nothing in `packages/` has changed this
round. §7 build order is the entry point for the next session; apply §9 over §2A before coding.
