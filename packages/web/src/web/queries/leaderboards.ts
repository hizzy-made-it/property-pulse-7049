import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useSeasonBoards() {
  return useQuery(orpc.leaderboards.season.queryOptions({ staleTime: 30_000 }));
}
