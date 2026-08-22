import { Link, useLocation } from "wouter";
import { ThemeSwitch } from "./theme";
import { useMe } from "../queries/profile";
import { authClient } from "../lib/auth";

const LINKS = [
  { href: "/market-map", label: "Market map" },
  { href: "/properties/search", label: "Properties" },
  { href: "/marketplace", label: "Leads" },
  { href: "/renovation", label: "Analysis" },
  { href: "/tools/roi-calculator", label: "ROI" },
  { href: "/leaderboards", label: "Leaderboards" },
];

export function Nav() {
  const [location] = useLocation();
  const me = useMe();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "color-mix(in srgb, var(--color-bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "0 40px",
          height: 62,
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <Link
          to="/"
          className="cond"
          style={{
            fontSize: 19,
            letterSpacing: ".04em",
            color: "var(--color-text)",
            textDecoration: "none",
          }}
        >
          PROPERTY<span style={{ color: "var(--accent-ink)" }}>PULSE</span>
        </Link>

        <nav style={{ display: "flex", gap: 20, alignItems: "center", flex: 1 }}>
          {LINKS.map((l) => {
            const active = location.startsWith(l.href);
            return (
              <Link
                key={l.href}
                to={l.href}
                style={{
                  fontSize: 14,
                  textDecoration: "none",
                  color: active ? "var(--accent-ink)" : "var(--color-text)",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeSwitch />
          {me.isLoading ? (
            <span className="micro text-muted">…</span>
          ) : me.data ? (
            <>
              <Link
                to="/dashboard"
                className="tag tag-accent micro"
                style={{ textDecoration: "none" }}
              >
                {(me.data.primaryRole ?? "investor").toUpperCase()} ·{" "}
                {me.data.name?.split(" ")[0] ?? "You"}
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
                onClick={() => authClient.signOut().then(() => window.location.assign("/"))}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ fontSize: 13 }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--color-divider)", marginTop: 72 }}>
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "22px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <span
          className="micro"
          style={{ color: "var(--accent-ink)", letterSpacing: ".12em" }}
        >
          SAME INPUTS · SAME SCORES
        </span>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/pricing" className="micro" style={{ textDecoration: "none" }}>
            PRICING
          </Link>
          <Link to="/settings" className="micro" style={{ textDecoration: "none" }}>
            SETTINGS
          </Link>
          <span className="micro text-muted">
            © 2026 PropertyPulse · Central Florida investment intelligence
          </span>
        </div>
      </div>
    </footer>
  );
}
