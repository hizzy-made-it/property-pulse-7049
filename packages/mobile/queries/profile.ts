import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/api";

/** Session user, the roles they hold, and their stubbed plan. */
export function useMe() {
  return useQuery(orpc.profile.me.queryOptions());
}
