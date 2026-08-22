import { useMemo, useState } from "react";
import { useSearchParams } from "wouter";
import { PageHead, Plate } from "../components/blueprint";
import { Loading, Spinner } from "../components/layout";
import { StatStrip } from "../components/figures";
import { useDeleteScenario, useRoi, useSaveScenario, useScenarios, type RoiInputs } from "../queries/roi";
import { useSession } from "../lib/auth";
import { compactUsd, pct, usd, usdSigned } from "../lib/format";

const FIELDS: { key: keyof RoiInputs; label: string; step?: number }[] = [
  { key: "price", label: "Purchase price $" },
  { key: "down", label: "Down payment %" },
  { key: "rate", label: "Interest rate %", step: 0.05 },
  { key: "term", label: "Loan term yr" },
  { key: "rent", label: "Monthly rent $" },
  { key: "vac", label: "Vacancy %" },
  { key: "taxes", label: "Taxes $ / yr" },
  { key: "ins", label: "Insurance $ / yr" },
  { key: "maint", label: "Maintenance % rent" },
  { key: "mgmt", label: "Management % rent" },
];

const DEFAULTS: RoiInputs = {
  price: 385000,
  down: 20,
  rate: 6.85,
  term: 30,
  rent: 2650,
  vac: 6,
  taxes: 4620,
  ins: 2400,
  maint: 8,
  mgmt: 8,
};

export default function RoiCalculatorPage() {
  const [params] = useSearchParams();
  const { data: session } = useSession();

  const initial = useMemo<RoiInputs>(() => {
    const price = Number(params.get("price"));
    const rent = Number(params.get("rent"));
    return {
      ...DEFAULTS,
      price: Number.isFinite(price) && price > 0 ? price : DEFAULTS.price,
      rent: Number.isFinite(rent) && rent > 0 ? rent : DEFAULTS.rent,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = params.get("title") ?? "Custom scenario";
  const propertyId = params.get("id");

  const [inputs, setInputs] = useState<RoiInputs>(initial);
  const roi = useRoi(inputs);
  const save = useSaveScenario();
  const scenarios = useScenarios(!!session);
  const remove = useDeleteScenario();

  const r = roi.data;

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-09 · ROI CALCULATOR"
        title={`Investment ROI — ${title}`}
        right="LIVE — RESULTS RECOMPUTE AS YOU TYPE"
      />

      <div style={{ display: "grid", gridTemplateColumns: "420px minmax(0, 1fr)", gap: 28, alignItems: "start" }}>
        <Plate
          label="INPUTS"
          footer="FIXED FORMULAS · PUBLISHED ASSUMPTIONS · NO INVENTED YIELDS"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {FIELDS.map((f) => (
              <label key={f.key} className="field">
                <span className="micro text-muted">{f.label.toUpperCase()}</span>
                <input
                  className="input"
                  type="number"
                  aria-label={f.label}
                  step={f.step ?? 1}
                  value={inputs[f.key]}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))
                  }
                />
              </label>
            ))}
          </div>
        </Plate>

        <div>
          {!r ? (
            <Loading label="RUNNING THE MODEL" />
          ) : (
            <>
              <StatStrip
                size={32}
                items={[
                  { label: "CAP RATE", value: pct(r.capRate), accent: true },
                  { label: "CASH-ON-CASH", value: pct(r.cashOnCash) },
                  { label: "10-YR ANNUALIZED", value: pct(r.annualized) },
                  { label: "CASH FLOW / MO", value: usdSigned(Math.round(r.cashFlowMonthly)) },
                ]}
              />

              <Plate
                label="FIG. 04 — EQUITY + CUMULATIVE CASH FLOW · 10 YEARS"
                style={{ marginTop: 24 }}
                footer="ASSUMES 3% ANNUAL APPRECIATION · 2% RENT GROWTH"
              >
                <EquityChart equity={r.equity} cumulative={r.cumulative} />
                <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                  <Legend color="#416180" label="Equity" />
                  <Legend color="#94bce3" label="Cash flow" />
                </div>
              </Plate>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 18,
                  marginTop: 22,
                }}
              >
                <Mini label="MONTHLY PAYMENT" value={usd(Math.round(r.payment))} />
                <Mini label="MONTHLY NOI" value={usd(Math.round(r.noiMonthly))} />
                <Mini label="CASH INVESTED" value={usd(Math.round(r.invested))} />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 22, alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!session || save.isPending}
                  onClick={() =>
                    save.mutate({ label: title, propertyId: propertyId ?? null, inputs })
                  }
                >
                  {save.isPending ? <Spinner /> : session ? "Save scenario · +25 PP" : "Sign in to save"}
                </button>
                <span className="micro text-muted">
                  SCENARIOS ARE STORED WITH THEIR INPUTS — RE-RUNNING GIVES THE SAME NUMBERS
                </span>
              </div>
            </>
          )}

          {session && scenarios.data?.length ? (
            <div style={{ marginTop: 30 }}>
              <h3 style={{ margin: "0 0 12px" }}>Saved scenarios</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Cap rate</th>
                    <th style={{ textAlign: "right" }}>Cash flow / mo</th>
                    <th style={{ width: 60 }} aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {scenarios.data.map((s) => {
                    const inp = s.inputs as RoiInputs;
                    const res = s.results as {
                      capRate: number;
                      cashFlowMonthly: number;
                    };
                    return (
                      <tr key={s.id}>
                        <td>{s.label}</td>
                        <td className="cond" style={{ textAlign: "right" }}>
                          {compactUsd(inp.price)}
                        </td>
                        <td className="cond" style={{ textAlign: "right" }}>
                          {pct(res.capRate)}
                        </td>
                        <td className="cond" style={{ textAlign: "right" }}>
                          {usdSigned(Math.round(res.cashFlowMonthly))}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-ghost micro"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate({ id: s.id })}
                          >
                            REMOVE
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="micro text-muted">{label}</div>
      <div className="cond" style={{ fontSize: 24 }}>
        {value}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="micro" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 18, height: 2, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

/** FIG. 04 — equity and cumulative cash flow, drawn on the blueprint grid. */
function EquityChart({ equity, cumulative }: { equity: number[]; cumulative: number[] }) {
  const yMax = Math.max(...equity, ...cumulative, 1);
  const x = (i: number) => 46 + (i / 10) * (720 - 46 - 16);
  const y = (v: number) => 190 - (v / yMax) * (190 - 20);
  const line = (series: number[]) => series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg viewBox="0 0 720 220" width="100%" height={220} aria-label="Equity and cumulative cash flow over ten years">
      <line x1={46} y1={190} x2={704} y2={190} stroke="var(--color-divider)" strokeWidth={1} />
      <line x1={46} y1={20} x2={46} y2={190} stroke="var(--color-divider)" strokeWidth={1} />
      <line x1={46} y1={130} x2={704} y2={130} stroke="var(--color-hairline)" strokeWidth={1} />
      <line x1={46} y1={70} x2={704} y2={70} stroke="var(--color-hairline)" strokeWidth={1} />

      <polyline points={line(equity)} fill="none" stroke="#416180" strokeWidth={2} />
      <polyline points={line(cumulative)} fill="none" stroke="#94bce3" strokeWidth={2} />

      <text x={46} y={208} fontSize={10} fill="currentColor" opacity={0.6}>
        Y0
      </text>
      <text x={x(5) - 8} y={208} fontSize={10} fill="currentColor" opacity={0.6}>
        Y5
      </text>
      <text x={x(10) - 18} y={208} fontSize={10} fill="currentColor" opacity={0.6}>
        Y10
      </text>
      <text x={2} y={24} fontSize={10} fill="currentColor" opacity={0.6}>
        {compactUsd(Math.round(yMax))}
      </text>
      <text x={2} y={190} fontSize={10} fill="currentColor" opacity={0.6}>
        $0
      </text>
    </svg>
  );
}
