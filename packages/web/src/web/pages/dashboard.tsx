import { Link } from "wouter";
import { Blueprint, PageHead, Plate } from "../components/blueprint";
import { HeatGrid } from "../components/heat-grid";
import { EmptyState, Loading } from "../components/layout";
import { LeaguePreview, PulsePanel } from "../components/pulse-panel";
import { StatStrip } from "../components/figures";
import { usePulseProfile } from "../queries/gamification";
import { useMe, useSetPrimaryRole } from "../queries/profile";
import { useSavedProperties } from "../queries/properties";
import { usePurchasedLeads, useSetLeadStatus } from "../queries/leads";
import { useProjects } from "../queries/renovation";
import { useHeat } from "../queries/zips";
import { compactUsd, dateShort, num, usd } from "../lib/format";

type Role = "investor" | "realtor" | "contractor";

const ROLES: { key: Role; label: string; kicker: string }[] = [
  { key: "investor", label: "Investor", kicker: "PP-05 · INVESTOR DASHBOARD" },
  { key: "realtor", label: "Realtor", kicker: "PP-05 · REALTOR DASHBOARD" },
  { key: "contractor", label: "Contractor", kicker: "PP-05 · CONTRACTOR DASHBOARD" },
];

export default function DashboardPage() {
  const me = useMe();
  const setPrimary = useSetPrimaryRole();
  const profile = usePulseProfile();

  if (me.isLoading) return <Loading label="OPENING YOUR DESK" />;

  const roles = (me.data?.roles ?? ["investor"]) as Role[];
  const role = ((me.data?.primaryRole as Role) ?? roles[0] ?? "investor") as Role;
  const meta = ROLES.find((r) => r.key === role) ?? ROLES[0];
  const firstName = (me.data?.name ?? "investor").split(" ")[0];

  return (
    <div className="pp-rise">
      <PageHead
        kicker={meta.kicker}
        title={`Welcome back, ${firstName}`}
        right={
          roles.length > 1 ? (
            <div className="seg" aria-label="Dashboard role">
              {ROLES.filter((r) => roles.includes(r.key)).map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className="seg-opt"
                  aria-pressed={role === r.key}
                  disabled={setPrimary.isPending}
                  onClick={() => setPrimary.mutate({ role: r.key })}
                >
                  {r.label}
                </button>
              ))}
            </div>
          ) : (
            <Link to="/settings" className="micro" style={{ textDecoration: "none" }}>
              ADD ANOTHER ROLE →
            </Link>
          )
        }
      />

      <RoleStats role={role} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "440px minmax(0, 1fr)",
          gap: 28,
          margin: "28px 0 34px",
          alignItems: "start",
        }}
      >
        <PulsePanel />
        <LeaguePreview />
      </div>

      {role === "investor" ? <InvestorBody /> : null}
      {role === "realtor" ? <RealtorBody /> : null}
      {role === "contractor" ? <ContractorBody /> : null}

      <div className="hr" style={{ margin: "34px 0 0" }} />
      <section style={{ padding: "24px 0 8px" }}>
        <h3 style={{ margin: "0 0 12px" }}>Recent activity</h3>
        {profile.isLoading ? (
          <Loading label="READING THE LEDGER" />
        ) : profile.data?.recent.length ? (
          <div>
            {profile.data.recent.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--color-hairline)",
                }}
              >
                <span style={{ fontSize: 14 }}>{e.label}</span>
                <span className="micro" style={{ color: "var(--accent-ink)" }}>
                  +{e.points} PP
                </span>
                <span className="micro text-muted" style={{ width: 90, textAlign: "right" }}>
                  {dateShort(e.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>
            Nothing logged yet. Save a property, watch a ZIP or run a stress test — every action
            posts to the ledger.
          </EmptyState>
        )}
      </section>
    </div>
  );
}

/** Four-stat hairline strip, per role. */
function RoleStats({ role }: { role: Role }) {
  const profile = usePulseProfile();
  const saved = useSavedProperties(role === "investor");
  const purchased = usePurchasedLeads(role !== "investor");
  const projects = useProjects(role === "contractor");

  const g = profile.data;

  if (role === "investor") {
    const list = saved.data ?? [];
    const avg = list.length
      ? Math.round(list.reduce((sum, p) => sum + p.score, 0) / list.length)
      : 0;
    return (
      <StatStrip
        items={[
          { label: "SAVED PROPERTIES", value: num(list.length) },
          { label: "AVG SCORE", value: avg ? `${avg}` : "—", accent: true },
          { label: "SEASON PP", value: g ? num(g.totalPoints) : "—" },
          { label: "STREAK", value: g ? `${g.streak} D` : "—" },
        ]}
      />
    );
  }

  const leads = purchased.data ?? [];
  const spend = leads.reduce((sum, l) => sum + l.pricePaid, 0);

  if (role === "realtor") {
    const working = leads.filter((l) => l.status !== "CLOSED").length;
    return (
      <StatStrip
        items={[
          { label: "LEADS OWNED", value: num(leads.length) },
          { label: "IN PIPELINE", value: num(working), accent: true },
          { label: "LEAD SPEND", value: usd(spend) },
          { label: "SEASON PP", value: g ? num(g.totalPoints) : "—" },
        ]}
      />
    );
  }

  const jobs = projects.data ?? [];
  const backlog = jobs.reduce((sum, p) => sum + p.value, 0);
  return (
    <StatStrip
      items={[
        { label: "ACTIVE PROJECTS", value: num(jobs.length) },
        { label: "BACKLOG VALUE", value: compactUsd(backlog), accent: true },
        { label: "PROJECT LEADS", value: num(leads.length) },
        { label: "SEASON PP", value: g ? num(g.totalPoints) : "—" },
      ]}
    />
  );
}

/* ---------------------------------------------------------------- investor */

const TILES = [
  { to: "/properties/search", title: "Search properties", sub: "Find the next one" },
  { to: "/tools/roi-calculator", title: "ROI calculator", sub: "Analyze returns" },
  { to: "/market-map", title: "Market map", sub: "Explore ZIP heat" },
];

function InvestorBody() {
  const saved = useSavedProperties();
  const heat = useHeat("emerging");

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18 }}>
        {TILES.map((t) => (
          <Link key={t.to} to={t.to} style={{ textDecoration: "none", color: "inherit" }}>
            <Blueprint style={{ padding: "18px 16px", height: "100%" }}>
              <div className="cond" style={{ fontSize: 20 }}>
                {t.title}
              </div>
              <div className="micro text-muted" style={{ marginTop: 6 }}>
                {t.sub.toUpperCase()}
              </div>
            </Blueprint>
          </Link>
        ))}
        <Link to="/dashboard/saved" style={{ textDecoration: "none", color: "inherit" }}>
          <Blueprint style={{ padding: "18px 16px", height: "100%" }}>
            <div className="cond" style={{ fontSize: 20 }}>
              Saved properties
            </div>
            <div className="micro text-muted" style={{ marginTop: 6 }}>
              YOUR WATCHLIST · {num(saved.data?.length ?? 0)}
            </div>
          </Blueprint>
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 420px",
          gap: 28,
          marginTop: 28,
          alignItems: "start",
        }}
      >
        <Plate
          label="FIG. 03 — YOUR MARKET · EMERGING SCORE"
          right={
            <Link to="/market-map" className="micro" style={{ textDecoration: "none" }}>
              FULL MAP →
            </Link>
          }
        >
          {heat.isLoading || !heat.data ? (
            <Loading label="LOADING HEAT" />
          ) : (
            <HeatGrid cells={heat.data.cells} columns={12} count={48} cellHeight={22} />
          )}
        </Plate>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>Watchlist</h3>
            <Link to="/properties/search" className="micro" style={{ textDecoration: "none" }}>
              FIND MORE →
            </Link>
          </div>
          {saved.isLoading ? (
            <Loading label="LOADING WATCHLIST" />
          ) : saved.data?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>ZIP</th>
                  <th style={{ textAlign: "right" }}>Price</th>
                  <th style={{ textAlign: "right" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {saved.data.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/properties/${p.id}`} style={{ textDecoration: "none" }}>
                        {p.addr}
                      </Link>
                    </td>
                    <td className="micro">{p.zip}</td>
                    <td className="cond" style={{ textAlign: "right" }}>
                      {compactUsd(p.price)}
                    </td>
                    <td
                      className="cond"
                      style={{
                        textAlign: "right",
                        color: p.score >= 70 ? "var(--accent-ink)" : undefined,
                      }}
                    >
                      {p.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState>
              Nothing saved yet. Save a listing from search and it lands here — and pays +10 PP.
            </EmptyState>
          )}
        </div>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- realtor */

const LEAD_STATUSES = ["NEW", "CONTACTED", "SHOWING", "CLOSED"];

function RealtorBody() {
  const purchased = usePurchasedLeads();
  const setStatus = useSetLeadStatus();
  const rows = purchased.data ?? [];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 380px",
        gap: 28,
        alignItems: "start",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>Purchased leads</h3>
          <Link to="/marketplace" className="micro" style={{ textDecoration: "none" }}>
            BROWSE MARKETPLACE →
          </Link>
        </div>
        {purchased.isLoading ? (
          <Loading label="LOADING PIPELINE" />
        ) : rows.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Location</th>
                <th>Tier</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Paid</th>
                <th style={{ textAlign: "right" }}>Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>{l.addr}</td>
                  <td className="micro">
                    {l.city}, FL {l.zip}
                  </td>
                  <td>
                    <span className="tag tag-neutral">{l.tier}</span>
                  </td>
                  <td>
                    <select
                      className="input"
                      style={{ height: 30, fontSize: 12, padding: "0 8px" }}
                      value={l.status}
                      disabled={setStatus.isPending}
                      onChange={(e) =>
                        setStatus.mutate({ purchaseId: l.id, status: e.target.value })
                      }
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="cond" style={{ textAlign: "right" }}>
                    {usd(l.pricePaid)}
                  </td>
                  <td className="micro text-muted" style={{ textAlign: "right" }}>
                    {dateShort(l.purchasedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState>
            No leads yet. Every lead in the marketplace is scored before sale — buy one and it
            enters this pipeline.
          </EmptyState>
        )}
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <Plate label="CONVERSION SCORE">
          <div className="cond" style={{ fontSize: 44, lineHeight: 1, color: "var(--accent-ink)" }}>
            8.4%
          </div>
          <p className="text-muted" style={{ fontSize: 13, margin: "12px 0 0" }}>
            Rolling 90-day conversion on purchased leads. Platform median: 8–12%. Zillow-class
            portals: 0.4–2%.
          </p>
        </Plate>
        <Plate label="LEAD QUALITY RULE">
          <p style={{ fontSize: 13, margin: 0 }}>
            Every lead is scored 1–100 before sale and sold to at most 3 agents. Score inputs: saved
            properties, ROI runs, alert activity, budget signals.
          </p>
        </Plate>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- contractor */

function ContractorBody() {
  const projects = useProjects();
  const rows = projects.data ?? [];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "340px minmax(0, 1fr)",
        gap: 28,
        alignItems: "start",
      }}
    >
      <div style={{ display: "grid", gap: 20 }}>
        <Plate label="CONTRACTOR SCORE">
          <div className="cond" style={{ fontSize: 44, lineHeight: 1, color: "var(--accent-ink)" }}>
            87
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {[
              { label: "ON-TIME COMPLETION", value: 92 },
              { label: "BUDGET ACCURACY", value: 85 },
              { label: "RESPONSE SPEED", value: 88 },
              { label: "CLIENT RATING", value: 84 },
            ].map((s) => (
              <div key={s.label}>
                <div className="micro" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">{s.label}</span>
                  <span>{s.value}</span>
                </div>
                <div style={{ height: 4, background: "var(--color-neutral-200)", marginTop: 6 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${s.value}%`,
                      background: "var(--color-accent-700)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted" style={{ fontSize: 13, margin: "16px 0 0" }}>
            Score gates lead priority. 90+ unlocks exclusive project leads.
          </p>
        </Plate>

        <Plate label="EXPANSION SIGNAL">
          <p style={{ fontSize: 13, margin: 0 }}>
            <strong>Expansion signal:</strong> permit volume in 33604 (Seminole Hts) up 31% over 6
            months. Your service radius covers it.
          </p>
          <Link
            to="/market-map"
            className="btn btn-secondary btn-block"
            style={{ marginTop: 14, textDecoration: "none" }}
          >
            View on map
          </Link>
        </Plate>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>Upcoming projects</h3>
          <Link to="/marketplace" className="micro" style={{ textDecoration: "none" }}>
            FIND NEW WORK →
          </Link>
        </div>
        {projects.isLoading ? (
          <Loading label="LOADING SCHEDULE" />
        ) : rows.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Location</th>
                <th style={{ textAlign: "right" }}>Value</th>
                <th>Starts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.title}
                    <div className="micro text-muted">{p.scope}</div>
                  </td>
                  <td className="micro">
                    {p.addr} · {p.zip}
                  </td>
                  <td className="cond" style={{ textAlign: "right" }}>
                    {usd(p.value)}
                  </td>
                  <td className="micro">{p.starts}</td>
                  <td>
                    <span className="tag tag-outline">{p.stage}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState>No scheduled work. Buy a project lead to fill the calendar.</EmptyState>
        )}
      </div>
    </div>
  );
}
