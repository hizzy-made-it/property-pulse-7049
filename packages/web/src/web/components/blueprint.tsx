import type { CSSProperties, ReactNode } from "react";

interface BlueprintProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Drop the four `+` registration marks (used inside dense tables). */
  bare?: boolean;
  as?: "div" | "section" | "article" | "aside" | "figure";
}

/** Zero-radius frame with the four corner registration marks. */
export function Blueprint({
  children,
  className = "",
  style,
  bare = false,
  as: Tag = "div",
}: BlueprintProps) {
  return (
    <Tag className={`blueprint ${className}`} style={style}>
      {!bare && (
        <>
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
        </>
      )}
      {children}
    </Tag>
  );
}

interface PlateProps extends BlueprintProps {
  /** FIG. 01 — style caption on the plate's head rule. */
  label?: ReactNode;
  right?: ReactNode;
  footer?: ReactNode;
  bodyStyle?: CSSProperties;
}

/** Blueprint plate: hairline head rule with a FIG. label, body, optional foot rule. */
export function Plate({
  label,
  right,
  footer,
  children,
  className = "",
  style,
  bodyStyle,
}: PlateProps) {
  return (
    <Blueprint className={className} style={style}>
      {label || right ? (
        <div
          className="micro"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "9px 14px",
            borderBottom: "1px solid var(--color-divider)",
            color: "var(--accent-ink)",
          }}
        >
          <span>{label}</span>
          {right ? <span style={{ color: "var(--color-muted)" }}>{right}</span> : null}
        </div>
      ) : null}
      <div style={{ padding: "16px", ...bodyStyle }}>{children}</div>
      {footer ? (
        <div
          className="micro"
          style={{
            padding: "9px 14px",
            borderTop: "1px solid var(--color-divider)",
            color: "var(--color-muted)",
          }}
        >
          {footer}
        </div>
      ) : null}
    </Blueprint>
  );
}

/** `PP-NN · SECTION` kicker over the page h1. */
export function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
        marginBottom: 22,
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>
          {kicker}
        </div>
        <h1 style={{ margin: 0 }}>{title}</h1>
        {sub ? (
          <p className="text-muted" style={{ margin: "10px 0 0", fontSize: 16, maxWidth: 620 }}>
            {sub}
          </p>
        ) : null}
      </div>
      {right ? (
        <div className="micro" style={{ color: "var(--color-muted)", paddingBottom: 6 }}>
          {right}
        </div>
      ) : null}
    </header>
  );
}
