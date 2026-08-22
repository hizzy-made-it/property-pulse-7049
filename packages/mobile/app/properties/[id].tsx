import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fonts } from "@/constants/theme";
import { ASPECT, HIT_SLOP, SPACE, TOUCH, TYPE } from "@/constants/layout";
import { useColors } from "@/hooks/use-colors";
import {
  Blueprint,
  EmptyState,
  Hairline,
  Kicker,
  Loading,
  Plate,
  ScoreBar,
  ScorePlate,
  Stat,
  StatRow,
  Tag,
} from "@/components/blueprint";
import { BackBar, Button, Screen, ScreenScroll, StickyBar } from "@/components/screen";
import { useProperty, useToggleSave } from "@/queries/properties";
import { useSession } from "@/lib/auth";
import { compactUsd, num, pct, usd, photoFor } from "@/lib/format";

export default function PropertyScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session } = useSession();
  const property = useProperty(String(id));
  const toggleSave = useToggleSave();

  const p = property.data;

  const saveLabel = !session
    ? "SIGN IN TO SAVE"
    : p?.saved
      ? "SAVED · TAP TO REMOVE"
      : "SAVE POSITION · +10 PP";

  return (
    <Screen
      edges={["top", "left", "right", "bottom"]}
      bar={<BackBar kicker="PP-04 · PROPERTY" onPress={() => router.back()} />}
      footer={
        p ? (
          <StickyBar>
            <Button
              label={saveLabel}
              variant={p.saved ? "outline" : "solid"}
              disabled={!session}
              pending={toggleSave.isPending}
              onPress={() => toggleSave.mutate({ propertyId: p.id })}
            />
          </StickyBar>
        ) : undefined
      }
    >
      {property.isLoading ? (
        <Loading label="PULLING FILE" />
      ) : !p ? (
        <View style={styles.emptyWrap}>
          <EmptyState title="Not on the tape" body="This listing is no longer in the index." />
        </View>
      ) : (
        <ScreenScroll>
          {/* Hero — fixed 4:3, never a full-width banner strip */}
          <Blueprint marks={false}>
            <Image
              source={{ uri: p.photo ?? photoFor(p.id) }}
              style={styles.hero}
              resizeMode="cover"
              accessibilityLabel={`Photo of ${p.addr}`}
            />
          </Blueprint>

          <View style={styles.head}>
            <Kicker>{`${p.city.toUpperCase()} · ${p.zip} · MLS ${p.mls}`}</Kicker>
            <Text style={[styles.h1, { color: colors.foreground }]}>{p.addr}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.foreground }]}>{usd(p.price)}</Text>
              <Tag>{`${p.dom} DOM`}</Tag>
            </View>
            <View style={styles.wrap}>
              <Tag>{`${p.beds} BD`}</Tag>
              <Tag>{`${p.baths} BA`}</Tag>
              <Tag>{`${num(p.sqft)} SF`}</Tag>
              <Tag>{`BUILT ${p.built}`}</Tag>
              <Tag>{p.type.toUpperCase()}</Tag>
            </View>
          </View>

          <Plate label="VERDICT" right={<Tag solid>{p.verdict}</Tag>}>
            <View style={styles.verdictRow}>
              <ScorePlate value={p.score} size="lg" />
              <View style={styles.bars}>
                <ScoreBar value={p.growth} label="GROWTH" />
                <ScoreBar value={p.housing} label="HOUSING" />
                <ScoreBar value={p.infrastructure} label="INFRASTRUCTURE" />
                <ScoreBar value={p.quality} label="QUALITY OF LIFE" />
              </View>
            </View>
          </Plate>

          <Plate label="RETURNS">
            <StatRow>
              <Stat label="RENT EST" value={compactUsd(p.rent)} hint="per month" />
              <Stat label="CAP RATE" value={pct(p.capRate)} hint="on list" />
              <Stat label="CASH FLOW" value={compactUsd(p.cashFlow)} hint="per month" align="right" />
            </StatRow>
            <Hairline />
            {/* income / employment / velocity are text columns — render raw */}
            <StatRow>
              <Stat label="MEDIAN INCOME" value={p.income} />
              <Stat label="EMPLOYMENT" value={p.employment} />
              <Stat label="VELOCITY" value={p.velocity} align="right" />
            </StatRow>
          </Plate>

          <Plate label="NEIGHBORHOOD">
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{p.hood}</Text>
            {p.zipData ? (
              <>
                <Hairline />
                <StatRow>
                  <Stat label="ZIP" value={p.zipData.zip} hint={p.zipData.name} />
                  <Stat label="AVG PRICE" value={compactUsd(p.zipData.avgPrice)} />
                  <Stat label="EMERGING" value={p.zipData.emergingScore} align="right" />
                </StatRow>
              </>
            ) : null}
          </Plate>

          {p.comparables.length ? (
            <Plate label="COMPARABLES">
              {p.comparables.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/properties/${c.id}`)}
                  hitSlop={HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${c.addr}`}
                  style={({ pressed }) => [styles.compRow, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <View style={styles.compText}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {c.addr}
                    </Text>
                    <Text
                      style={[styles.micro, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {compactUsd(c.price)} · {c.beds}BD · {num(c.sqft)} SF
                    </Text>
                  </View>
                  <ScorePlate value={c.score} />
                </Pressable>
              ))}
            </Plate>
          ) : null}

          <Text style={[styles.footer, { color: colors.mutedForeground }]}>
            SAME INPUTS · SAME SCORES
          </Text>
        </ScreenScroll>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { padding: SPACE.lg },
  hero: { width: "100%", aspectRatio: ASPECT.hero, opacity: 0.92 },
  head: { gap: SPACE.xs },
  priceRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  h1: { fontFamily: Fonts.cond, fontSize: TYPE.h1.size, lineHeight: TYPE.h1.leading },
  price: {
    fontFamily: Fonts.cond,
    fontSize: TYPE.figureLg.size,
    lineHeight: TYPE.figureLg.leading,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.xs, marginTop: SPACE.xs },
  verdictRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACE.lg },
  bars: { flex: 1, gap: SPACE.sm },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.md,
    minHeight: TOUCH,
  },
  compText: { flex: 1, minWidth: 0, gap: 1 },
  rowTitle: { fontFamily: Fonts.semibold, fontSize: TYPE.body.size },
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
  },
});
