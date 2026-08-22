import { Link } from "wouter";
import { Blueprint, PageHead } from "../components/blueprint";
import { Loading, Spinner } from "../components/layout";
import { useCurrentPlan, usePlans, useSubscribe } from "../queries/billing";
import { useMe } from "../queries/profile";

const INDEX: Record<string, string> = { free: "01", investor: "02", desk: "03" };

/** PP-11 — plans. Payments are deliberately stubbed: state changes, no charge. */
export default function PricingPage() {
  const me = useMe();
  const plans = usePlans();
  const current = useCurrentPlan(Boolean(me.data));
  const subscribe = useSubscribe();

  const activeKey = current.data?.plan ?? "free";

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-11 · PRICING"
        title={
          <>
            Start free.
            <br />
            Upgrade when the tools earn it.
          </>
        }
        sub="Same scores on every plan. Paid tiers unlock the working surfaces — alerts, saved scenarios, stress tests, lead credit."
        right="NO CARD REQUIRED · PAYMENTS ARE STUBBED"
      />

      {plans.isLoading || !plans.data ? (
        <Loading label="LOADING PLANS" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 26 }}>
          {plans.data.map((p) => {
            const active = activeKey === p.key;
            return (
              <Blueprint
                key={p.key}
                as="article"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: active ? "var(--color-surface)" : "transparent",
                  outline: active ? "1px solid var(--color-accent)" : "none",
                }}
              >
                <div
                  className="micro"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "9px 16px",
                    borderBottom: "1px solid var(--color-divider)",
                    color: "var(--accent-ink)",
                  }}
                >
                  <span>
                    {INDEX[p.key]} — {p.name}
                  </span>
                  <span className="text-muted">{active ? "CURRENT PLAN" : p.audience.toUpperCase()}</span>
                </div>

                <div style={{ padding: "22px 18px", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span className="cond" style={{ fontSize: 46, lineHeight: 1 }}>
                      ${p.priceMonthly}
                    </span>
                    <span className="micro text-muted">/ MO</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: 14, margin: "14px 0 18px", minHeight: 62 }}>
                    {p.blurb}
                  </p>
                  <div className="hr" style={{ margin: "0 0 14px" }} />
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 9 }}>
                    {p.features.map((f) => (
                      <li key={f} style={{ fontSize: 14, display: "flex", gap: 9 }}>
                        <span style={{ color: "var(--accent-ink)" }}>+</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: "0 18px 18px" }}>
                  {me.data ? (
                    <button
                      type="button"
                      className={`btn btn-block ${p.key === "investor" ? "btn-primary" : "btn-secondary"}`}
                      disabled={active || (subscribe.isPending && subscribe.variables?.plan === p.key)}
                      onClick={() => subscribe.mutate({ plan: p.key })}
                    >
                      {subscribe.isPending && subscribe.variables?.plan === p.key ? <Spinner /> : null}
                      {active
                        ? "Current plan"
                        : p.priceMonthly === 0
                          ? "Switch to Observer"
                          : `Choose ${p.name.charAt(0)}${p.name.slice(1).toLowerCase()}`}
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      className={`btn btn-block ${p.key === "investor" ? "btn-primary" : "btn-secondary"}`}
                      style={{ textDecoration: "none" }}
                    >
                      Create an account
                    </Link>
                  )}
                </div>
              </Blueprint>
            );
          })}
        </div>
      )}

      <div
        className="micro text-muted"
        style={{
          borderTop: "1px solid var(--color-divider)",
          marginTop: 30,
          paddingTop: 12,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span>NO CARD CHARGED — PAYMENTS ARE STUBBED IN THIS BUILD</span>
        <span style={{ color: "var(--accent-ink)" }}>
          LEADS ARE PRICED SEPARATELY · REALTOR FROM $500 · CONTRACTOR $500
        </span>
      </div>
    </div>
  );
}
