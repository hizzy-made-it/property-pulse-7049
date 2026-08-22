import { useState } from "react";
import { Link } from "wouter";
import { Blueprint, PageHead, Plate } from "../components/blueprint";
import { HeatGrid, HeatLegend, type HeatCell } from "../components/heat-grid";
import { Loading } from "../components/layout";
import { useHeat, useZips } from "../queries/zips";
import { compactUsd, num, pctSigned } from "../lib/format";
import type { HeatMetric } from "../queries/zips";

const METRICS: { key: HeatMetric; label: string; col: string }[] = [
  { key: "emerging", label: "Emerging score", col: "Emerging" },
  { key: "velocity", label: "Price velocity", col: "6M velocity" },
  { key: "permits", label: "Permit activity", col: "Permits" },
];

export default function MarketMapPage() {
  const [metric, setMetric] = useState<HeatMetric>("emerging");
  const [pinned, setPinned] = useState<string | null>(null);
  const heat = useHeat(metric);
  const zips = useZips();

  const active = METRICS.find((m) => m.key === metric)!;
  const pin = zips.data?.find((z) => z.zip === pinned) ?? null;

  const cellValue = (z: NonNullable<typeof zips.data>[number]) =>
    metric === "velocity"
      ? pctSigned(z.priceVelocity)
      : metric === "permits"
        ? num(z.permits)
        : `${z.emergingScore}`;

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-02 · MARKET MAP"
        title="ZIP heat, Central Florida"
        right={
          <div className="seg" aria-label="Heat metric">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                className="seg-opt"
                aria-pressed={metric === m.key}
                onClick={() => setMetric(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 28 }}>
        <Plate
          label={`FIG. 02 — ${active.label.toUpperCase()} BY ZIP · 214 REGIONS`}
          right="HOVER A CELL FOR DETAIL"
          footer={
            <div style={{ display: "grid", gap: 10 }}>
              <span>SOURCE: MLS · PERMITS · CENSUS — REFRESHED WEEKLY</span>
              <HeatLegend low="0" high="100" />
            </div>
          }
        >
          {heat.isLoading ? (
            <Loading label="LOADING HEAT" />
          ) : (
            <HeatGrid
              cells={heat.data?.cells ?? []}
              columns={18}
              count={216}
              cellHeight={28}
              onPick={(c: HeatCell) => setPinned(c.zip)}
            />
          )}
        </Plate>

        <aside style={{ display: "grid", gap: 20, alignContent: "start" }}>
          <Blueprint style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 20 }}>Top opportunities</h3>
              <span className="micro text-muted">CLICK A ROW TO PIN</span>
            </div>
            {zips.isLoading ? (
              <Loading />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ZIP</th>
                    <th>Avg price</th>
                    <th>{active.col}</th>
                  </tr>
                </thead>
                <tbody>
                  {(zips.data ?? [])
                    .slice()
                    .sort((a, b) =>
                      metric === "velocity"
                        ? b.priceVelocity - a.priceVelocity
                        : metric === "permits"
                          ? b.permits - a.permits
                          : b.emergingScore - a.emergingScore,
                    )
                    .slice(0, 8)
                    .map((z, i) => (
                      <tr
                        key={z.zip}
                        onClick={() => setPinned(z.zip)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="text-muted">{i + 1}</td>
                        <td>
                          <div>{z.zip}</div>
                          <div className="micro text-muted">{z.name}</div>
                        </td>
                        <td>{compactUsd(z.avgPrice)}</td>
                        <td style={{ color: "var(--accent-ink)" }}>{cellValue(z)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </Blueprint>

          {pin ? (
            <Plate label={`PINNED — ${pin.zip} ${pin.name}`}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <Field label="EMERGING" value={`${pin.emergingScore}`} />
                <Field label="6M PRICE" value={pctSigned(pin.priceVelocity)} />
                <Field label="PERMITS" value={num(pin.permits)} />
                <Field label="6M" value={`${pin.inventoryMonths.toFixed(1)} MO INV`} />
              </div>
              <Link
                to={`/properties/search?zip=${pin.zip}`}
                className="btn btn-primary btn-block"
              >
                See listings in {pin.zip}
              </Link>
            </Plate>
          ) : null}

          <Plate label="READING THE SCORE">
            <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
              80–100 strong emerging · 60–79 moderate growth · below 60 stable or declining.
            </p>
            <p className="text-muted" style={{ margin: "10px 0 0", fontSize: 14 }}>
              Signals: permit trend, inventory tightening, price acceleration, new business
              filings.
            </p>
          </Plate>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="micro text-muted" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div className="cond" style={{ fontSize: 20 }}>
        {value}
      </div>
    </div>
  );
}
