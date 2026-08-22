import { useMemo, useState } from "react";

export interface HeatCell {
  zip: string;
  name: string;
  county?: string;
  raw: number;
  display: string;
  intensity: number;
}

/**
 * Deterministic heat figure. The renderer is the only thing that has to change
 * when a real choropleth is swapped in — the cell contract stays as-is.
 */
export function heatColor(intensity: number) {
  const t = Math.max(0, Math.min(1, intensity));
  return t < 0.5
    ? `color-mix(in srgb, var(--heat-mid) ${t * 200}%, var(--heat-low))`
    : `color-mix(in srgb, var(--heat-high) ${(t - 0.5) * 200}%, var(--heat-mid))`;
}

/** Expand a small ZIP set into a full grid of cells, deterministically. */
export function expandCells(cells: HeatCell[], count: number): HeatCell[] {
  if (!cells.length) return [];
  const out: HeatCell[] = [];
  for (let i = 0; i < count; i++) {
    const base = cells[i % cells.length];
    // A fixed pseudo-noise keeps the plate looking like a region, not a repeat.
    const jitter = (((i * 2654435761) % 1000) / 1000 - 0.5) * 0.34;
    out.push({ ...base, intensity: Math.max(0.02, Math.min(1, base.intensity + jitter)) });
  }
  return out;
}

interface HeatGridProps {
  cells: HeatCell[];
  columns: number;
  count?: number;
  cellHeight?: number;
  gap?: number;
  interactive?: boolean;
  onPick?: (cell: HeatCell) => void;
}

export function HeatGrid({
  cells,
  columns,
  count,
  cellHeight = 26,
  gap = 3,
  interactive = true,
  onPick,
}: HeatGridProps) {
  const [hover, setHover] = useState<number | null>(null);
  const rendered = useMemo(
    () => (count ? expandCells(cells, count) : cells),
    [cells, count],
  );

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap,
        }}
      >
        {rendered.map((cell, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${cell.zip} ${cell.name} — ${cell.display}`}
            title={interactive ? `${cell.zip} ${cell.name} — ${cell.display}` : undefined}
            onMouseEnter={() => interactive && setHover(i)}
            onMouseLeave={() => interactive && setHover(null)}
            onFocus={() => interactive && setHover(i)}
            onBlur={() => interactive && setHover(null)}
            onClick={() => onPick?.(cell)}
            style={{
              display: "block",
              width: "100%",
              padding: 0,
              border: "none",
              borderRadius: 0,
              font: "inherit",
              appearance: "none",
              height: cellHeight,
              background: heatColor(cell.intensity),
              outline: hover === i ? "2px solid var(--color-text)" : "none",
              outlineOffset: -1,
              cursor: onPick ? "pointer" : "default",
              transition: "outline-color 120ms ease",
            }}
          />
        ))}
      </div>
      {interactive && hover !== null ? (
        <div
          className="micro"
          style={{ marginTop: 10, color: "var(--accent-ink)", minHeight: 14 }}
        >
          {rendered[hover].zip} {rendered[hover].name} — {rendered[hover].display}
        </div>
      ) : null}
    </div>
  );
}

/** LOW → HIGH ramp bar used under every heat plate. */
export function HeatLegend({ low = "LOW", high = "HIGH" }: { low?: string; high?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="micro" style={{ color: "var(--color-muted)" }}>
        {low}
      </span>
      <div
        style={{
          flex: 1,
          height: 6,
          background:
            "linear-gradient(90deg, var(--heat-low), var(--heat-mid), var(--heat-high))",
        }}
      />
      <span className="micro" style={{ color: "var(--color-muted)" }}>
        {high}
      </span>
    </div>
  );
}
