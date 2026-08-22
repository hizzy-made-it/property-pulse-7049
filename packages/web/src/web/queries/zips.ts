import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export type HeatMetric = "emerging" | "velocity" | "permits";

export function useZips() {
  return useQuery(orpc.zips.list.queryOptions({ staleTime: 5 * 60_000 }));
}

export function useHeat(metric: HeatMetric) {
  return useQuery(orpc.zips.heat.queryOptions({ input: { metric }, staleTime: 5 * 60_000 }));
}

export function useZip(zip: string, enabled = true) {
  return useQuery(orpc.zips.get.queryOptions({ input: { zip }, enabled: enabled && Boolean(zip) }));
}
