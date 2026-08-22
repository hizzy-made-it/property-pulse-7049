import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Fonts } from "@/constants/theme";
import { HAIRLINE, HIT_SLOP, SPACE, TOUCH, TYPE } from "@/constants/layout";
import { useColors } from "@/hooks/use-colors";
import {
  Blueprint,
  EmptyState,
  Hairline,
  Kicker,
  Loading,
  PageHead,
  Plate,
  ScorePlate,
  Tag,
} from "@/components/blueprint";
import { AppBar, Screen, ScreenScroll } from "@/components/screen";
import { useSeasonBoards } from "@/queries/leaderboards";

const AWARDS: [string, string][] = [
  ["SAVE A LISTING", "+10"],
  ["WATCH A ZIP", "+10"],
  ["SAVE AN ROI RUN", "+25"],
  ["RUN A STRESS TEST", "+40"],
  ["READ THE DAILY BRIEF", "+15"],
  ["7-DAY STREAK", "+75"],
];

/** Three-up segmented control. Full column width, 44dp tall, hairline joined. */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.seg, { borderColor: colors.border }]}>
      {options.map((o, i) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.segOpt,
              {
                backgroundColor: active ? colors.primary : "transparent",
                borderLeftWidth: i === 0 ? 0 : HAIRLINE,
                borderLeftColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.segText,
                { color: active ? colors.primaryForeground : colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function BoardScreen() {
  const colors = useColors();
  const boards = useSeasonBoards();
  const [league, setLeague] = useState("investor");

  const leagues = boards.data?.leagues ?? [];
  const active = leagues.find((l) => l.key === league) ?? leagues[0];

  return (
    <Screen bar={<AppBar sub="SEASON BOARD" />}>
      <ScreenScroll
        refreshControl={
          <RefreshControl
            refreshing={boards.isFetching && !boards.isLoading}
            onRefresh={() => void boards.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <PageHead
          kicker="PP-10 · LEADERBOARDS"
          title="Season standings"
          sub={
            boards.data
              ? `Season ${boards.data.season}. Points are earned, never bought.`
              : undefined
          }
        />

        {boards.isLoading ? (
          <Loading label="LOADING BOARDS" />
        ) : !boards.data ? (
          <EmptyState
            title="Boards unavailable"
            body="The season tape could not be reached. Pull down to retry."
          />
        ) : (
          <>
            {/* Movers tape — one scrolling line, never wraps */}
            <Blueprint marks={false} style={styles.tape}>
              <Kicker>MOVERS · 7D</Kicker>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tapeRow}
                style={styles.tapeScroll}
              >
                {boards.data.tape.map((t, i) => (
                  <View key={`${t.name}-${i}`} style={styles.tapeItem}>
                    <Text style={[styles.tapeName, { color: colors.foreground }]}>{t.name}</Text>
                    <Text
                      style={[
                        styles.tapeDelta,
                        { color: t.up ? colors.primary : colors.mutedForeground },
                      ]}
                    >
                      {t.up ? "▲" : "▼"} {t.delta}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </Blueprint>

            <Segmented
              options={leagues.map((l) => ({ key: l.key, label: l.key.toUpperCase() }))}
              value={active?.key ?? league}
              onChange={setLeague}
            />

            {active ? (
              <Plate
                label={active.label}
                right={<Tag>{`${active.rows.length} DESKS`}</Tag>}
                bodyStyle={styles.boardBody}
              >
                <View style={styles.headRow}>
                  <Text style={[styles.micro, styles.colRank, { color: colors.mutedForeground }]}>
                    #
                  </Text>
                  <Text style={[styles.micro, styles.colName, { color: colors.mutedForeground }]}>
                    DESK
                  </Text>
                  <Text style={[styles.micro, styles.colPp, { color: colors.mutedForeground }]}>
                    SEASON
                  </Text>
                  <Text style={[styles.micro, styles.colDelta, { color: colors.mutedForeground }]}>
                    7D
                  </Text>
                </View>
                <Hairline />
                {active.rows.map((r) => (
                  <View
                    key={r.id}
                    style={[
                      styles.rowWrap,
                      r.isYou
                        ? { backgroundColor: colors.accentQuiet, borderColor: colors.primary }
                        : null,
                    ]}
                  >
                    <View style={styles.row}>
                      <Text
                        style={[
                          styles.rank,
                          styles.colRank,
                          { color: r.isYou ? colors.foreground : colors.mutedForeground },
                        ]}
                      >
                        {r.rank}
                      </Text>
                      <View style={styles.colName}>
                        <Text
                          style={[
                            styles.name,
                            {
                              color: colors.foreground,
                              fontFamily: r.isYou ? Fonts.semibold : Fonts.sans,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {r.ticker ? `$${r.ticker}` : r.name}
                          {r.isYou ? " · YOU" : ""}
                        </Text>
                        <Text
                          style={[styles.micro, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {r.anonymous ? "ANONYMOUS" : r.name.toUpperCase()} · {r.tier}
                        </Text>
                      </View>
                      <Text
                        style={[styles.figure, styles.colPp, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {r.seasonPp.toLocaleString("en-US")}
                      </Text>
                      <Text
                        style={[
                          styles.delta,
                          styles.colDelta,
                          { color: r.rankDelta >= 0 ? colors.primary : colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {r.rankDelta >= 0 ? "▲" : "▼"}
                        {Math.abs(r.delta7d)}
                      </Text>
                    </View>
                    <Hairline />
                  </View>
                ))}
              </Plate>
            ) : null}

            <Plate label="HOW POINTS ARE EARNED">
              {AWARDS.map(([label, points]) => (
                <View key={label} style={styles.awardRow}>
                  <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {label}
                  </Text>
                  <ScorePlate value={Number(points.replace("+", ""))} />
                </View>
              ))}
            </Plate>

            <Text style={[styles.footer, { color: colors.mutedForeground }]}>
              SAME INPUTS · SAME SCORES
            </Text>
          </>
        )}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: "row", borderWidth: HAIRLINE },
  segOpt: {
    flex: 1,
    minHeight: TOUCH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACE.xs,
  },
  segText: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    letterSpacing: TYPE.micro.tracking,
  },
  tape: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md },
  tapeScroll: { marginTop: SPACE.xs, marginHorizontal: -SPACE.md },
  tapeRow: { flexDirection: "row", gap: SPACE.lg, paddingHorizontal: SPACE.md },
  tapeItem: { flexDirection: "row", alignItems: "center", gap: SPACE.xs },
  tapeName: {
    fontFamily: Fonts.semibold,
    fontSize: TYPE.bodySm.size,
    letterSpacing: 0.4,
  },
  tapeDelta: { fontFamily: Fonts.medium, fontSize: TYPE.bodySm.size },
  boardBody: { paddingHorizontal: 0, paddingVertical: SPACE.sm, gap: 0 },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.sm,
  },
  rowWrap: { borderLeftWidth: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    minHeight: TOUCH,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  colRank: { width: 24 },
  colName: { flex: 1, minWidth: 0, gap: 1 },
  colPp: { width: 58, textAlign: "right" },
  colDelta: { width: 40, textAlign: "right" },
  rank: { fontFamily: Fonts.cond, fontSize: TYPE.h3.size, lineHeight: TYPE.h3.leading },
  name: { fontSize: TYPE.body.size, lineHeight: TYPE.body.leading },
  figure: {
    fontFamily: Fonts.cond,
    fontSize: TYPE.h3.size,
    lineHeight: TYPE.h3.leading,
  },
  delta: { fontFamily: Fonts.medium, fontSize: TYPE.bodySm.size },
  awardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.md,
    minHeight: 30,
  },
  micro: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    lineHeight: TYPE.micro.leading,
    letterSpacing: TYPE.micro.tracking,
    textTransform: "uppercase",
  },
  body: { fontFamily: Fonts.sans, fontSize: TYPE.body.size, lineHeight: TYPE.body.leading },
  footer: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    letterSpacing: TYPE.micro.tracking,
    textAlign: "center",
    marginTop: SPACE.sm,
  },
});
