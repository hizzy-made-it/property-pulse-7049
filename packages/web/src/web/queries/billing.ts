import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useToast } from "../components/toast";

export function usePlans() {
  return useQuery(orpc.billing.plans.queryOptions({ staleTime: 10 * 60_000 }));
}

export function useCurrentPlan(enabled = true) {
  return useQuery(orpc.billing.current.queryOptions({ enabled }));
}

/** Stubbed checkout: state changes, nothing is charged. */
export function useSubscribe() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation(
    orpc.billing.subscribe.mutationOptions({
      onSuccess: (data) => push(`PLAN SET · ${data.plan.toUpperCase()} · NO CHARGE (STUB)`),
      onSettled: () => {
        qc.invalidateQueries({ queryKey: orpc.billing.key() });
        qc.invalidateQueries({ queryKey: orpc.profile.key() });
      },
    }),
  );
}
