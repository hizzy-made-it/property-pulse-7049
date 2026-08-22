import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useToast } from "../components/toast";

export function useImprovements() {
  return useQuery(orpc.renovation.improvements.queryOptions({ staleTime: 5 * 60_000 }));
}

export function useContractors() {
  return useQuery(orpc.renovation.contractors.queryOptions({ staleTime: 5 * 60_000 }));
}

export function useProjects(enabled = true) {
  return useQuery(orpc.renovation.projects.queryOptions({ enabled, staleTime: 60_000 }));
}

export function useStressTest() {
  const qc = useQueryClient();
  const { pushAward } = useToast();
  return useMutation(
    orpc.renovation.stressTest.mutationOptions({
      onSuccess: (data) => pushAward(data.awarded),
      onSettled: () => qc.invalidateQueries({ queryKey: orpc.gamification.key() }),
    }),
  );
}
