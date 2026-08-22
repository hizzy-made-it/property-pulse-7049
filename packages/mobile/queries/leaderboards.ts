import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/api";

/** Season boards for all three leagues + the movers tape. */
export function useSeasonBoards() {
  return useQuery(orpc.leaderboards.season.queryOptions());
}
