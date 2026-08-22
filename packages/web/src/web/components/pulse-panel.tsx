import { Link } from "wouter";
import { Blueprint } from "./blueprint";
import { Sparkline } from "./figures";
import { Spinner } from "./layout";
import { useClaimBrief, usePulseProfile } from "../queries/gamification";
import { useSeasonBoards } from "../queries/leaderboards";
import { num } from "../lib/format";

/** The gamification surface shared by all three dashboards. */
export function PulsePanel() {
  const profile = usePulseProfile();
  const claim = useClaimBrief();

  if (profile.isLoading || !profile.data) {
    return (
      <Blueprint style={{ padding: 22, minHeight: 380 }}>
        <div className="micro text-muted">LOADING POSITION…</div>
      </Blueprint>
    );
  }

  const g = profile.data;
  const tier = g.tier;
  const next = tier.next;

  return (
    <Blueprint style={{ background: "var(--color-surface)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 18px",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <span className="micro" style={{ color: "var(--accent-ink)" }}>
          YOUR POSITION
        </span>
        <span
          className="micro"
          style={{ background: tier.chip.bg, color: tier.chip.fg, padding: "3px 8px" }}
        >
          {tier.key} · {tier.name.toUpperCase()}
        </span>
      </div>

      <div style={{ padding: "20px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div>
            <div className="cond" style={{ fontSize: 42, lineHeight: 1, color: "var(--accent-ink)" }}>
              {num(g.totalPoints)} PP
            </div>
            <div className="micro text-muted" style={{ marginTop: 8 }}>
              ▲ +{g.xpToday} TODAY · LEVEL {g.level.level}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Sparkline values={g.sparkline} />
            <div className="micro text-muted">30D</div>
          </div>
        </div>

        <div
          className="micro"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid var(--color-hairline)",
          }}
        >
          <span>
            #{g.leaderboard.position} IN LEAGUE
          </span>
          <span className="text-muted">STREAK: {g.streak} MARKET DAYS</span>
        </div>

        {next ? (
          <div style={{ marginTop: 18 }}>
            <div className="micro" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">NEXT: {next.name.toUpperCase()}</span>
              <span>{num(next.toGo)} PP TO GO</span>
            </div>
            <div style={{ height: 4, background: "var(--color-neutral-200)", marginTop: 7 }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.round(tier.progress * 100)}%`,
                  background: "var(--color-accent-700)",
                  transition: "width 400ms ease",
                }}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 20 }}
          disabled={g.briefClaimedToday || claim.isPending}
          onClick={() => claim.mutate({})}
        >
          {claim.isPending ? <Spinner /> : g.briefClaimedToday ? "Brief read — streak secured ✓" : "Read today's market brief · +15 PP"}
        </button>

        {g.badges.length ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
            {g.badges.map((b) => (
              <span key={b.id} className="tag tag-outline">
                {b.label}
              </span>
            ))}
          </div>
        ) : (
          <div className="micro text-muted" style={{ marginTop: 16 }}>
            NO BADGES YET — SAVE A PROPERTY TO OPEN THE BOOK
          </div>
        )}

        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          {g.nextMilestones.map((m) => (
            <div key={m.key}>
              <div className="micro" style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-muted">{m.label}</span>
                <span>
                  {m.current}/{m.target}
                </span>
              </div>
              <div style={{ height: 3, background: "var(--color-neutral-200)", marginTop: 6 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(m.current / m.target) * 100}%`,
                    background: "var(--color-accent-400)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Blueprint>
  );
}

/** League preview table beside the position panel. */
export function LeaguePreview() {
  const boards = useSeasonBoards();
  const profile = usePulseProfile();
  const league = profile.data?.league ?? "investor";
  const board = boards.data?.leagues.find((l) => l.key === league);
  const rows = (board?.rows ?? []).slice(0, 8);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{board?.label ?? "LEAGUE"}</h3>
        <Link to="/leaderboards" className="micro" style={{ textDecoration: "none" }}>
          ALL LEAGUES →
        </Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th style={{ width: 44 }}>Δ</th>
            <th>Member</th>
            <th>Tier</th>
            <th style={{ textAlign: "right" }}>Season PP</th>
            <th style={{ textAlign: "right" }}>7d</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              style={{
                background: r.isYou ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : undefined,
              }}
            >
              <td className="cond">{r.rank}</td>
              <td className="micro text-muted">
                {r.rankDelta === 0 ? "—" : r.rankDelta > 0 ? `▲${r.rankDelta}` : `▼${Math.abs(r.rankDelta)}`}
              </td>
              <td
                style={{
                  color: r.ticker ? "var(--accent-ink)" : undefined,
                  fontWeight: r.ticker ? 600 : 400,
                  fontStyle: r.anonymous && !r.ticker ? "italic" : "normal",
                }}
              >
                {r.ticker ? `$${r.name}` : r.name}
                {r.isYou ? " — YOU" : ""}
              </td>
              <td className="micro">{r.tier}</td>
              <td className="cond" style={{ textAlign: "right" }}>
                {num(r.seasonPp)}
              </td>
              <td className="micro" style={{ textAlign: "right" }}>
                +{num(r.delta7d)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="micro text-muted" style={{ marginTop: 12 }}>
        {num(board?.rows.length ?? 0)} MEMBERS · RANKINGS RESET EACH TRADING QUARTER · LIFETIME TIERS NEVER RESET
      </div>
    </div>
  );
}
