// Entry point referenced by index.html — composition only, real bootstrap
// lives in __main.tsx (template-managed).
import type {} from "./__main";
import { authClient } from "./lib/auth";

// Finish a returning managed sign-in before the app renders.
await authClient.managedAuth.handleRedirect();

await import("./__main");
