import { Link } from "wouter";
import { Blueprint, Plate } from "../components/blueprint";
import { HeatGrid, HeatLegend } from "../components/heat-grid";
import { Loading } from "../components/layout";
import { useHeat } from "../queries/zips";

const SPECS = [
  { n: "01", label: "BUY / PASS", body: "One verdict per property" },
  { n: "02", label: "ZIP HEAT", body: "214 neighborhoods scored" },
  { n: "03", label: "ROI TOOLS", body: "No invented yields" },
  { n: "04", label: "ALERTS", body: "Fire when data moves" },
];

const SIDES = [
  {
    n: "01",
    title: "Investors",
    body: "Scores, heat maps, ROI tools. No property required.",
    price: "FROM $99 / MO",
    cta: "Start analyzing →",
    href: "/properties/search",
  },
  {
    n: "02",
    title: "Realtors",
    body: "Leads with proven investment intent. Max 3 buyers per lead.",
    price: "FROM $500 / LEAD",
    cta: "Get leads →",
    href: "/marketplace",
  },
  {
    n: "03",
    title: "Contractors",
    body: "Renovation projects in ZIPs where permits are moving.",
    price: "FROM $500 / LEAD",
    cta: "Find projects →",
    href: "/marketplace",
  },
];

export default function LandingPage() {
  const heat = useHeat("emerging");
  const top = heat.data?.cells.slice(0, 2) ?? [];

  return (
    <div className="pp-rise">
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 56,
          alignItems: "center",
          padding: "34px 0 64px",
        }}
      >
        <div>
          <div className="kicker" style={{ marginBottom: 18 }}>
            PP-01 · INVESTMENT INTELLIGENCE · EARLY ACCESS
          </div>
          <h1 style={{ fontSize: 60, lineHeight: 1.02, margin: 0 }}>
            Buy or pass.
            <br />
            Same answer tomorrow.
          </h1>
          <p
            className="text-muted"
            style={{ fontSize: 17, margin: "20px 0 28px", maxWidth: 470 }}
          >
            Deterministic scores on Central Florida ZIPs. Published weights. No re-rolled grades.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link to="/properties/search" className="btn btn-primary">
              Search properties
            </Link>
            <Link to="/market-map" className="btn btn-secondary">
              Explore the market map
            </Link>
          </div>
          <p className="micro text-muted" style={{ marginTop: 22, letterSpacing: ".1em" }}>
            SAME INPUTS → SAME SCORES. GRADES ARE NEVER RE-ROLLED FOR THEATER.
          </p>
        </div>

        <Plate
          label="FIG. 01 — ZIP HEAT · ORLANDO METRO"
          right={<span className="tag tag-outline micro">LIVE</span>}
        >
          {heat.isLoading ? (
            <Loading label="LOADING HEAT" />
          ) : (
            <>
              <HeatGrid
                cells={heat.data?.cells ?? []}
                columns={8}
                count={48}
                cellHeight={30}
                interactive={false}
              />
              <div style={{ marginTop: 16, display: "grid", gap: 6 }}>
                {top.map((c) => (
                  <div
                    key={c.zip}
                    className="micro"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--color-muted)",
                    }}
                  >
                    <span>
                      {c.zip} {c.name}
                    </span>
                    <span style={{ color: "var(--accent-ink)" }}>{c.display}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <HeatLegend />
              </div>
            </>
          )}
        </Plate>
      </section>

      {/* ── spec strip ───────────────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          borderTop: "1px solid var(--color-divider)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        {SPECS.map((s, i) => (
          <div
            key={s.n}
            style={{
              padding: "20px 22px",
              borderLeft: i === 0 ? "none" : "1px solid var(--color-hairline)",
            }}
          >
            <div className="micro" style={{ color: "var(--accent-ink)", marginBottom: 8 }}>
              {s.n} — {s.label}
            </div>
            <div style={{ fontSize: 15 }}>{s.body}</div>
          </div>
        ))}
      </section>

      {/* ── three sides ──────────────────────────────────────────────── */}
      <section style={{ padding: "72px 0 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 56,
            alignItems: "end",
            marginBottom: 34,
          }}
        >
          <h2 style={{ fontSize: 40, margin: 0 }}>
            Three sides.
            <br />
            One data spine.
          </h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 16 }}>
            Investors pay for scores. Realtors and contractors pay for leads the scores qualify.
            Nobody pays for browsing.
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--color-divider)" }}>
          {SIDES.map((s) => (
            <div
              key={s.n}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr auto auto",
                gap: 24,
                alignItems: "center",
                padding: "22px 0",
                borderBottom: "1px solid var(--color-hairline)",
              }}
            >
              <span className="cond" style={{ fontSize: 22, color: "var(--accent-quiet)" }}>
                {s.n}
              </span>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 22 }}>{s.title}</h3>
                <div className="text-muted" style={{ fontSize: 15 }}>
                  {s.body}
                </div>
              </div>
              <span className="micro" style={{ color: "var(--accent-ink)" }}>
                {s.price}
              </span>
              <Link to={s.href} className="btn btn-ghost">
                {s.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── closing plate ────────────────────────────────────────────── */}
      <section style={{ padding: "64px 0 0" }}>
        <Blueprint style={{ padding: "44px 40px", textAlign: "center" }}>
          <h2 style={{ fontSize: 34, margin: "0 0 10px" }}>
            Start free. Upgrade when the tools earn it.
          </h2>
          <p className="text-muted" style={{ margin: "0 0 22px", fontSize: 15 }}>
            Free starter tier · public browsing · published methodology · cancel anytime
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/auth" className="btn btn-primary">
              Create an account
            </Link>
            <Link to="/properties/search" className="btn btn-secondary">
              Browse properties first
            </Link>
          </div>
        </Blueprint>
      </section>
    </div>
  );
}
