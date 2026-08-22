import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useToast } from "../components/toast";

export function usePulseProfile(enabled = true) {
  return useQuery(orpc.gamification.profile.queryOptions({ enabled, staleTime: 10_000 }));
}

export function useClaimBrief() {
  const qc = useQueryClient();
  const { pushAward } = useToast();
  return useMutation(
    orpc.gamification.claimDailyBrief.mutationOptions({
      onSuccess: (data) => pushAward(data.awarded ? data : null),
      onSettled: () => {
        qc.invalidateQueries({ queryKey: orpc.gamification.key() });
        qc.invalidateQueries({ queryKey: orpc.leaderboards.key() });
      },
    }),
  );
}

export function useSetLeague() {
  const qc = useQueryClient();
  return useMutation(
    orpc.gamification.setLeague.mutationOptions({
      onSettled: () => {
        qc.invalidateQueries({ queryKey: orpc.gamification.key() });
        qc.invalidateQueries({ queryKey: orpc.leaderboards.key() });
      },
    }),
  );
}

export function useSetIdentity() {
  const qc = useQueryClient();
  return useMutation(
    orpc.gamification.setIdentity.mutationOptions({
      onSettled: () => {
        qc.invalidateQueries({ queryKey: orpc.gamification.key() });
        qc.invalidateQueries({ queryKey: orpc.leaderboards.key() });
      },
    }),
  );
}
