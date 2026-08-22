import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Fonts } from "@/constants/theme";
import { HAIRLINE, MARK_INSET, SPACE, TYPE } from "@/constants/layout";
import { useColors } from "@/hooks/use-colors";
import { clamp } from "@/lib/format";

/** A hairline frame on the page ground with `+` registration marks at the corners. */
export function Blueprint({
  children,
  style,
  marks = true,
}: {
  children: ReactNode;
  style?: ViewStyle;
  marks?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.frame, { borderColor: colors.border }, style]}>
      {marks ? (
        <>
          <Text style={[styles.mark, styles.tl, { color: colors.primary }]}>+</Text>
          <Text style={[styles.mark, styles.tr, { color: colors.primary }]}>+</Text>
          <Text style={[styles.mark, styles.bl, { color: colors.primary }]}>+</Text>
          <Text style={[styles.mark, styles.br, { color: colors.primary }]}>+</Text>
        </>
      ) : null}
      {children}
    </View>
  );
}

/** Labelled plate: uppercase micro-label rail across the top, hairline body below. */
export function Plate({
  label,
  right,
  children,
  style,
  bodyStyle,
}: {
  label: string;
  right?: ReactNode;
  children: ReactNode;
  style?: ViewStyle;
  bodyStyle?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <Blueprint style={style}>
      <View style={[styles.plateHead, { borderBottomColor: colors.border }]}>
        <Text style={[styles.kicker, { color: colors.accent }]} numberOfLines={1}>
          {label}
        </Text>
        {right}
      </View>
      <View style={[styles.plateBody, bodyStyle]}>{children}</View>
    </Blueprint>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.kicker, { color: colors.accent }]}>{children}</Text>;
}

/** Page title block. Kicker, h1, optional deck — the screen's masthead. */
export function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.pageHead}>
      <View style={styles.pageHeadRow}>
        <View style={styles.pageHeadText}>
          <Kicker>{kicker}</Kicker>
          <Text style={[styles.h1, { color: colors.foreground }]}>{title}</Text>
        </View>
        {right}
      </View>
      {sub ? <Text style={[styles.sub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
      <View style={[styles.rule, { backgroundColor: colors.border }]} />
    </View>
  );
}

export function Hairline({ style }: { style?: ViewStyle }) {
  const colors = useColors();
  return <View style={[{ height: HAIRLINE, backgroundColor: colors.border }, style]} />;
}

export function Tag({ children, solid = false }: { children: ReactNode; solid?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.tag,
        solid
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { borderColor: colors.border },
      ]}
    >
      <Text
        style={[styles.tagText, { color: solid ? colors.primaryForeground : colors.mutedForeground }]}
      >
        {children}
      </Text>
    </View>
  );
}

/** Inverted plate chip — the score badge treatment. */
export function ScorePlate({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
  const colors = useColors();
  return (
    <View style={[styles.scorePlate, { backgroundColor: colors.plateBg }]}>
      <Text
        style={[
          size === "lg" ? styles.scorePlateTextLg : styles.scorePlateText,
          { color: colors.plateText },
        ]}
      >
        {Math.round(value)}
      </Text>
    </View>
  );
}

export function Stat({
  label,
  value,
  hint,
  align = "left",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  align?: "left" | "right";
}) {
  const colors = useColors();
  return (
    <View style={[styles.stat, { alignItems: align === "right" ? "flex-end" : "flex-start" }]}>
      <Text style={[styles.micro, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.figure, { color: colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text style={[styles.hint, { color: colors.mutedForeground }]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Three-up stat row that shares width evenly and never overflows the column. */
export function StatRow({ children }: { children: ReactNode }) {
  return <View style={styles.statRow}>{children}</View>;
}

/** Horizontal 0–100 score rule. Tonal only — no red/green. */
export function ScoreBar({ value, label }: { value: number; label?: string }) {
  const colors = useColors();
  const v = clamp(value);
  return (
    <View style={styles.scoreBar}>
      {label ? (
        <View style={styles.rowBetween}>
          <Text style={[styles.micro, { color: colors.mutedForeground }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[styles.microStrong, { color: colors.foreground }]}>{Math.round(v)}</Text>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${v}%`, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

/** Column sparkline built from plain views — no chart dependency. */
export function Sparkline({ points, height = 36 }: { points: number[]; height?: number }) {
  const colors = useColors();
  const max = Math.max(1, ...points);
  return (
    <View style={[styles.spark, { height }]}>
      {points.map((p, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max(2, (p / max) * height),
            backgroundColor: i === points.length - 1 ? colors.primary : colors.accentQuiet,
          }}
        />
      ))}
    </View>
  );
}

export function Loading({ label = "LOADING" }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.micro, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  const colors = useColors();
  return (
    <Blueprint style={styles.empty}>
      <Text style={[styles.h3, { color: colors.foreground }]}>{title}</Text>
      {body ? <Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text> : null}
    </Blueprint>
  );
}

export const styles = StyleSheet.create({
  frame: { borderWidth: HAIRLINE, borderRadius: 0, position: "relative" },
  mark: { position: "absolute", fontSize: 10, lineHeight: 11, opacity: 0.7 },
  tl: { top: -MARK_INSET, left: -MARK_INSET + 1 },
  tr: { top: -MARK_INSET, right: -MARK_INSET + 1 },
  bl: { bottom: -MARK_INSET, left: -MARK_INSET + 1 },
  br: { bottom: -MARK_INSET, right: -MARK_INSET + 1 },
  plateHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    minHeight: 34,
    borderBottomWidth: HAIRLINE,
  },
  plateBody: { padding: SPACE.lg, gap: SPACE.md },
  pageHead: { gap: SPACE.sm },
  pageHeadRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACE.md },
  pageHeadText: { flex: 1, gap: SPACE.xs },
  rule: { height: HAIRLINE, marginTop: SPACE.xs },
  kicker: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    lineHeight: TYPE.micro.leading,
    letterSpacing: TYPE.micro.tracking,
    textTransform: "uppercase",
  },
  h1: {
    fontFamily: Fonts.cond,
    fontSize: TYPE.h1.size,
    lineHeight: TYPE.h1.leading,
    letterSpacing: TYPE.h1.tracking,
  },
  h3: { fontFamily: Fonts.cond, fontSize: TYPE.h3.size, lineHeight: TYPE.h3.leading },
  sub: { fontFamily: Fonts.sans, fontSize: TYPE.body.size, lineHeight: TYPE.body.leading },
  body: { fontFamily: Fonts.sans, fontSize: TYPE.body.size, lineHeight: TYPE.body.leading },
  bodySm: { fontFamily: Fonts.sans, fontSize: TYPE.bodySm.size, lineHeight: TYPE.bodySm.leading },
  micro: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    lineHeight: TYPE.micro.leading,
    letterSpacing: TYPE.micro.tracking,
    textTransform: "uppercase",
  },
  microStrong: {
    fontFamily: Fonts.semibold,
    fontSize: TYPE.microLg.size,
    lineHeight: TYPE.microLg.leading,
    letterSpacing: 0.6,
  },
  hint: { fontFamily: Fonts.sans, fontSize: TYPE.bodySm.size, lineHeight: TYPE.bodySm.leading },
  figure: {
    fontFamily: Fonts.cond,
    fontSize: TYPE.figure.size,
    lineHeight: TYPE.figure.leading,
    letterSpacing: TYPE.figure.tracking,
  },
  stat: { flex: 1, gap: 1, minWidth: 0 },
  statRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACE.md },
  tag: {
    borderWidth: HAIRLINE,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    justifyContent: "center",
  },
  tagText: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  scorePlate: {
    minWidth: 38,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  scorePlateText: { fontFamily: Fonts.cond, fontSize: 20, lineHeight: 23 },
  scorePlateTextLg: { fontFamily: Fonts.cond, fontSize: 30, lineHeight: 33 },
  scoreBar: { gap: SPACE.xs },
  track: { height: 3, width: "100%" },
  fill: { height: 3 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm },
  spark: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  loading: { paddingVertical: SPACE.xxl + SPACE.sm, alignItems: "center", gap: SPACE.sm },
  empty: { padding: SPACE.xl, gap: SPACE.xs },
});
