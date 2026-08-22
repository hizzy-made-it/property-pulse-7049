import { createAuthClient } from "better-auth/react";
import { managedAuthExpoClient } from "@runablehq/managed-auth/native";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Platform-managed identity: never edit `expo.extra` or `expo.scheme` in app.json.
const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  applicationId?: string;
  runableAuthIssuer?: string;
};

const isWeb = Platform.OS === "web";
const TOKEN_KEY = "bearer_token";

export const baseURL = extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "";

/** One token store shared by managed sign-in and email/password sign-in. */
export function getToken(): string {
  try {
    return SecureStore.getItem(TOKEN_KEY) ?? "";
  } catch {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  }
}

function setToken(token: string) {
  try {
    SecureStore.setItem(TOKEN_KEY, token);
  } catch {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  plugins: [
    managedAuthExpoClient({
      applicationId: extra.applicationId ?? "",
      issuer: extra.runableAuthIssuer ?? "",
      storage: { getToken, setToken, clearToken: () => setToken("") },
    }),
  ],
  fetchOptions: {
    ...(isWeb ? { credentials: "omit" as const } : {}),
    auth: { type: "Bearer", token: () => getToken() },
    headers: isWeb ? {} : { "expo-origin": "mobile://" },
  },
});

/** Call in onSuccess of signIn/signUp to capture the bearer token. */
export function captureToken(ctx: { response: Response }) {
  const token = ctx.response.headers.get("set-auth-token");
  if (token) setToken(token);
}

export async function clearToken() {
  setToken("");
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const useSession = authClient.useSession;
