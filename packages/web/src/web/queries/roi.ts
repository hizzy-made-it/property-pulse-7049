import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useToast } from "../components/toast";

export interface RoiInputs {
  price: number;
  down: number;
  rate: number;
  term: number;
  rent: number;
  vac: number;
  taxes: number;
  ins: number;
  maint: number;
  mgmt: number;
}

/** Results recompute as you type — the server owns the formulas. */
export function useRoi(inputs: RoiInputs) {
  return useQuery(
    orpc.roi.calculate.queryOptions({ input: inputs, staleTime: 60_000, placeholderData: (p) => p }),
  );
}

export function useScenarios(enabled = true) {
  return useQuery(orpc.roi.list.queryOptions({ enabled }));
}

export function useSaveScenario() {
  const qc = useQueryClient();
  const { pushAward } = useToast();
  return useMutation(
    orpc.roi.save.mutationOptions({
      onSuccess: (data) => pushAward(data.awarded),
      onSettled: () => {
        qc.invalidateQueries({ queryKey: orpc.roi.key() });
        qc.invalidateQueries({ queryKey: orpc.gamification.key() });
      },
    }),
  );
}

export function useDeleteScenario() {
  const qc = useQueryClient();
  return useMutation(
    orpc.roi.remove.mutationOptions({
      onSettled: () => qc.invalidateQueries({ queryKey: orpc.roi.key() }),
    }),
  );
}
