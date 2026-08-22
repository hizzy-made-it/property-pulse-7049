import { photoFor } from "../lib/format";

/** 30-day PulsePoints sparkline. */
export function Sparkline({
  values,
  width = 130,
  height = 40,
  stroke = "var(--color-accent-600)",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (!values.length) return <svg width={width} height={height} />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 4) - 2).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}

/** Hairline sub-score bar — label, value, ramp. */
export function ScoreBar({
  label,
  value,
  max = 100,
  accent = false,
}: {
  label: string;
  value: number;
  max?: number;
  accent?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 5,
        }}
      >
        <span className="micro" style={{ color: "var(--color-muted)" }}>
          {label}
        </span>
        <span className="cond" style={{ fontSize: 15 }}>
          {Math.round(value)}
        </span>
      </div>
      <div style={{ height: 4, background: "var(--color-neutral-200)" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: accent ? "var(--color-accent-700)" : "var(--color-accent-400)",
            transition: "width 300ms ease",
          }}
        />
      </div>
    </div>
  );
}

/** Duotoned photography frame. Photos live in public/images/properties. */
export function Photo({
  seed,
  height,
  alt,
  src,
}: {
  seed: string;
  height: number;
  alt: string;
  src?: string;
}) {
  return (
    <div className="duotone" style={{ height, background: "var(--color-neutral-200)" }}>
      <img
        src={src ?? photoFor(seed)}
        alt={alt}
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1)" }}
      />
    </div>
  );
}

/** Uppercase micro stat used across the hairline strips. */
export function Stat({
  label,
  value,
  accent = false,
  size = 34,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  size?: number;
}) {
  return (
    <div>
      <div className="micro" style={{ color: "var(--color-muted)", marginBottom: 6 }}>
        {label}
      </div>
      <div
        className="cond"
        style={{ fontSize: size, lineHeight: 1, color: accent ? "var(--accent-ink)" : undefined }}
      >
        {value}
      </div>
    </div>
  );
}

/** Hairline strip of stats — the recurring 4-cell row. */
export function StatStrip({
  items,
  columns,
  size = 34,
}: {
  items: { label: string; value: React.ReactNode; accent?: boolean }[];
  columns?: number;
  size?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns ?? items.length}, minmax(0, 1fr))`,
        borderTop: "1px solid var(--color-divider)",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          style={{
            padding: "16px 18px",
            borderLeft: i === 0 ? "none" : "1px solid var(--color-hairline)",
          }}
        >
          <Stat label={item.label} value={item.value} accent={item.accent} size={size} />
        </div>
      ))}
    </div>
  );
}
