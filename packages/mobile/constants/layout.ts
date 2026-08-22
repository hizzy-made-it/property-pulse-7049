import { Platform, StyleSheet } from "react-native";

/**
 * PropertyPulse mobile — layout contract.
 *
 * Every screen reads its widths, gutters, spacing and type sizes from here, so
 * the app stays inside phone-sane limits instead of stretching to whatever
 * viewport it lands in (the Expo web preview is ~1024px wide, tablets are
 * wider still). One file to retune the whole app's density.
 */

/**
 * Hard ceiling on the content column, in dp.
 * 430 = iPhone 16 Pro Max logical width, the widest phone we design for. On a
 * narrower device the column is simply the screen; on the web preview and on
 * tablets it centres and the ground shows through either side.
 */
export const CONTENT_MAX_WIDTH = 430;

/** Side gutter. 20dp reads as generous on a 390dp phone without wasting line length. */
export const GUTTER = 20;

/** Vertical rhythm. Multiples of 4 only. */
export const SPACE = {
  hair: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 28,
} as const;

/**
 * Minimum interactive size, in dp. Apple HIG says 44, Material says 48 —
 * 44 with hitSlop is the compromise every control in the app honours.
 */
export const TOUCH = 44;
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/** Tab bar: 56 of chrome plus whatever the home indicator needs. */
export const TAB_BAR_HEIGHT = 56;

/** Bottom padding for scrollers inside the tab navigator, so nothing hides under the bar. */
export const SCROLL_BOTTOM_PAD = TAB_BAR_HEIGHT + SPACE.xxl;

/** App bar (wordmark rail) height. */
export const APP_BAR_HEIGHT = 48;

/** Hairline — never scale this, it is meant to be one physical pixel. */
export const HAIRLINE = StyleSheet.hairlineWidth;

/**
 * Type scale. Mobile minimums: body never below 15, and secondary text never
 * below 13 except for the uppercase micro labels (letter-spaced, so they stay
 * legible at 10–11).
 */
export const TYPE = {
  display: { size: 40, leading: 42, tracking: -0.6 },
  h1: { size: 30, leading: 33, tracking: -0.3 },
  h2: { size: 22, leading: 26, tracking: -0.2 },
  h3: { size: 18, leading: 22, tracking: 0 },
  figure: { size: 24, leading: 27, tracking: -0.2 },
  figureLg: { size: 34, leading: 36, tracking: -0.4 },
  counter: { size: 46, leading: 48, tracking: -0.8 },
  body: { size: 15, leading: 22, tracking: 0 },
  bodySm: { size: 13, leading: 19, tracking: 0 },
  micro: { size: 10, leading: 14, tracking: 1.4 },
  microLg: { size: 11, leading: 15, tracking: 1.2 },
} as const;

/** Media aspect ratios — 16:10 for cards, 4:3 for the detail hero. */
export const ASPECT = { card: 16 / 10, hero: 4 / 3, thumb: 1 } as const;

/** Registration-mark inset for blueprint frames. */
export const MARK_INSET = 5;

/** Web preview shows the column's edges; on device it is flush. */
export const IS_WEB = Platform.OS === "web";
