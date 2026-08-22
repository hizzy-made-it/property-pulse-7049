import { Link, useParams } from "wouter";
import { Loading, Spinner } from "../components/layout";
import { Blueprint, Plate } from "../components/blueprint";
import { Photo, ScoreBar, StatStrip } from "../components/figures";
import { useProperty, useToggleSave } from "../queries/properties";
import { useMe } from "../queries/profile";
import { num, usd, usdSigned } from "../lib/format";

export default function PropertyPage() {
  const { id = "" } = useParams<{ id: string }>();
  const property = useProperty(id);
  const me = useMe();
  const toggleSave = useToggleSave();

  if (property.isLoading) {
    return (
      <div className="pp-rise">
        <Loading label="PULLING THE FILE" />
      </div>
    );
  }
  if (!property.data) {
    return (
      <div className="pp-rise">
        <p className="text-muted">That listing is no longer on the board.</p>
        <Link to="/properties/search">← Back to search</Link>
      </div>
    );
  }

  const p = property.data;
  const z = p.zipData;
  const roiHref = `/tools/roi-calculator?price=${p.price}&rent=${p.rent}&title=${encodeURIComponent(p.addr)}`;

  return (
    <div className="pp-rise">
      <Link to="/properties/search" className="micro" style={{ textDecoration: "none" }}>
        ← BACK TO SEARCH
      </Link>

      <div style={{ marginTop: 18 }}>
        <Photo seed={p.id} height={340} alt={p.addr} src={p.photo ?? undefined} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 34, marginTop: 30, alignItems: "start" }}>
        <div>
          {/* ── verdict ─────────────────────────────────────────────────── */}
          <Blueprint style={{ display: "grid", gridTemplateColumns: "200px 1fr", background: "var(--color-surface)" }}>
            <div style={{ padding: "20px 22px", borderRight: "1px solid var(--color-divider)" }}>
              <div className="micro text-muted" style={{ marginBottom: 8 }}>
                VERDICT
              </div>
              <div
                className="cond"
                style={{
                  fontSize: 64,
                  lineHeight: 0.9,
                  color: p.verdict === "BUY" ? "var(--accent-ink)" : "var(--color-text)",
                }}
              >
                {p.verdict}
              </div>
              <div className="cond" style={{ fontSize: 18, marginTop: 8 }}>
                {p.score} / 100
              </div>
              <div className="micro text-muted" style={{ marginTop: 10, letterSpacing: ".12em" }}>
                SAME INPUTS · SAME SCORE
              </div>
            </div>
            <div style={{ padding: "20px 22px", display: "grid", gap: 14 }}>
              <ScoreBar label="GROWTH" value={p.growth} accent />
              <ScoreBar label="HOUSING" value={p.housing} />
              <ScoreBar label="INFRASTRUCTURE" value={p.infrastructure} />
              <ScoreBar label="QUALITY OF LIFE" value={p.quality} />
            </div>
          </Blueprint>

          {/* ── headline ────────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
            <h1 className="cond" style={{ fontSize: 40, margin: 0 }}>
              {usd(p.price)}
            </h1>
            <span className="tag tag-outline">{p.status}</span>
            <span className="tag tag-neutral">{p.type}</span>
          </div>
          <p className="text-muted" style={{ fontSize: 15, marginTop: 6 }}>
            {p.addr}, {p.city}, {p.state} {p.zip}
          </p>

          <div style={{ marginTop: 18 }}>
            <StatStrip
              items={[
                { label: "BEDROOMS", value: p.beds },
                { label: "BATHROOMS", value: p.baths },
                { label: "SQ FT", value: num(p.sqft) },
                { label: "BUILT", value: p.built },
              ]}
            />
          </div>

          <div
            className="micro text-muted"
            style={{ display: "flex", gap: 26, flexWrap: "wrap", padding: "14px 0 0" }}
          >
            <span>LOT · {p.lot}</span>
            <span>ON MARKET · {p.dom} DAYS</span>
            <span>LISTED · {p.listedAt}</span>
            <span>MLS · {p.mls}</span>
          </div>

          {/* ── neighborhood ────────────────────────────────────────────── */}
          <h3 style={{ marginTop: 40 }}>Neighborhood {p.zip}</h3>
          <p className="text-muted" style={{ fontSize: 15, maxWidth: 640 }}>
            {p.hood}
          </p>
          <StatStrip
            size={26}
            items={[
              { label: "MEDIAN INCOME", value: p.income },
              { label: "EMPLOYMENT", value: p.employment },
              { label: "CRIME SCORE", value: p.crime },
              { label: "PRICE VELOCITY", value: p.velocity, accent: true },
            ]}
          />

          {z ? (
            <div className="micro text-muted" style={{ marginTop: 14, display: "flex", gap: 26, flexWrap: "wrap" }}>
              <span>ZIP EMERGING SCORE · {z.emergingScore}</span>
              <span>PERMITS 6M · {num(z.permits)}</span>
              <span>INVENTORY · {z.inventoryMonths} MO</span>
              <Link to={`/properties/search?zip=${p.zip}`} style={{ textDecoration: "none" }}>
                SEE ALL LISTINGS IN {p.zip} →
              </Link>
            </div>
          ) : null}

          {/* ── comparables ─────────────────────────────────────────────── */}
          {p.comparables.length ? (
            <>
              <h3 style={{ marginTop: 40 }}>Comparables in {p.zip}</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Price</th>
                    <th>Beds</th>
                    <th>Sq ft</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {p.comparables.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/properties/${c.id}`} style={{ textDecoration: "none" }}>
                          {c.addr}
                        </Link>
                      </td>
                      <td>{usd(c.price)}</td>
                      <td>{c.beds}</td>
                      <td>{num(c.sqft)}</td>
                      <td className="cond">{c.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </div>

        {/* ── sidebar ───────────────────────────────────────────────────── */}
        <aside style={{ position: "sticky", top: 92, display: "grid", gap: 24 }}>
          <Plate label="INVESTMENT METRICS" footer="Pre-fills this property's price and rent">
            <div style={{ display: "grid", gap: 14 }}>
              <Row label="Est. monthly rent" value={usd(p.rent)} />
              <Row label="Cap rate" value={`${p.capRate.toFixed(1)}%`} />
              <Row label="Est. monthly cash flow" value={usdSigned(p.cashFlow)} accent />
            </div>
            <Link to={roiHref} className="btn btn-secondary btn-block" style={{ marginTop: 18 }}>
              Open ROI calculator
            </Link>
          </Plate>

          <Plate label="INTERESTED?">
            <p className="text-muted" style={{ fontSize: 14 }}>
              Connect with a local agent or hold it on your watchlist.
            </p>
            <button type="button" className="btn btn-primary btn-block" style={{ marginBottom: 10 }}>
              Contact an agent
            </button>
            {me.data ? (
              <button
                type="button"
                className="btn btn-secondary btn-block"
                disabled={toggleSave.isPending}
                onClick={() => toggleSave.mutate({ propertyId: p.id })}
              >
                {toggleSave.isPending ? <Spinner /> : p.saved ? "Saved ✓ — remove" : "Save property"}
              </button>
            ) : (
              <Link to="/auth" className="btn btn-secondary btn-block">
                Sign in to save
              </Link>
            )}
          </Plate>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <span className="text-muted" style={{ fontSize: 14 }}>
        {label}
      </span>
      <span className="cond" style={{ fontSize: 19, color: accent ? "var(--accent-ink)" : undefined }}>
        {value}
      </span>
    </div>
  );
}
