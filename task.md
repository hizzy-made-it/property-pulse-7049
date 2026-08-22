# PropertyPulse — build log

Design source: `/home/user/Attachments/` (README handoff, industry-styles.css, interactive prototype, redesign board).
Design spec: `design.md` (app root). Stack: Runable managed template (Bun/Vite/React 19/Wouter/Tailwind 4 + Hono/oRPC/Drizzle/Turso + Expo).

## Status: COMPLETE (web + mobile)

### Backend — done
- `schema.ts` (252 lines) pushed to Turso; `seed.ts` run → 12 ZIPs, 12 properties, 6 leads, 6 improvements, 5 contractors, 4 projects, 5 alerts, 21 leaderboard members, season `2026Q3`.
- Auth: Better Auth + Runable managed auth (Google) + email/password + `expo()`. Multi-role per account (`userRoles`), admin role.
- PulsePoints economy server-side only (`api/lib/pp.ts`): awards, daily caps, tiers T1–T6, levels, badges, streaks, ledger.
- 12 routers: properties, zips, leads, roi, alerts, renovation, gamification, leaderboards, billing (stubbed), profile, admin, ping.

### Web frontend — done
15 pages: PP-01 landing, PP-02 market map, PP-03 search, PP-04 property detail, PP-05 dashboard, PP-07 marketplace,
PP-08 analysis suite, PP-09 ROI calculator, PP-10 leaderboards, plus auth, saved, onboarding, pricing, settings, admin, 404.
Light + dark mode (accent-900 blueprint ground), Industry component kit (blueprint frames, plates, duotone, heat grid,
sparklines, PulsePanel), toasts for PP awards.

### Mobile (Expo) — done, rebuilt for demo quality
Scope as agreed: desk (PP-05), search (PP-03), property detail (PP-04), leaderboards (PP-10).
Industry kit ported to RN (`components/blueprint.tsx`), Barlow + Barlow Condensed via `@expo-google-fonts`,
managed auth (Google) with shared bearer token, Industry palette in `constants/theme.ts`.

Mobile layout contract (`constants/layout.ts`) — every screen reads its widths, spacing and type from it:
- `CONTENT_MAX_WIDTH = 430` (iPhone 16 Pro Max logical width). Content caps there and centres on anything
  wider, with hairline rails down the column edges, so a 1024px demo viewport reads as a framed phone column
  instead of a stretched layout. Tab bar capped and centred to the same column.
- `GUTTER = 20`; `SPACE` on a 4dp rhythm; `TOUCH = 44` + `HIT_SLOP` on every control; `TAB_BAR_HEIGHT = 56`
  plus safe-area bottom inset; `SCROLL_BOTTOM_PAD` so nothing hides under the bar.
- `TYPE` scale with floors: body >= 15, secondary >= 13, uppercase micro labels 10-11 only (letter-spaced).
- `ASPECT`: card media fixed 16:10, detail hero 4:3 - no full-width banner strips.
- Filter chips scroll horizontally (`ChipRail`, edge-bleeding) instead of wrapping into ragged rows.
- Shared shell `components/screen.tsx`: `Column`, `Screen`, `ScreenScroll`, `AppBar`, `ChipRail`, `Chip`,
  `Button`, `StickyBar`, `BackBar`. Property detail uses `BackBar` + a sticky save CTA; board uses a
  full-width three-up segmented league switch.

## Verification (last run)
- `bun run lint` → 0 errors, 0 warnings (konsistent: 41 files, no violations).
- `bun run build` → passes (tsc + vite, 285 modules).
- `packages/mobile` `bun run typecheck` → clean.
- Web dev server: port 4200, tmux `ppweb`. Metro: port 4300, tmux `ppmobile`.
- Mobile web preview smoke-tested at two widths: 1024 (centred 430dp column with hairline rails) and 390
  (fills the width with 20dp gutters). Desk, Search, property detail `/properties/p2`, Board all verified.
  Fonts load, zero console errors.
- Test account: `owner@propertypulse.test` / `PulsePoints2026` (all three roles + admin).

## Open / deferred
- Mapbox token never supplied — heat grid stays the designed figure behind the `components/heat-grid.tsx` adapter seam.
- Payments fully stubbed (no Stripe).
- Electron desktop skipped per decision.
