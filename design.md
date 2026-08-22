# PropertyPulse — Industry Design Language

Recreation of the `design_handoff_propertypulse_industry_redesign` bundle.
Source of truth for values: `industry-styles.css` (ported verbatim into
`packages/web/src/web/styles.css` as CSS variables).

## Principle

Line drawings on a technical ground. Nothing is a filled card. Everything is a
hairline frame on the page ground, square-cornered, with `+` registration marks
at the corners like a blueprint plate. The solid accent primary button is the
one deliberate exception. All state feedback is textual or tonal — there is no
red/green/amber anywhere in the product.

## Themes

Two grounds, one accent role. Default light. Toggle lives in the top nav as a
hairline `LIGHT / DARK` segmented control, persisted to localStorage,
`.dark` class on `<html>`.

### Light — technical paper
| Token | Value |
|---|---|
| `--color-bg` | `#f2f2f3` |
| `--color-surface` | `#e9e9ea` |
| `--color-text` | `#1d1f20` |
| `--color-divider` | `rgba(29,31,32,.16)` |
| accent (interactive) | `#5980a6` |
| accent (text/links) | `#416180` (accent-700) |
| duotone blend | `#5980a6` |

### Dark — accent-900 blueprint ground
Chosen reading: the page becomes an actual blueprint. Blue-black ground, the
accent brightens so it still reads as the single accent role.

| Token | Value |
|---|---|
| `--color-bg` | `#1d2d3d` (accent-900) |
| `--color-surface` | `#22364a` |
| `--color-text` | `#e8eef5` |
| `--color-divider` | `rgba(232,238,245,.18)` |
| accent (interactive) | `#94bce3` (accent-400) |
| accent (text/links) | `#b5d9fd` (accent-300) |
| duotone blend | `#94bce3` (accent-400) — keeps photos from going muddy |
| ramp direction | the accent ramp **inverts**: 100 ↔ 900, so "shade up the ramp" still means "more emphasis" |
| neutral ramp | inverts the same way, so hairlines and micro-labels keep their value relationships |

Heat cells in dark mode run `#22364a → #5980a6 → #d6ebff` (dark = low, bright =
high), the mirror of the light ramp, so a hot ZIP is always the loudest cell.

## Typography

- Headings: `"Barlow Condensed"` 600, `letter-spacing: -0.015em`, `line-height: 1.12`
- Body: `"Barlow"` 400, 15px, `line-height: 1.55`
- Micro-labels / kickers: 10–11px, uppercase, `letter-spacing: .12–.16em`, accent-700
- Scale: h1 42 (hero 60–62), h2 32–34, h3 25, h4 20, h5 16, h6 13
- Big data figures: Barlow Condensed 600 — 64px verdict, 42px PP counter, 22px card price

Every screen carries a `PP-NN · SECTION` kicker above its h1.

## Radii, rules, elevation

- Radius `0` on every framed object: cards, buttons, figures, tables, segmented controls
- Radius 2–4px on inputs and tags only
- 1px hairlines everywhere, `--color-divider`
- Shadows only on floating elements (toast): `--shadow-lg: 0 12px 32px rgba(43,43,45,.22)`
- Focus: `outline: 2px solid var(--color-accent); outline-offset: 2px`
- Icons: Lucide, `stroke-width: 1.5`

## Components

- `.blueprint` — 1px divider border + four 11×11px `+` corner marks offset `-6px`
- `.duotone` — `::after` overlay, `background: accent; mix-blend-mode: color`
- `.btn-primary` — solid accent fill, bg-colored text; `.btn-secondary` — hairline; `.btn-ghost` — accent text
- `.seg` — segmented control, solid accent fill + bg-color text on the active option, hairline dividers between
- `.tag-accent` / `.tag-accent-2` / `.tag-neutral` / `.tag-outline`
- `.table` — uppercase 11px headers, hairline row rules, rows tint `rgba(text,.04)` on hover
- Tier chips shade up the accent ramp: T1 `#e7e7ea/#424244`, T2 `#d6ebff/#2c455d`, T3 `#b5d9fd/#1d2d3d`, T4 `#749dc4/#f5f5f8`, T5 `#416180/#f5f5f8`, T6 `#1d2d3d/#f5f5f8`

## Data color

Positive data is accent-700 (light) / accent-300 (dark). Muted and negative are
neutral-500/600. Score tags: accent at ≥70, neutral below. Verdict: `BUY` in
accent-700 at score ≥70, `HOLD` in neutral below.

## Motion

One orchestrated page-load stagger per screen; hover and active states are
instant. Toast slides up 8px over 180ms. Leaderboard ticker-tape is a 38s linear
marquee with a duplicated row for a seamless wrap — honors
`prefers-reduced-motion`.

## Gamification surface

PulsePoints is a first-class product surface, not a sidebar badge:
- Award toast: dark accent-900 blueprint plate, bottom-right, `ORDER FILLED · +N PP · LABEL`, ~3.2s
- "Your Position" panel on every dashboard: 42px condensed PP counter, `▲ +N today · Level N`, 130×40 30-day sparkline, rank link, streak line, next-tier progress bar, daily-brief claim, badge tags, two milestone bars
- Leaderboards: ticker-tape of top movers, three league tables, your row tinted and suffixed "— YOU"

## Pricing (final, supersedes the handoff)

Investors from **$99 / mo**. Realtor leads from **$500 / lead**. Contractor
leads **$500 / lead**. Payments are stubbed — flows and state changes work, no
charge is made.

## Layout

Max content width 1360px, 40px page gutters, 1280px for full-bleed plates.
Sticky top nav with hairline bottom rule. Hairline footer carrying
`SAME INPUTS · SAME SCORES`.
