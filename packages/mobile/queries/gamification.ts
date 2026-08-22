import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/api";

export function usePulseProfile(enabled = true) {
  return useQuery(orpc.gamification.profile.queryOptions({ enabled }));
}

/** Daily brief: once per market day, +15 PP, protects the streak. */
export function useClaimDailyBrief() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.gamification.claimDailyBrief.mutationOptions({
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.gamification.key() });
        void queryClient.invalidateQueries({ queryKey: orpc.leaderboards.key() });
      },
    }),
  );
}
