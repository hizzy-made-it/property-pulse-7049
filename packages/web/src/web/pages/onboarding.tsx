import { useState } from "react";
import { useLocation } from "wouter";
import { Blueprint, PageHead } from "../components/blueprint";
import { Loading, Spinner } from "../components/layout";
import { useAddRole, useMe } from "../queries/profile";

type Role = "investor" | "realtor" | "contractor";

const ROLES: { key: Role; index: string; label: string; blurb: string; price: string; bullets: string[] }[] = [
  {
    key: "investor",
    index: "01",
    label: "Investor",
    blurb: "Score ZIPs, stress-test deals, and get alerted when a market moves.",
    price: "FROM $99 / MO",
    bullets: ["Buy / pass verdicts", "ROI + stress test", "ZIP alerts"],
  },
  {
    key: "realtor",
    index: "02",
    label: "Realtor",
    blurb: "Buy qualified investor leads. Max three buyers per lead, ever.",
    price: "FROM $500 / LEAD",
    bullets: ["Qualified buyer leads", "Exclusivity caps", "Conversion scoring"],
  },
  {
    key: "contractor",
    index: "03",
    label: "Contractor",
    blurb: "Reach investors the moment a renovation scope is priced.",
    price: "$500 / LEAD",
    bullets: ["Scoped project leads", "Trade match table", "Expansion signals"],
  },
];

/** Role picker shown once after signup. Multiple roles are allowed. */
export default function OnboardingPage() {
  const me = useMe();
  const addRole = useAddRole();
  const [, navigate] = useLocation();
  const [picked, setPicked] = useState<Role[]>([]);

  if (me.isLoading) return <Loading label="LOADING ACCOUNT" />;

  const toggle = (role: Role) =>
    setPicked((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  const submit = async () => {
    for (const [i, role] of picked.entries()) {
      await addRole.mutateAsync({ role, primary: i === 0 });
    }
    navigate("/dashboard");
  };

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-06 · ACCOUNT SETUP"
        title={
          <>
            How do you work
            <br />
            this market?
          </>
        }
        sub="Pick every side you operate on. Your first pick becomes the dashboard you land on — you can change or add roles later in settings."
        right="ONE ACCOUNT · MULTIPLE ROLES"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 26 }}>
        {ROLES.map((r) => {
          const on = picked.includes(r.key);
          const order = picked.indexOf(r.key);
          return (
            <Blueprint
              key={r.key}
              as="article"
              style={{
                padding: 20,
                cursor: "pointer",
                background: on ? "var(--color-surface)" : "transparent",
                outline: on ? "1px solid var(--color-accent)" : "none",
              }}
            >
              <button
                type="button"
                onClick={() => toggle(r.key)}
                aria-pressed={on}
                style={{
                  all: "unset",
                  display: "block",
                  width: "100%",
                  cursor: "pointer",
                  color: "var(--color-text)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 14,
                  }}
                >
                  <span className="micro" style={{ color: "var(--accent-ink)" }}>
                    {r.index} — {r.label.toUpperCase()}
                  </span>
                  <span className="micro text-muted">
                    {on ? (order === 0 ? "PRIMARY ✓" : "ADDED ✓") : "SELECT"}
                  </span>
                </div>
                <h3 style={{ margin: "0 0 8px" }}>{r.label}</h3>
                <p className="text-muted" style={{ fontSize: 14, margin: "0 0 16px", minHeight: 60 }}>
                  {r.blurb}
                </p>
                <div className="hr" style={{ margin: "0 0 12px" }} />
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7 }}>
                  {r.bullets.map((b) => (
                    <li key={b} className="text-muted" style={{ fontSize: 13 }}>
                      · {b}
                    </li>
                  ))}
                </ul>
                <div className="micro" style={{ marginTop: 16, color: "var(--accent-ink)" }}>
                  {r.price}
                </div>
              </button>
            </Blueprint>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          marginTop: 28,
          flexWrap: "wrap",
        }}
      >
        <span className="micro text-muted">
          {picked.length === 0
            ? "SELECT AT LEAST ONE ROLE TO CONTINUE"
            : `${picked.length} ROLE${picked.length > 1 ? "S" : ""} SELECTED · PRIMARY: ${picked[0].toUpperCase()}`}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          disabled={picked.length === 0 || addRole.isPending}
          onClick={submit}
        >
          {addRole.isPending ? <Spinner /> : null}
          {addRole.isPending ? "Setting up…" : "Enter the desk"}
        </button>
      </div>
    </div>
  );
}
