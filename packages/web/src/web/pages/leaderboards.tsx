import { Blueprint, PageHead } from "../components/blueprint";
import { Loading } from "../components/layout";
import { useSeasonBoards } from "../queries/leaderboards";
import { num } from "../lib/format";

const BLURBS: Record<string, string> = {
  investor: "Analyses run, markets watched, portfolios stress-tested.",
  realtor: "Lead response speed, qualifications, and closed deals.",
  contractor: "Completed projects and five-star craftsmanship.",
};

export default function LeaderboardsPage() {
  const boards = useSeasonBoards();

  if (boards.isLoading || !boards.data) {
    return (
      <div className="pp-rise">
        <PageHead kicker="PP-10 · LEADERBOARDS" title="Three leagues. One market." />
        <Loading label="SETTLING THE TAPE" />
      </div>
    );
  }

  const { season, leagues, tape } = boards.data;

  return (
    <div className="pp-rise">
      <PageHead
        kicker={`PP-10 · LEADERBOARDS · ${season}`}
        title="Three leagues. One market."
        sub="PulsePoints reward real work — market research, fast lead response, finished projects. Rankings reset each Trading Quarter."
      />

      <Blueprint style={{ overflow: "hidden", padding: "9px 0", marginBottom: 30 }}>
        <div className="pp-ticker" style={{ display: "flex", width: "max-content" }}>
          {[0, 1].map((copy) => (
            <div key={copy} style={{ display: "flex", gap: 28, paddingRight: 28 }}>
              {tape.map((t, i) => (
                <span key={`${copy}-${i}`} className="micro" style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: "var(--accent-ink)" }}>{t.name}</span>{" "}
                  <span className="text-muted">
                    {t.up ? "▲" : "▼"} {num(Math.abs(t.delta))} PP
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </Blueprint>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 28 }}>
        {leagues.map((league) => (
          <section key={league.key}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <h3 style={{ margin: 0 }}>{league.label}</h3>
              <span className="micro text-muted">{num(league.rows.length)} MEMBERS</span>
            </div>
            <p className="text-muted" style={{ fontSize: 13, margin: "0 0 12px" }}>
              {BLURBS[league.key]}
            </p>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th style={{ width: 40 }}>Δ</th>
                  <th>Member</th>
                  <th>Tier</th>
                  <th style={{ textAlign: "right" }}>PP</th>
                </tr>
              </thead>
              <tbody>
                {league.rows.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      background: r.isYou
                        ? "color-mix(in srgb, var(--color-accent) 10%, transparent)"
                        : undefined,
                    }}
                  >
                    <td className="cond">{r.rank}</td>
                    <td className="micro text-muted">
                      {r.rankDelta === 0
                        ? "—"
                        : r.rankDelta > 0
                          ? `▲${r.rankDelta}`
                          : `▼${Math.abs(r.rankDelta)}`}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <div className="micro text-muted" style={{ marginTop: 26, maxWidth: 900, lineHeight: 1.7 }}>
        MEMBERS ARE ANONYMOUS BY DEFAULT — SET A TICKER SYMBOL OR SHOW YOUR NAME FROM DASHBOARD
        SETTINGS. THE ECONOMY IS RATE-LIMITED: LEAD PURCHASES EARN A DELIBERATELY MODEST +20 PP, SO
        THE BOARD CAN'T BE BOUGHT.
      </div>
    </div>
  );
}
