import { useMemo, useState } from "react";
import { Link, useSearchParams } from "wouter";
import { EmptyState, Loading } from "../components/layout";
import { PageHead } from "../components/blueprint";
import { Photo } from "../components/figures";
import { usePropertySearch, useFacets, useToggleSave, type SearchInput } from "../queries/properties";
import { useMe } from "../queries/profile";
import { num, usd } from "../lib/format";

const SORTS: { value: SearchInput["sort"]; label: string }[] = [
  { value: "score", label: "Investment score" },
  { value: "priceAsc", label: "Price: low to high" },
  { value: "priceDesc", label: "Price: high to low" },
  { value: "newest", label: "Largest sqft" },
];

const BEDS = [0, 1, 2, 3, 4];
const BATHS = [0, 1, 2, 3];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const zipParam = params.get("zip") ?? undefined;

  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);
  const [types, setTypes] = useState<string[]>([]);
  const [sort, setSort] = useState<SearchInput["sort"]>("score");

  const facets = useFacets();
  const me = useMe();
  const toggleSave = useToggleSave();

  const input: SearchInput = useMemo(
    () => ({
      city: city || undefined,
      zip: zipParam,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      beds: beds || undefined,
      baths: baths || undefined,
      types: types.length ? types : undefined,
      sort,
    }),
    [city, zipParam, minPrice, maxPrice, beds, baths, types, sort],
  );

  const search = usePropertySearch(input);
  const rows = search.data ?? [];
  const scope = zipParam ? `ZIP ${zipParam}` : city ? city : "Central Florida";

  const clearAll = () => {
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setBeds(0);
    setBaths(0);
    setTypes([]);
    setSort("score");
    setParams(new URLSearchParams());
  };

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-03 · SEARCH"
        title={
          <>
            {search.isLoading ? "…" : num(rows.length)} listings ·{" "}
            <span style={{ color: "var(--accent-ink)" }}>{scope}</span>
          </>
        }
        right="SCORES ARE NEIGHBORHOOD-LEVEL, 0–100"
      />

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 34, alignItems: "start" }}>
        {/* ── filter rail ───────────────────────────────────────────────── */}
        <aside style={{ position: "sticky", top: 92 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderBottom: "1px solid var(--color-text)",
              paddingBottom: 8,
              marginBottom: 18,
            }}
          >
            <span className="micro">FILTERS</span>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: 0 }} onClick={clearAll}>
              Clear all
            </button>
          </div>

          {zipParam ? (
            <div style={{ marginBottom: 18 }}>
              <span className="tag tag-accent">ZIP {zipParam}</span>{" "}
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: 0 }}
                onClick={() => setParams(new URLSearchParams())}
              >
                remove
              </button>
            </div>
          ) : null}

          <div className="field" style={{ marginBottom: 18 }}>
            <label htmlFor="f-city">City</label>
            <select id="f-city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">All cities</option>
              {(facets.data?.cities ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="micro text-muted" style={{ marginBottom: 8 }}>
              PRICE RANGE
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input
                className="input"
                inputMode="numeric"
                aria-label="Minimum price"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
              />
              <input
                className="input"
                inputMode="numeric"
                aria-label="Maximum price"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="micro text-muted" style={{ marginBottom: 8 }}>
              BEDS
            </div>
            <div className="seg">
              {BEDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  className="seg-opt"
                  aria-pressed={beds === b}
                  onClick={() => setBeds(b)}
                >
                  {b === 0 ? "Any" : `${b}+`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="micro text-muted" style={{ marginBottom: 8 }}>
              BATHS
            </div>
            <div className="seg">
              {BATHS.map((b) => (
                <button
                  key={b}
                  type="button"
                  className="seg-opt"
                  aria-pressed={baths === b}
                  onClick={() => setBaths(b)}
                >
                  {b === 0 ? "Any" : `${b}+`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="micro text-muted" style={{ marginBottom: 10 }}>
              PROPERTY TYPE
            </div>
            <div style={{ display: "grid", gap: 9 }}>
              {(facets.data?.types ?? []).map((t) => {
                const on = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypes((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "none",
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                      color: "var(--color-text)",
                      fontSize: 14,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "1px solid var(--color-text)",
                        background: on ? "var(--color-accent-700)" : "transparent",
                        display: "inline-block",
                      }}
                    />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field">
            <label htmlFor="f-sort">Sort</label>
            <select
              id="f-sort"
              className="input"
              value={sort}
              onChange={(e) => setSort(e.target.value as SearchInput["sort"])}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* ── results ───────────────────────────────────────────────────── */}
        <section>
          {search.isLoading ? (
            <Loading label="SCORING LISTINGS" />
          ) : rows.length === 0 ? (
            <EmptyState>No listings match these filters. Loosen the price range or clear all filters.</EmptyState>
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
                      style={{ display: "block", marginTop: 6, color: "var(--color-text)", textDecoration: "none", fontSize: 14 }}
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
                    {me.data ? (
                      <button
                        type="button"
                        className="btn btn-ghost micro"
                        style={{ padding: 0 }}
                        disabled={toggleSave.isPending && toggleSave.variables?.propertyId === p.id}
                        onClick={() => toggleSave.mutate({ propertyId: p.id })}
                      >
                        {p.saved ? "SAVED ✓" : "SAVE"}
                      </button>
                    ) : (
                      <Link to="/auth" className="micro" style={{ textDecoration: "none" }}>
                        SAVE
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
