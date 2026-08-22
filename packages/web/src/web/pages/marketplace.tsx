import { useState } from "react";
import { Link } from "wouter";
import { Blueprint, PageHead } from "../components/blueprint";
import { EmptyState, Loading, Spinner } from "../components/layout";
import { useBuyLead, useLeads } from "../queries/leads";
import { useMe } from "../queries/profile";
import { useSession } from "../lib/auth";
import { num, usd } from "../lib/format";

const TIERS = ["All", "Premium", "Standard", "Basic"];
const EXCLUSIVITY = ["All", "Exclusive", "Shared"];

export default function MarketplacePage() {
  const me = useMe();
  const { data: session } = useSession();
  const audience: "realtor" | "contractor" =
    me.data?.primaryRole === "contractor" ? "contractor" : "realtor";

  const [tier, setTier] = useState("All");
  const [exclusivity, setExclusivity] = useState("All");
  const leads = useLeads({ audience, tier, exclusivity });
  const buy = useBuyLead();

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-07 · LEAD MARKETPLACE"
        title="Qualified leads. Max 3 buyers each."
        right={
          <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
            <div className="seg" aria-label="Tier">
              {TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="seg-opt"
                  aria-pressed={tier === t}
                  onClick={() => setTier(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="seg" aria-label="Exclusivity">
              {EXCLUSIVITY.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="seg-opt"
                  aria-pressed={exclusivity === e}
                  onClick={() => setExclusivity(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {leads.isLoading ? (
        <Loading label="SCORING LEADS" />
      ) : leads.data?.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 24 }}>
          {leads.data.map((lead) => (
            <Blueprint key={lead.id}>
              <div style={{ padding: "16px 18px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="tag tag-accent">{lead.tier.toUpperCase()}</span>
                  <span className="tag tag-outline">{lead.exLabel}</span>
                  <span className="micro text-muted" style={{ marginLeft: "auto" }}>
                    {lead.expiresLabel}
                  </span>
                </div>

                <h3 style={{ margin: "14px 0 4px" }}>{lead.property.addr}</h3>
                <div className="micro text-muted">{lead.specLine}</div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginTop: 16,
                  }}
                >
                  <span className="micro text-muted">Lead score</span>
                  <span className="cond" style={{ fontSize: 20, color: "var(--accent-ink)" }}>
                    {lead.score} / 100
                  </span>
                </div>
                <div style={{ height: 4, background: "var(--color-neutral-200)", marginTop: 7 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${lead.score}%`,
                      background: "var(--color-accent-700)",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    marginTop: 16,
                    borderTop: "1px solid var(--color-hairline)",
                    borderBottom: "1px solid var(--color-hairline)",
                  }}
                >
                  {[
                    { label: "LOCATION", value: lead.location },
                    { label: "TREND", value: lead.trend },
                    { label: "FINANCIAL", value: lead.financial },
                    { label: "DEMAND", value: lead.demand },
                  ].map((c, i) => (
                    <div
                      key={c.label}
                      style={{
                        padding: "10px 12px",
                        borderLeft: i === 0 ? "none" : "1px solid var(--color-hairline)",
                      }}
                    >
                      <div className="micro text-muted">{c.label}</div>
                      <div className="cond" style={{ fontSize: 18 }}>
                        {c.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                    marginTop: 14,
                  }}
                >
                  <Cell label="LIST PRICE" value={usd(lead.property.price)} />
                  <Cell label="EST. ROI" value={lead.roi} />
                  <Cell label="CONVERSION EST." value={lead.conversion} />
                </div>

                <p className="text-muted" style={{ fontSize: 13, margin: "14px 0 0" }}>
                  {lead.insight}
                </p>

                <div
                  className="micro text-muted"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 14,
                    paddingTop: 10,
                    borderTop: "1px solid var(--color-hairline)",
                  }}
                >
                  <span>
                    {num(lead.views)} VIEWS · {lead.interested} INTERESTED
                  </span>
                  <span>{lead.property.dom} D ON MARKET</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 14 }}>
                  {session ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={lead.purchased || (buy.isPending && buy.variables?.leadId === lead.id)}
                      onClick={() => buy.mutate({ leadId: lead.id })}
                    >
                      {buy.isPending && buy.variables?.leadId === lead.id ? (
                        <Spinner />
                      ) : lead.purchased ? (
                        "Purchased ✓"
                      ) : (
                        `Buy lead — ${usd(lead.price)}`
                      )}
                    </button>
                  ) : (
                    <Link to="/auth" className="btn btn-primary" style={{ textDecoration: "none" }}>
                      Sign in to buy
                    </Link>
                  )}
                  <Link
                    to={`/properties/${lead.property.id}`}
                    className="btn btn-secondary"
                    style={{ textDecoration: "none" }}
                  >
                    Details
                  </Link>
                </div>
              </div>
            </Blueprint>
          ))}
        </div>
      ) : (
        <EmptyState>No leads match these filters right now. New leads post daily.</EmptyState>
      )}

      <div className="micro text-muted" style={{ marginTop: 24 }}>
        PRICING RULE: LEAD PRICE DROPS BY $50 AFTER 7 DAYS UNSOLD · SCORES ARE FIXED AT LISTING TIME
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="micro text-muted">{label}</div>
      <div className="cond" style={{ fontSize: 18 }}>
        {value}
      </div>
    </div>
  );
}
