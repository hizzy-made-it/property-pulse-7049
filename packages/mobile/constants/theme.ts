import { Platform } from "react-native";

/**
 * PropertyPulse — "Industry" design language.
 *
 * Same vocabulary as the web app's tokens (`packages/web/src/web/styles.css`)
 * and `design.md` at the app root: a technical paper ground in light mode, an
 * accent-900 blueprint ground in dark mode, one steel-blue accent role, and
 * NO red / green / amber anywhere — state is textual or tonal only, so
 * `destructive` / `success` / `warning` stay inside the neutral+accent ramp.
 */
export const Colors = {
  light: {
    background: "#f2f2f3",
    foreground: "#1d1f20",
    card: "#e9e9ea",
    cardForeground: "#1d1f20",
    primary: "#5980a6",
    primaryForeground: "#ffffff",
    secondary: "#e9e9ea",
    secondaryForeground: "#1d1f20",
    muted: "#e9e9ea",
    mutedForeground: "#6b6f73",
    accent: "#416180",
    accentForeground: "#ffffff",
    accentQuiet: "#cfdbe7",
    border: "rgba(29,31,32,0.16)",
    hairline: "rgba(29,31,32,0.28)",
    destructive: "#1d1f20",
    success: "#416180",
    warning: "#6b6f73",
    plateBg: "#1d2d3d",
    plateText: "#e8eef5",
    heatLow: "#e4e9ee",
    heatMid: "#8fabc6",
    heatHigh: "#31506e",
  },
  dark: {
    background: "#1d2d3d",
    foreground: "#e8eef5",
    card: "#22364a",
    cardForeground: "#e8eef5",
    primary: "#94bce3",
    primaryForeground: "#12202e",
    secondary: "#22364a",
    secondaryForeground: "#e8eef5",
    muted: "#22364a",
    mutedForeground: "#93a7bb",
    accent: "#b5d9fd",
    accentForeground: "#12202e",
    accentQuiet: "#2d4560",
    border: "rgba(232,238,245,0.18)",
    hairline: "rgba(232,238,245,0.32)",
    destructive: "#e8eef5",
    success: "#94bce3",
    warning: "#93a7bb",
    plateBg: "#e8eef5",
    plateText: "#1d2d3d",
    heatLow: "#22364a",
    heatMid: "#5980a6",
    heatHigh: "#d6ebff",
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ColorScheme];

/** Barlow Condensed for headings and figures, Barlow for everything else. */
export const Fonts = {
  cond: "BarlowCondensed_600SemiBold",
  condMedium: "BarlowCondensed_500Medium",
  sans: "Barlow_400Regular",
  medium: "Barlow_500Medium",
  semibold: "Barlow_600SemiBold",
  mono: Platform.select({ ios: "ui-monospace", default: "monospace" }),
};
