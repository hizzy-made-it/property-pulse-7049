import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/constants/theme";
import { CONTENT_MAX_WIDTH, HAIRLINE, SPACE, TAB_BAR_HEIGHT, TYPE } from "@/constants/layout";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontFamily: Fonts.medium,
          fontSize: TYPE.micro.size,
          lineHeight: TYPE.micro.leading,
          letterSpacing: TYPE.micro.tracking,
          textTransform: "uppercase",
        },
        tabBarIconStyle: { marginBottom: -2 },
        tabBarItemStyle: { paddingTop: SPACE.sm, paddingBottom: SPACE.xs },
        // Constrained to the same column as the screens, so the bar reads as
        // part of the phone frame instead of stretching across a wide preview.
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          width: "100%",
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: "center",
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: HAIRLINE,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Desk",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: "Board",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "trophy" : "trophy-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
