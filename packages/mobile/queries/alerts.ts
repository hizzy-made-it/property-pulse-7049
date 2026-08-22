import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/api";

/** Fired signals on the ZIPs the signed-in user watches. */
export function useFiredAlerts() {
  return useQuery(orpc.alerts.fired.queryOptions());
}
