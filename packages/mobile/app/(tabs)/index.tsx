import { useState } from "react";
import { Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Fonts } from "@/constants/theme";
import { ASPECT, HIT_SLOP, SPACE, TYPE } from "@/constants/layout";
import { useColors } from "@/hooks/use-colors";
import {
  Blueprint,
  EmptyState,
  Hairline,
  Loading,
  PageHead,
  Plate,
  ScoreBar,
  ScorePlate,
  Sparkline,
  Stat,
  StatRow,
  Tag,
} from "@/components/blueprint";
import { AppBar, Button, ChipRail, Screen, ScreenScroll } from "@/components/screen";
import { authClient, clearToken, useSession } from "@/lib/auth";
import { useMe } from "@/queries/profile";
import { usePulseProfile, useClaimDailyBrief } from "@/queries/gamification";
import { useSavedProperties } from "@/queries/properties";
import { useFiredAlerts } from "@/queries/alerts";
import { compactUsd, photoFor } from "@/lib/format";

const AWARDS = [
  ["SAVE A LISTING", "+10"],
  ["WATCH A ZIP", "+10"],
  ["SAVE AN ROI RUN", "+25"],
  ["RUN A STRESS TEST", "+40"],
  ["READ THE DAILY BRIEF", "+15"],
  ["7-DAY STREAK", "+75"],
];

export default function DeskScreen() {
  const colors = useColors();
  const { data: session, isPending } = useSession();
  const signedIn = Boolean(session?.user);

  const me = useMe();
  const pulse = usePulseProfile(signedIn);
  const saved = useSavedProperties(signedIn);
  const alerts = useFiredAlerts();
  const claim = useClaimDailyBrief();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([me.refetch(), pulse.refetch(), saved.refetch(), alerts.refetch()]);
    setRefreshing(false);
  }

  return (
    <Screen
      bar={
        <AppBar
          sub="CENTRAL FLORIDA"
          right={
            signedIn ? (
              <Pressable
                onPress={async () => {
                  await authClient.signOut();
                  await clearToken();
                }}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                style={({ pressed }) => [s.barAction, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[s.barActionText, { color: colors.accent }]}>SIGN OUT</Text>
              </Pressable>
            ) : (
              <Tag>{"2026Q3"}</Tag>
            )
          }
        />
      }
    >
      <ScreenScroll
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <PageHead
          kicker="PP-05 · DASHBOARD"
          title={signedIn ? "Your desk" : "The desk"}
          sub={
            signedIn
              ? `${me.data?.primaryRole?.toUpperCase() ?? "INVESTOR"} · ${(me.data?.plan ?? "free").toUpperCase()} PLAN`
              : "Central Florida investment intelligence. Same inputs, same scores."
          }
        />

        {isPending ? (
          <Loading label="CHECKING SESSION" />
        ) : !signedIn ? (
          <SignedOut />
        ) : pulse.isLoading ? (
          <Loading label="LOADING YOUR POSITION" />
        ) : pulse.data ? (
          <>
            {/* PulsePoints — the hero figure */}
            <Plate
              label={`PULSEPOINTS · ${pulse.data.season}`}
              right={<Tag solid>{pulse.data.tier.capLabel ?? pulse.data.tier.key}</Tag>}
            >
              <View style={s.counterRow}>
                <View style={s.counterCol}>
                  <Text style={[s.counter, { color: colors.foreground }]} numberOfLines={1}>
                    {pulse.data.totalPoints.toLocaleString("en-US")}
                  </Text>
                  <Text style={[s.micro, { color: colors.mutedForeground }]}>
                    SEASON PP · +{pulse.data.xpToday} TODAY
                  </Text>
                </View>
                <View style={s.sparkCol}>
                  <Sparkline points={pulse.data.sparkline} />
                  <Text style={[s.microRight, { color: colors.mutedForeground }]}>14-DAY TAPE</Text>
                </View>
              </View>

              <Hairline />

              <StatRow>
                <Stat
                  label="LEVEL"
                  value={pulse.data.level.level}
                  hint={`${levelPct(pulse.data.level)}% to next`}
                />
                <Stat label="STREAK" value={`${pulse.data.streak}d`} hint="market days" />
                <Stat
                  label="RANK"
                  value={`#${pulse.data.leaderboard.position}`}
                  hint={pulse.data.league.toUpperCase()}
                  align="right"
                />
              </StatRow>

              <ScoreBar
                value={levelPct(pulse.data.level)}
                label={`LEVEL ${pulse.data.level.level} PROGRESS`}
              />

              <Button
                label={pulse.data.briefClaimedToday ? "BRIEF READ TODAY" : "READ DAILY BRIEF · +15 PP"}
                variant={pulse.data.briefClaimedToday ? "outline" : "solid"}
                disabled={pulse.data.briefClaimedToday}
                pending={claim.isPending}
                onPress={() => claim.mutate({})}
              />
            </Plate>

            {/* Milestones */}
            <Plate label="NEXT MILESTONES">
              {pulse.data.nextMilestones.map((m) => (
                <ScoreBar
                  key={m.key}
                  value={(m.current / m.target) * 100}
                  label={`${m.label} · ${m.current}/${m.target}`}
                />
              ))}
            </Plate>

            {/* Badges */}
            {pulse.data.badges.length ? (
              <Plate label={`BADGES · ${pulse.data.badges.length}`} bodyStyle={s.tightBody}>
                <ChipRail>
                  {pulse.data.badges.map((b) => (
                    <Tag key={b.id}>{b.label}</Tag>
                  ))}
                </ChipRail>
              </Plate>
            ) : null}

            {/* Saved properties */}
            <View style={s.section}>
              <SectionHead
                label="SAVED POSITIONS"
                meta={saved.data?.length ? `${saved.data.length} LISTINGS` : undefined}
              />
              {saved.isLoading ? (
                <Loading label="LOADING POSITIONS" />
              ) : saved.data?.length ? (
                <View style={s.stack}>
                  {saved.data.slice(0, 4).map((p) => (
                    <Link key={p.id} href={`/properties/${p.id}`} asChild>
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel={`${p.addr}, score ${p.score}`}
                        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                      >
                        <Blueprint style={s.savedRow}>
                          <Image
                            source={{ uri: p.photo || photoFor(p.id) }}
                            style={s.savedThumb}
                            resizeMode="cover"
                          />
                          <View style={s.savedBody}>
                            <Text style={[s.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
                              {compactUsd(p.price)} · {p.addr}
                            </Text>
                            <Text style={[s.micro, { color: colors.mutedForeground }]} numberOfLines={1}>
                              {p.city.toUpperCase()} · {p.zip} · {p.beds}BD/{p.baths}BA
                            </Text>
                          </View>
                          <ScorePlate value={p.score} />
                        </Blueprint>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="No saved positions"
                  body="Save a listing from Search and it lands here — first save on any property pays +10 PP."
                />
              )}
            </View>

            {/* Signals */}
            <Plate label="SIGNAL FEED">
              {alerts.isLoading ? (
                <Loading label="LOADING SIGNALS" />
              ) : alerts.data?.length ? (
                alerts.data.slice(0, 5).map((a, i) => (
                  <View key={a.id} style={s.feedRow}>
                    {i > 0 ? <Hairline style={s.feedRule} /> : null}
                    <View style={s.rowBetween}>
                      <Text style={[s.microStrong, { color: colors.foreground }]} numberOfLines={1}>
                        {a.zip} · {a.signal}
                      </Text>
                      <Text style={[s.micro, { color: colors.accent }]}>{dayLabel(a.firedAt)}</Text>
                    </View>
                    <Text style={[s.body, { color: colors.mutedForeground }]}>{a.detail}</Text>
                  </View>
                ))
              ) : (
                <Text style={[s.body, { color: colors.mutedForeground }]}>
                  No fired signals on your watched ZIPs.
                </Text>
              )}
            </Plate>

            {/* Ledger */}
            <Plate label="POINTS LEDGER">
              {pulse.data.recent.length ? (
                pulse.data.recent.slice(0, 6).map((e, i) => (
                  <View key={e.id} style={s.feedRow}>
                    {i > 0 ? <Hairline style={s.feedRule} /> : null}
                    <View style={s.rowBetween}>
                      <Text style={[s.body, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
                        {e.label}
                      </Text>
                      <Text style={[s.ledgerPts, { color: colors.accent }]}>+{e.points}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[s.body, { color: colors.mutedForeground }]}>
                  Nothing on the tape yet.
                </Text>
              )}
            </Plate>

            <Text style={[s.footer, { color: colors.mutedForeground }]}>
              SAME INPUTS · SAME SCORES
            </Text>
          </>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

function levelPct(level: { into: number; span: number }) {
  return Math.round((level.into / Math.max(1, level.span)) * 100);
}

function dayLabel(value: string | Date) {
  return new Date(value)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

function SectionHead({ label, meta }: { label: string; meta?: string }) {
  const colors = useColors();
  return (
    <View style={s.sectionHead}>
      <Text style={[s.micro, { color: colors.accent }]}>{label}</Text>
      {meta ? <Text style={[s.micro, { color: colors.mutedForeground }]}>{meta}</Text> : null}
    </View>
  );
}

/** Signed-out desk: one clear action, then what the product actually does. */
function SignedOut() {
  const colors = useColors();
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    try {
      await authClient.managedAuth.signIn({ provider: "google" });
    } catch (err) {
      if (!String(err).includes("AUTH_SESSION_DISMISSED")) console.warn(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Plate label="PP-00 · ACCESS">
        <Text style={[s.h3, { color: colors.foreground }]}>Open your desk</Text>
        <Text style={[s.body, { color: colors.mutedForeground }]}>
          Saved positions, PulsePoints, streaks and league standing live on your account. Search and
          the leaderboards stay open to everyone.
        </Text>
        <Button
          label="CONTINUE WITH GOOGLE"
          onPress={signIn}
          pending={busy}
        />
        <Text style={[s.micro, { color: colors.mutedForeground }]}>
          EMAIL SIGN-UP LIVES ON THE WEB APP
        </Text>
      </Plate>

      <Plate label="WHAT THE DESK TRACKS">
        <StatRow>
          <Stat label="SIGNALS" value="12" hint="Central FL ZIPs" />
          <Stat label="SEASON" value="Q3" hint="2026 standings" />
          <Stat label="LEAGUES" value="3" hint="invest·list·build" align="right" />
        </StatRow>
      </Plate>

      <Plate label="HOW POINTS ARE EARNED">
        {AWARDS.map(([label, pts], i) => (
          <View key={label} style={s.feedRow}>
            {i > 0 ? <Hairline style={s.feedRule} /> : null}
            <View style={s.rowBetween}>
              <Text style={[s.body, { color: colors.foreground, flex: 1 }]}>{label}</Text>
              <Text style={[s.ledgerPts, { color: colors.accent }]}>{pts} PP</Text>
            </View>
          </View>
        ))}
        <Text style={[s.micro, { color: colors.mutedForeground }]}>
          POINTS ARE EARNED, NEVER BOUGHT
        </Text>
      </Plate>
    </>
  );
}

const s = StyleSheet.create({
  barAction: { minHeight: 32, justifyContent: "center" },
  barActionText: { fontFamily: Fonts.semibold, fontSize: TYPE.micro.size, letterSpacing: 1.3 },
  counterRow: { flexDirection: "row", alignItems: "flex-end", gap: SPACE.md },
  counterCol: { flex: 1, minWidth: 0 },
  sparkCol: { width: 118 },
  counter: {
    fontFamily: Fonts.cond,
    fontSize: TYPE.counter.size,
    lineHeight: TYPE.counter.leading,
    letterSpacing: TYPE.counter.tracking,
  },
  micro: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    lineHeight: TYPE.micro.leading,
    letterSpacing: TYPE.micro.tracking,
    textTransform: "uppercase",
  },
  microRight: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    letterSpacing: TYPE.micro.tracking,
    textAlign: "right",
    marginTop: SPACE.xs,
  },
  microStrong: {
    fontFamily: Fonts.semibold,
    fontSize: TYPE.microLg.size,
    letterSpacing: 0.6,
    flex: 1,
  },
  h3: { fontFamily: Fonts.cond, fontSize: TYPE.h3.size, lineHeight: TYPE.h3.leading },
  body: { fontFamily: Fonts.sans, fontSize: TYPE.body.size, lineHeight: TYPE.body.leading },
  section: { gap: SPACE.md },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stack: { gap: SPACE.lg },
  savedRow: { flexDirection: "row", alignItems: "center", gap: SPACE.md, padding: SPACE.sm },
  savedThumb: { width: 64, height: 64 / ASPECT.thumb, backgroundColor: "#00000010" },
  savedBody: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontFamily: Fonts.cond, fontSize: TYPE.h3.size, lineHeight: TYPE.h3.leading },
  feedRow: { gap: SPACE.xs },
  feedRule: { marginBottom: SPACE.md },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.sm,
  },
  ledgerPts: { fontFamily: Fonts.semibold, fontSize: TYPE.microLg.size, letterSpacing: 0.8 },
  tightBody: { padding: SPACE.md },
  footer: {
    fontFamily: Fonts.medium,
    fontSize: TYPE.micro.size,
    letterSpacing: TYPE.micro.tracking,
    textAlign: "center",
    paddingTop: SPACE.sm,
  },
});
