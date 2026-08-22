import type { ReactNode } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ScrollViewProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "@/constants/theme";
import {
  APP_BAR_HEIGHT,
  CONTENT_MAX_WIDTH,
  GUTTER,
  HAIRLINE,
  HIT_SLOP,
  SCROLL_BOTTOM_PAD,
  SPACE,
  TOUCH,
  TYPE,
} from "@/constants/layout";
import { useColors } from "@/hooks/use-colors";

/**
 * The content column. Fills a phone, caps at CONTENT_MAX_WIDTH and centres on
 * anything wider (tablet, Expo web preview), with hairline rails marking the
 * column edge so a wide viewport reads as an intentional frame rather than a
 * stretched phone layout.
 */
export function Column({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const overflowing = width > CONTENT_MAX_WIDTH;

  return (
    <View
      style={[
        styles.column,
        overflowing
          ? { borderLeftWidth: HAIRLINE, borderRightWidth: HAIRLINE, borderColor: colors.border }
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Screen shell: safe area + centred column, with optional fixed app bar above
 * the scroller and a sticky action bar pinned to the bottom.
 */
export function Screen({
  children,
  bar,
  footer,
  edges = ["top", "left", "right"],
}: {
  children: ReactNode;
  bar?: ReactNode;
  footer?: ReactNode;
  edges?: ("top" | "bottom" | "left" | "right")[];
}) {
  const colors = useColors();
  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: colors.background }]}>
      <Column>
        {bar}
        <View style={styles.flex}>{children}</View>
        {footer}
      </Column>
    </SafeAreaView>
  );
}

/** Vertically scrolling page body with the standard gutters and tab-bar clearance. */
export function ScreenScroll({
  children,
  contentStyle,
  ...rest
}: ScrollViewProps & { children: ReactNode; contentStyle?: ViewStyle }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.page, contentStyle]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

/** Wordmark rail. Fixed height, hairline bottom — the app's one piece of chrome. */
export function AppBar({ right, sub }: { right?: ReactNode; sub?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.appBar, { borderBottomColor: colors.border }]}>
      <View style={styles.appBarLeft}>
        <View style={[styles.appMark, { borderColor: colors.primary }]}>
          <View style={[styles.appMarkCore, { backgroundColor: colors.primary }]} />
        </View>
        <View>
          <Text style={[styles.wordmark, { color: colors.foreground }]}>PROPERTYPULSE</Text>
          {sub ? <Text style={[styles.appBarSub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

/**
 * Horizontal filter rail. Chips never wrap into a ragged multi-row block on a
 * phone — they scroll, bleeding to the screen edge so the row reads as scrollable.
 */
export function ChipRail({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      style={styles.railOuter}
    >
      {children}
    </ScrollView>
  );
}

/** Segmented / filter chip. Meets the 44dp touch minimum via padding + hitSlop. */
export function Chip({
  label,
  active = false,
  onPress,
  disabled = false,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primary : "transparent",
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primaryForeground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Primary action. Full-width, 48dp tall — the one deliberately filled surface. */
export function Button({
  label,
  onPress,
  variant = "solid",
  disabled = false,
  pending = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: "solid" | "outline";
  disabled?: boolean;
  pending?: boolean;
}) {
  const colors = useColors();
  const solid = variant === "solid";
  const off = disabled || pending;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy: pending }}
      style={({ pressed }) => [
        styles.button,
        solid
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: "transparent", borderColor: colors.hairline },
        { opacity: off ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          { color: solid ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {pending ? "WORKING…" : label}
      </Text>
    </Pressable>
  );
}

/** Sticky bottom action bar for detail screens (outside the tab navigator). */
export function StickyBar({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.sticky,
        { borderTopColor: colors.border, backgroundColor: colors.background },
      ]}
    >
      {children}
    </View>
  );
}

/** Back control sized to the touch minimum. */
export function BackBar({ kicker, onPress }: { kicker: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.backBar, { borderBottomColor: colors.border }]}>
      <Pressable
        onPress={onPress}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [styles.backHit, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[styles.backText, { color: colors.accent }]}>‹ BACK</Text>
      </Pressable>
      <Text style={[styles.backKicker, { color: colors.mutedForeground }]}>{kicker}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  column: {
    flex: 1,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  page: {
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.lg,
    paddingBottom: SCROLL_BOTTOM_PAD,
    gap: SPACE.xl,
  },
  appBar: {
    height: APP_BAR_HEIGHT,
    paddingHorizontal: GUTTER,
    borderBottomWidth: HAIRLINE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appBarLeft: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  appMark: {
    width: 16,
    height: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  appMarkCore: { width: 6, height: 6 },
  wordmark: {
    fontFamily: Fonts.semibold,
    fontSize: TYPE.microLg.size,
    letterSpacing: 2,
  },
  appBarSub: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    letterSpacing: 1.1,
    marginTop: 1,
  },
  railOuter: { marginHorizontal: -GUTTER },
  rail: {
    paddingHorizontal: GUTTER,
    gap: SPACE.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: SPACE.md,
    justifyContent: "center",
    borderWidth: HAIRLINE,
  },
  chipText: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    letterSpacing: TYPE.micro.tracking,
    textTransform: "uppercase",
  },
  button: {
    minHeight: 48,
    borderWidth: HAIRLINE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACE.lg,
  },
  buttonText: {
    fontFamily: Fonts.semibold,
    fontSize: TYPE.microLg.size,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  sticky: {
    borderTopWidth: HAIRLINE,
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.md,
    paddingBottom: Platform.OS === "web" ? SPACE.md : SPACE.lg,
  },
  backBar: {
    height: APP_BAR_HEIGHT,
    paddingHorizontal: GUTTER,
    borderBottomWidth: HAIRLINE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backHit: { minHeight: TOUCH, justifyContent: "center", paddingRight: SPACE.md },
  backText: { fontFamily: Fonts.semibold, fontSize: TYPE.microLg.size, letterSpacing: 1.4 },
  backKicker: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    letterSpacing: TYPE.micro.tracking,
  },
});
