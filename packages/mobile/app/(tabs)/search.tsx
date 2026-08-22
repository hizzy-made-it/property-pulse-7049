import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Fonts } from "@/constants/theme";
import {
  ASPECT,
  GUTTER,
  HAIRLINE,
  HIT_SLOP,
  SCROLL_BOTTOM_PAD,
  SPACE,
  TOUCH,
  TYPE,
} from "@/constants/layout";
import { useColors } from "@/hooks/use-colors";
import {
  Blueprint,
  EmptyState,
  Loading,
  PageHead,
  ScorePlate,
  Tag,
} from "@/components/blueprint";
import { AppBar, Chip, ChipRail, Screen } from "@/components/screen";
import { useSession } from "@/lib/auth";
import { useFacets, usePropertySearch, useToggleSave, type SearchInput } from "@/queries/properties";
import { compactUsd, num, photoFor } from "@/lib/format";

const SORTS: { key: NonNullable<SearchInput["sort"]>; label: string }[] = [
  { key: "score", label: "SCORE" },
  { key: "priceAsc", label: "PRICE ↑" },
  { key: "priceDesc", label: "PRICE ↓" },
  { key: "newest", label: "NEWEST" },
];

export default function SearchScreen() {
  const colors = useColors();
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user);

  const [city, setCity] = useState<string | undefined>();
  const [sort, setSort] = useState<NonNullable<SearchInput["sort"]>>("score");
  const [maxPriceText, setMaxPriceText] = useState("");

  const maxPrice = useMemo(() => {
    const n = Number(maxPriceText.replace(/[^0-9]/g, ""));
    return n > 0 ? n : undefined;
  }, [maxPriceText]);

  const facets = useFacets();
  const results = usePropertySearch({ city, sort, maxPrice });
  const toggleSave = useToggleSave();

  const rows = results.data ?? [];

  return (
    <Screen bar={<AppBar sub="PROPERTY TAPE" right={<Tag>{`${rows.length} HITS`}</Tag>} />}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListHeaderComponent={
            <View style={s.header}>
              <PageHead
                kicker="PP-03 · PROPERTY SEARCH"
                title="Search the tape"
                sub={`${rows.length} listings · sorted by ${SORTS.find((x) => x.key === sort)?.label.toLowerCase()}`}
              />

              {/* Filter rails — chips scroll horizontally, never wrap into a ragged block */}
              <View style={s.filters}>
                <View style={s.filterGroup}>
                  <Text style={[s.micro, { color: colors.mutedForeground }]}>MARKET</Text>
                  <ChipRail>
                    <Chip label="All cities" active={!city} onPress={() => setCity(undefined)} />
                    {(facets.data?.cities ?? []).map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        active={city === c}
                        onPress={() => setCity(city === c ? undefined : c)}
                      />
                    ))}
                  </ChipRail>
                </View>

                <View style={s.filterGroup}>
                  <Text style={[s.micro, { color: colors.mutedForeground }]}>SORT</Text>
                  <ChipRail>
                    {SORTS.map((o) => (
                      <Chip
                        key={o.key}
                        label={o.label}
                        active={sort === o.key}
                        onPress={() => setSort(o.key)}
                      />
                    ))}
                  </ChipRail>
                </View>

                <View
                  style={[s.priceField, { borderColor: colors.border }]}
                >
                  <Text style={[s.micro, { color: colors.mutedForeground }]}>MAX PRICE</Text>
                  <TextInput
                    value={maxPriceText}
                    onChangeText={setMaxPriceText}
                    placeholder="No cap"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    accessibilityLabel="Maximum price"
                    style={[s.input, { color: colors.foreground }]}
                  />
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Link href={`/properties/${item.id}`} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${item.addr}, ${compactUsd(item.price)}, score ${item.score}`}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <Blueprint>
                  <View style={s.mediaWrap}>
                    <Image
                      source={{ uri: item.photo || photoFor(item.id) }}
                      style={s.media}
                      resizeMode="cover"
                    />
                    <View style={s.scoreDock}>
                      <ScorePlate value={item.score} />
                    </View>
                  </View>

                  <View style={s.cardBody}>
                    <View style={s.cardTop}>
                      <View style={s.cardTitleCol}>
                        <Text style={[s.price, { color: colors.foreground }]} numberOfLines={1}>
                          {compactUsd(item.price)}
                        </Text>
                        <Text style={[s.addr, { color: colors.foreground }]} numberOfLines={1}>
                          {item.addr}
                        </Text>
                        <Text style={[s.micro, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {item.city.toUpperCase()}, {item.state} {item.zip} · {item.type.toUpperCase()}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => signedIn && toggleSave.mutate({ propertyId: item.id })}
                        disabled={!signedIn || toggleSave.isPending}
                        hitSlop={HIT_SLOP}
                        accessibilityRole="button"
                        accessibilityLabel={item.saved ? "Remove from saved" : "Save property"}
                        accessibilityState={{ selected: item.saved, disabled: !signedIn }}
                        style={({ pressed }) => [
                          s.saveHit,
                          { opacity: !signedIn ? 0.35 : pressed ? 0.6 : 1 },
                        ]}
                      >
                        <Ionicons
                          name={item.saved ? "bookmark" : "bookmark-outline"}
                          size={20}
                          color={item.saved ? colors.primary : colors.mutedForeground}
                        />
                      </Pressable>
                    </View>

                    <View style={s.tagRow}>
                      <Tag>{`${item.beds} BD`}</Tag>
                      <Tag>{`${item.baths} BA`}</Tag>
                      <Tag>{`${num(item.sqft)} SF`}</Tag>
                      <Tag>{`CAP ${item.capRate.toFixed(1)}%`}</Tag>
                      <Tag>{`${item.dom} DOM`}</Tag>
                    </View>
                  </View>
                </Blueprint>
              </Pressable>
            </Link>
          )}
          ListEmptyComponent={
            results.isLoading ? (
              <Loading label="SCANNING THE TAPE" />
            ) : (
              <EmptyState
                title="Nothing matches"
                body="Widen the price cap or clear the market filter."
              />
            )
          }
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: GUTTER, paddingTop: SPACE.lg, paddingBottom: SCROLL_BOTTOM_PAD },
  header: { gap: SPACE.xl, marginBottom: SPACE.xl },
  filters: { gap: SPACE.lg },
  filterGroup: { gap: SPACE.sm },
  sep: { height: SPACE.xl },
  mediaWrap: { position: "relative" },
  media: { width: "100%", aspectRatio: ASPECT.card, backgroundColor: "#00000010" },
  scoreDock: { position: "absolute", right: 0, bottom: 0 },
  cardBody: { padding: SPACE.md, gap: SPACE.md },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: SPACE.sm },
  cardTitleCol: { flex: 1, minWidth: 0, gap: 1 },
  price: {
    fontFamily: Fonts.cond,
    fontSize: TYPE.figure.size,
    lineHeight: TYPE.figure.leading,
    letterSpacing: TYPE.figure.tracking,
  },
  addr: { fontFamily: Fonts.semibold, fontSize: TYPE.body.size, lineHeight: TYPE.body.leading },
  micro: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    lineHeight: TYPE.micro.leading,
    letterSpacing: TYPE.micro.tracking,
    textTransform: "uppercase",
  },
  saveHit: { width: TOUCH, height: TOUCH, alignItems: "flex-end", justifyContent: "flex-start" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.xs },
  priceField: {
    borderWidth: HAIRLINE,
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.xs,
    gap: 2,
  },
  input: {
    fontFamily: Fonts.sans,
    fontSize: TYPE.body.size,
    minHeight: 32,
    padding: 0,
  },
});
