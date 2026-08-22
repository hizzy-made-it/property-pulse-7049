import { useMemo, useState } from "react";
import { PageHead, Plate } from "../components/blueprint";
import { EmptyState, Loading, Spinner } from "../components/layout";
import {
  useContractors,
  useImprovements,
  useStressTest,
} from "../queries/renovation";
import { useFiredAlerts, useUnwatchZip, useWatchZip, useWatchedZips } from "../queries/alerts";
import { useZips } from "../queries/zips";
import { useSession } from "../lib/auth";
import { dateShort, num, pct, usd, usdSigned } from "../lib/format";

const TABS = [
  { key: "alerts", label: "Market alerts" },
  { key: "planner", label: "Improvement planner" },
  { key: "stress", label: "Stress test" },
  { key: "contractors", label: "Contractor match" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function RenovationPage() {
  const [tab, setTab] = useState<TabKey>("alerts");

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-08 · INVESTMENT ANALYSIS SUITE"
        title="Tools that stay honest when data is thin"
      />

      <div
        style={{
          display: "flex",
          gap: 0,
          borderTop: "1px solid var(--color-divider)",
          borderBottom: "1px solid var(--color-divider)",
          marginBottom: 28,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className="micro"
            onClick={() => setTab(t.key)}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRight: "1px solid var(--color-hairline)",
              cursor: "pointer",
              background: tab === t.key ? "var(--color-accent)" : "transparent",
              color: tab === t.key ? "var(--plate-ink-text, #fff)" : "var(--color-text)",
            }}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "alerts" ? <AlertsTab /> : null}
      {tab === "planner" ? <PlannerTab /> : null}
      {tab === "stress" ? <StressTab /> : null}
      {tab === "contractors" ? <ContractorsTab /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ alerts */

function AlertsTab() {
  const { data: session } = useSession();
  const watched = useWatchedZips(!!session);
  const fired = useFiredAlerts();
  const zips = useZips();
  const watch = useWatchZip();
  const unwatch = useUnwatchZip();
  const [zip, setZip] = useState("");

  const list = watched.data ?? [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "380px minmax(0, 1fr)", gap: 28, alignItems: "start" }}>
      <Plate label="WATCHED ZIPS" right={`PREMIUM PLAN: ${list.length} OF 10 USED`}>
        {!session ? (
          <EmptyState>Sign in to watch ZIPs and get alerts when the data moves.</EmptyState>
        ) : watched.isLoading ? (
          <Loading label="LOADING WATCHLIST" />
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {list.length ? (
                list.map((w) => (
                  <button
                    key={w.zip}
                    type="button"
                    className="tag tag-accent"
                    style={{ cursor: "pointer", border: "none" }}
                    onClick={() => unwatch.mutate({ zip: w.zip })}
                    title={`Stop watching ${w.name}`}
                  >
                    {w.zip} ×
                  </button>
                ))
              ) : (
                <span className="micro text-muted">NO ZIPS WATCHED YET</span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 16 }}>
              <select className="input" value={zip} onChange={(e) => setZip(e.target.value)}>
                <option value="">Add ZIP</option>
                {(zips.data ?? [])
                  .filter((z) => !list.some((w) => w.zip === z.zip))
                  .map((z) => (
                    <option key={z.zip} value={z.zip}>
                      {z.zip} — {z.name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!zip || watch.isPending || list.length >= 10}
                onClick={() => {
                  watch.mutate({ zip });
                  setZip("");
                }}
              >
                {watch.isPending ? <Spinner /> : "Watch"}
              </button>
            </div>

            <p className="text-muted" style={{ fontSize: 13, margin: "16px 0 0" }}>
              Alerts fire on: price velocity ±3 pts · permit volume ±25% · inventory months ±0.5 ·
              score change ±5.
            </p>
          </>
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
          <h3 style={{ margin: 0 }}>Fired alerts — last 30 days</h3>
          <span className="micro text-muted">DELIVERY: EMAIL + IN-APP</span>
        </div>
        {fired.isLoading ? (
          <Loading label="READING THE FEED" />
        ) : fired.data?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Signal</th>
                <th>ZIP</th>
                <th>Trigger</th>
                <th>Moved</th>
                <th style={{ textAlign: "right" }}>Fired</th>
              </tr>
            </thead>
            <tbody>
              {fired.data.map((a) => (
                <tr key={a.id}>
                  <td>{a.signal}</td>
                  <td className="micro">{a.zip}</td>
                  <td className="text-muted" style={{ fontSize: 13 }}>
                    {a.detail}
                  </td>
                  <td className="cond" style={{ color: "var(--accent-ink)" }}>
                    {a.moved}
                  </td>
                  <td className="micro text-muted" style={{ textAlign: "right" }}>
                    {dateShort(a.firedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState>
            Nothing has tripped on your watched ZIPs. Watch a ZIP to start the feed.
          </EmptyState>
        )}
        <div className="micro text-muted" style={{ marginTop: 12 }}>
          EVERY ALERT LINKS THE RAW SERIES THAT TRIPPED IT — NO UNEXPLAINED FLAGS.
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- planner */

function PlannerTab() {
  const improvements = useImprovements();
  const [picked, setPicked] = useState<string[]>([]);
  const data = improvements.data;
  const rows = useMemo(() => data ?? [], [data]);

  const totals = useMemo(() => {
    const chosen = rows.filter((r) => picked.includes(r.id));
    const cost = chosen.reduce((s, r) => s + r.cost, 0);
    const value = chosen.reduce((s, r) => s + r.value, 0);
    return { count: chosen.length, cost, value };
  }, [rows, picked]);

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 28, alignItems: "start" }}>
      <div>
        {improvements.isLoading ? (
          <Loading label="LOADING COMP DELTAS" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>☐</th>
                <th>Improvement</th>
                <th style={{ textAlign: "right" }}>Est. cost</th>
                <th style={{ textAlign: "right" }}>Value added</th>
                <th style={{ textAlign: "right" }}>ROI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const on = picked.includes(r.id);
                return (
                  <tr key={r.id} onClick={() => toggle(r.id)} style={{ cursor: "pointer" }}>
                    <td aria-label={on ? `${r.name} selected` : `${r.name} not selected`}>
                      <span
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: 13,
                          height: 13,
                          border: "1px solid var(--color-text)",
                          background: on ? "var(--color-accent)" : "transparent",
                        }}
                      />
                    </td>
                    <td>{r.name}</td>
                    <td className="cond" style={{ textAlign: "right" }}>
                      {usd(r.cost)}
                    </td>
                    <td className="cond" style={{ textAlign: "right" }}>
                      {usd(r.value)}
                    </td>
                    <td
                      className="cond"
                      style={{ textAlign: "right", color: "var(--accent-ink)" }}
                    >
                      {pct((r.value / r.cost - 1) * 100, 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="micro text-muted" style={{ marginTop: 12 }}>
          TOGGLE ITEMS TO BUILD THE PLAN
        </div>
      </div>

      <Plate label="PLAN TOTALS">
        <div style={{ display: "grid", gap: 14 }}>
          <Row label="Items selected" value={`${totals.count}`} />
          <Row label="Total cost" value={usd(totals.cost)} />
          <Row label="Est. value added" value={usd(totals.value)} accent />
          <Row label="Net" value={usdSigned(totals.value - totals.cost)} />
        </div>
        <p className="text-muted" style={{ fontSize: 13, margin: "16px 0 0" }}>
          Value estimates from ZIP-level comp deltas, not national averages.
        </p>
      </Plate>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span className="micro text-muted">{label.toUpperCase()}</span>
      <span className="cond" style={{ fontSize: 22, color: accent ? "var(--accent-ink)" : undefined }}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ stress */

const SCENARIOS = [
  { key: "rateShock", label: "Interest rate +2.0 points", detail: "Refinance at a higher coupon" },
  { key: "vacancy", label: "Vacancy at 15%", detail: "Nearly two months empty per year" },
  { key: "priceDrop", label: "Property value −12%", detail: "Regional correction" },
  { key: "maintenanceSpike", label: "Maintenance ×2", detail: "Roof and HVAC in the same year" },
] as const;

const BASE = 3744;

function StressTab() {
  const { data: session } = useSession();
  const run = useStressTest();
  const [on, setOn] = useState<Record<string, boolean>>({});

  const result = run.data;

  const submit = () =>
    run.mutate({
      baseAnnualCashFlow: BASE,
      rateShock: !!on.rateShock,
      vacancy: !!on.vacancy,
      priceDrop: !!on.priceDrop,
      maintenanceSpike: !!on.maintenanceSpike,
    });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 28, alignItems: "start" }}>
      <Plate label="STRESS SCENARIOS">
        <div>
          {SCENARIOS.map((s) => (
            <label
              key={s.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 0",
                borderBottom: "1px solid var(--color-hairline)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                aria-label={s.label}
                checked={!!on[s.key]}
                onChange={() => setOn((p) => ({ ...p, [s.key]: !p[s.key] }))}
                style={{ accentColor: "var(--color-accent)", width: 14, height: 14 }}
              />
              <span style={{ flex: 1 }}>
                {s.label}
                <span className="micro text-muted" style={{ display: "block", marginTop: 3 }}>
                  {s.detail.toUpperCase()}
                </span>
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 18 }}
          disabled={!session || run.isPending}
          onClick={submit}
        >
          {run.isPending ? <Spinner /> : session ? "Run stress test · +40 PP" : "Sign in to run"}
        </button>
      </Plate>

      <div>
        <div className="micro text-muted">ANNUAL CASH FLOW UNDER STRESS</div>
        <div
          className="cond"
          style={{ fontSize: 64, lineHeight: 1, marginTop: 8, color: "var(--accent-ink)" }}
        >
          {usdSigned(result ? result.cashFlow : BASE)}
        </div>
        <div style={{ marginTop: 12 }}>
          <span className="tag tag-outline">{result ? result.verdict : "BASELINE — NO SHOCKS"}</span>
        </div>
        <p className="text-muted" style={{ fontSize: 14, marginTop: 16 }}>
          Baseline {usd(BASE)} / yr
          {result && result.applied.length
            ? ` · shocks applied: ${result.applied.join(" · ")} · net change ${usdSigned(
                result.cashFlow - BASE,
              )}`
            : " · no shocks applied"}
          .
        </p>
        <p className="text-muted" style={{ fontSize: 13 }}>
          Applied across your 3 saved analyses. Fixed formulas — the same scenario always produces
          the same result.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- contractors */

function ContractorsTab() {
  const contractors = useContractors();

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>Matched contractors — roof scope, 32803</h3>
        <span className="micro text-muted">MATCH = SCORE × PROXIMITY × AVAILABILITY</span>
      </div>
      {contractors.isLoading ? (
        <Loading label="MATCHING TRADES" />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Contractor</th>
              <th>Trade</th>
              <th style={{ textAlign: "right" }}>Score</th>
              <th>Next opening</th>
              <th style={{ textAlign: "right" }}>Match</th>
              <th style={{ width: 40 }} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {(contractors.data ?? []).map((c) => (
              <tr key={c.id}>
                <td>
                  {c.name}
                  <div className="micro text-muted">
                    {num(c.jobs)} JOBS · {c.rating.toFixed(1)} ★ · {c.zips}
                  </div>
                </td>
                <td className="micro">{c.trade}</td>
                <td className="cond" style={{ textAlign: "right" }}>
                  {c.rating.toFixed(1)}
                </td>
                <td className="micro">{c.leadTime}</td>
                <td className="cond" style={{ textAlign: "right", color: "var(--accent-ink)" }}>
                  {c.match}%
                </td>
                <td className="micro text-muted">→</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="micro text-muted" style={{ marginTop: 12 }}>
        AVAILABILITY PREDICTED FROM PERMIT BACKLOG — CONFIRM DIRECTLY BEFORE SCHEDULING.
      </div>
    </div>
  );
}
