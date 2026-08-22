import { Link } from "wouter";
import { EmptyState, Loading } from "../components/layout";
import { PageHead } from "../components/blueprint";
import { Photo } from "../components/figures";
import { useSavedProperties, useToggleSave } from "../queries/properties";
import { num, usd } from "../lib/format";

/** PP-05b — the investor watch list: saved listings, same card as search. */
export default function SavedPage() {
  const saved = useSavedProperties();
  const toggleSave = useToggleSave();
  const rows = saved.data ?? [];

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-05 · WATCH LIST"
        title={
          <>
            {saved.isLoading ? "…" : num(rows.length)} saved{" "}
            <span style={{ color: "var(--accent-ink)" }}>listings</span>
          </>
        }
        sub="Scores refresh weekly against the same published weights. Nothing here is re-graded for theater."
        right="SAVING A LISTING EARNS 10 PP · ONCE PER PROPERTY"
      />

      {saved.isLoading ? (
        <Loading label="LOADING WATCH LIST" />
      ) : rows.length === 0 ? (
        <EmptyState>
          Nothing saved yet.{" "}
          <Link to="/properties/search" style={{ color: "var(--accent-ink)" }}>
            Search properties
          </Link>{" "}
          and save the ones worth tracking.
        </EmptyState>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 26 }}>
          {rows.map((p) => (
            <article key={p.id} className="blueprint pp-rise" style={{ background: "var(--color-surface)" }}>
              <span className="corner tl" />
              <span className="corner tr" />
              <span className="corner bl" />
              <span className="corner br" />
              <Link to={`/properties/${p.id}`} style={{ display: "block", textDecoration: "none" }}>
                <Photo seed={p.id} height={150} alt={p.addr} src={p.photo ?? undefined} />
              </Link>
              <div style={{ padding: "14px 15px 0" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span className="cond" style={{ fontSize: 22 }}>
                    {usd(p.price)}
                  </span>
                  <span className={p.score >= 70 ? "tag tag-accent" : "tag tag-neutral"}>{p.score}</span>
                </div>
                <Link
                  to={`/properties/${p.id}`}
                  style={{
                    display: "block",
                    marginTop: 6,
                    color: "var(--color-text)",
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  {p.addr}
                </Link>
                <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
                  {p.city}, {p.state} {p.zip}
                </div>
              </div>
              <div
                style={{
                  marginTop: 13,
                  borderTop: "1px solid var(--color-divider)",
                  padding: "10px 15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span className="micro text-muted">
                  {p.beds} BD / {p.baths} BA / {num(p.sqft)} SQFT
                </span>
                <button
                  type="button"
                  className="btn btn-ghost micro"
                  style={{ padding: 0 }}
                  disabled={toggleSave.isPending && toggleSave.variables?.propertyId === p.id}
                  onClick={() => toggleSave.mutate({ propertyId: p.id })}
                >
                  REMOVE
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
