// System-managed layout — extend in place, never rewrite from scratch.
// Keep the provider chain intact: ErrorBoundary → OneDollarStats → SafeArea → QueryClient.
// To switch navigation, replace only the <Slot /> line with <Stack /> or <Tabs />.
import { useEffect } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from "@expo-google-fonts/barlow";
import {
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
} from "@expo-google-fonts/barlow-condensed";
import { ActivityIndicator, View } from "react-native";
import { ErrorBoundary } from "../components/__ErrorBoundary";
import { OneDollarStatsProvider } from "../lib/__analytics";
import { isWeb, startWebSafeArea } from "../lib/__web-safe-area";
import { authClient } from "../lib/auth";
import { Colors } from "../constants/theme";
import appJson from "../app.json";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const applicationId = appJson.expo.extra.applicationId ?? "";
const hostname = applicationId ? `${applicationId}-mobile` : "localhost";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
  });

  useEffect(() => {
    if (isWeb) startWebSafeArea();
  }, []);

  useEffect(() => {
    void authClient.managedAuth.handleRedirect();
  }, []);

  return (
    <ErrorBoundary>
      {/* Runable analytics provider — do not remove, required for analytics tracking */}
      <OneDollarStatsProvider
        config={{
          hostname,
          collectorUrl: "https://r.lilstts.com/events",
          devmode: true,
        }}
      >
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            {fontsLoaded ? (
              <Slot />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.light.background,
                }}
              >
                <ActivityIndicator color={Colors.light.primary} />
              </View>
            )}
          </QueryClientProvider>
        </SafeAreaProvider>
      </OneDollarStatsProvider>
    </ErrorBoundary>
  );
}
