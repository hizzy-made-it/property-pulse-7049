import Constants from "expo-constants";

/** Same formatters as the web app — the UI never invents its own rounding. */
export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const num = (n: number) => n.toLocaleString("en-US");

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export const pctSigned = (n: number, digits = 1) =>
  `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(digits)}%`;

export const compactUsd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
    : n >= 1000
      ? `$${Math.round(n / 1000)}K`
      : `$${n}`;

export const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const apiBase = String(
  Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "",
).replace(/\/$/, "");

/** Deterministic photo pick, resolved against the web server that hosts /public. */
export const photoFor = (seed: string, count = 12) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `${apiBase}/images/properties/p${(h % count) + 1}.jpg`;
};
