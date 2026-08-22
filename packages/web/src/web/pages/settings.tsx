import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Blueprint, PageHead, Plate } from "../components/blueprint";
import { Loading, Spinner } from "../components/layout";
import { ThemeSwitch } from "../components/theme";
import { useAddRole, useMe, useRemoveRole, useSetPrimaryRole } from "../queries/profile";
import { usePulseProfile, useSetIdentity, useSetLeague } from "../queries/gamification";
import { useCurrentPlan } from "../queries/billing";
import { authClient } from "../lib/auth";

type Role = "investor" | "realtor" | "contractor";
const ROLES: Role[] = ["investor", "realtor", "contractor"];
const LEAGUES: { key: Role; label: string }[] = [
  { key: "investor", label: "Investor league" },
  { key: "realtor", label: "Realtor league" },
  { key: "contractor", label: "Contractor league" },
];

export default function SettingsPage() {
  const me = useMe();
  const pulse = usePulseProfile();
  const plan = useCurrentPlan();
  const addRole = useAddRole();
  const removeRole = useRemoveRole();
  const setPrimary = useSetPrimaryRole();
  const setLeague = useSetLeague();
  const setIdentity = useSetIdentity();

  const [ticker, setTicker] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [tickerError, setTickerError] = useState<string | null>(null);

  useEffect(() => {
    if (pulse.data) {
      setTicker(pulse.data.ticker ?? "");
      setAnonymous(pulse.data.anonymous);
    }
  }, [pulse.data]);

  if (me.isLoading || !me.data) return <Loading label="LOADING ACCOUNT" />;

  const roles = me.data.roles;
  const saveIdentity = () => {
    const value = ticker.trim().toUpperCase();
    if (value && !/^[A-Z]{2,5}$/.test(value)) {
      setTickerError("2–5 uppercase letters, e.g. ORL.");
      return;
    }
    setTickerError(null);
    setIdentity.mutate({ anonymous, ticker: value || null });
  };

  return (
    <div className="pp-rise">
      <PageHead
        kicker="PP-12 · SETTINGS"
        title="Account and desk"
        sub="Roles decide which dashboards you see. League decides which leaderboard you are scored against."
        right={me.data.email.toUpperCase()}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 34, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 26 }}>
          {/* ── roles ─────────────────────────────────────────────────── */}
          <Plate label="ROLES" right={`${roles.length} ACTIVE`}>
            <div style={{ display: "grid", gap: 12 }}>
              {ROLES.map((role) => {
                const held = roles.includes(role);
                const isPrimary = me.data?.primaryRole === role;
                return (
                  <div
                    key={role}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 14,
                      borderBottom: "1px solid var(--color-divider)",
                      paddingBottom: 12,
                    }}
                  >
                    <div>
                      <div className="cond" style={{ fontSize: 18, textTransform: "capitalize" }}>
                        {role}
                      </div>
                      <div className="micro text-muted" style={{ marginTop: 3 }}>
                        {held ? (isPrimary ? "PRIMARY DASHBOARD" : "ACTIVE") : "NOT ENABLED"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {held && !isPrimary ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: 12 }}
                          disabled={setPrimary.isPending}
                          onClick={() => setPrimary.mutate({ role })}
                        >
                          {setPrimary.isPending && setPrimary.variables?.role === role ? <Spinner /> : null}
                          Make primary
                        </button>
                      ) : null}
                      {held ? (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ fontSize: 12 }}
                          disabled={roles.length === 1 || removeRole.isPending}
                          onClick={() => removeRole.mutate({ role })}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: 12 }}
                          disabled={addRole.isPending}
                          onClick={() => addRole.mutate({ role, primary: roles.length === 0 })}
                        >
                          {addRole.isPending && addRole.variables?.role === role ? <Spinner /> : null}
                          Add role
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Plate>

          {/* ── league + identity ─────────────────────────────────────── */}
          <Plate label="LEAGUE + IDENTITY" right={pulse.data ? `SEASON ${pulse.data.season}` : undefined}>
            <div className="micro text-muted" style={{ marginBottom: 10 }}>
              SCORED LEAGUE
            </div>
            <div className="seg" style={{ marginBottom: 22 }}>
              {LEAGUES.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  className="seg-opt"
                  aria-pressed={pulse.data?.league === l.key}
                  disabled={setLeague.isPending}
                  onClick={() => setLeague.mutate({ league: l.key })}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 18, alignItems: "end" }}>
              <div className="field">
                <label htmlFor="ticker">Ticker</label>
                <input
                  id="ticker"
                  aria-label="Ticker"
                  className="input"
                  value={ticker}
                  maxLength={5}
                  placeholder="ORL"
                  onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                />
              </div>
              <button
                type="button"
                onClick={() => setAnonymous((v) => !v)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  color: "var(--color-text)",
                  paddingBottom: 10,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "1px solid var(--color-text)",
                    background: anonymous ? "var(--color-accent-700)" : "transparent",
                  }}
                />
                Compete anonymously on the public boards
              </button>
            </div>
            {tickerError ? (
              <div className="micro" style={{ color: "var(--accent-ink-strong)", marginTop: 10 }}>
                {tickerError}
              </div>
            ) : null}
            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={setIdentity.isPending}
                onClick={saveIdentity}
              >
                {setIdentity.isPending ? <Spinner /> : null}
                Save identity
              </button>
            </div>
          </Plate>

          {/* ── appearance ────────────────────────────────────────────── */}
          <Plate label="APPEARANCE" right="BLUEPRINT GROUND">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 18,
              }}
            >
              <p className="text-muted" style={{ margin: 0, fontSize: 14, maxWidth: 420 }}>
                Light is the drafting-table ground. Dark inverts to an accent-900 blueprint — same weights, same
                scores, less glare.
              </p>
              <ThemeSwitch />
            </div>
          </Plate>
        </div>

        {/* ── sidebar ─────────────────────────────────────────────────── */}
        <aside style={{ display: "grid", gap: 26, position: "sticky", top: 92 }}>
          <Blueprint style={{ padding: 18, background: "var(--color-surface)" }}>
            <div className="micro" style={{ color: "var(--accent-ink)", marginBottom: 12 }}>
              ACCOUNT
            </div>
            <div className="cond" style={{ fontSize: 22 }}>
              {me.data.name || "—"}
            </div>
            <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
              {me.data.email}
            </div>
            <div className="hr" style={{ margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span className="text-muted">Plan</span>
              <span>{plan.data?.name ?? "OBSERVER"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8 }}>
              <span className="text-muted">Season points</span>
              <span>{pulse.data ? `${pulse.data.totalPoints} PP` : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8 }}>
              <span className="text-muted">Tier</span>
              <span>{pulse.data ? `${pulse.data.tier.key} · ${pulse.data.tier.name}` : "—"}</span>
            </div>
            <div style={{ marginTop: 18, display: "grid", gap: 9 }}>
              <Link to="/pricing" className="btn btn-secondary btn-block" style={{ textDecoration: "none" }}>
                Manage plan
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => authClient.signOut().then(() => window.location.assign("/"))}
              >
                Sign out
              </button>
            </div>
          </Blueprint>

          {me.data.roles.includes("admin") ? (
            <Blueprint style={{ padding: 18 }}>
              <div className="micro" style={{ color: "var(--accent-ink)", marginBottom: 10 }}>
                ADMIN
              </div>
              <p className="text-muted" style={{ fontSize: 13, margin: "0 0 14px" }}>
                You hold the data spine. Edit ZIPs, listings, and leads directly.
              </p>
              <Link to="/admin" className="btn btn-secondary btn-block" style={{ textDecoration: "none" }}>
                Open data editor
              </Link>
            </Blueprint>
          ) : null}

          <div className="micro text-muted" style={{ lineHeight: 1.7 }}>
            SAME INPUTS · SAME SCORES. CHANGING YOUR LEAGUE MOVES YOUR SEASON POINTS TO THE NEW BOARD AT THE NEXT
            REFRESH — IT NEVER RE-ROLLS THEM.
          </div>
        </aside>
      </div>
    </div>
  );
}
