import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useToast } from "../components/toast";

export function useWatchedZips(enabled = true) {
  return useQuery(orpc.alerts.watched.queryOptions({ enabled }));
}

export function useFiredAlerts() {
  return useQuery(orpc.alerts.fired.queryOptions());
}

export function useWatchZip() {
  const qc = useQueryClient();
  const { pushAward } = useToast();
  return useMutation(
    orpc.alerts.watch.mutationOptions({
      onSuccess: (data) => pushAward(data.awarded),
      onSettled: () => {
        qc.invalidateQueries({ queryKey: orpc.alerts.key() });
        qc.invalidateQueries({ queryKey: orpc.gamification.key() });
      },
    }),
  );
}

export function useUnwatchZip() {
  const qc = useQueryClient();
  return useMutation(
    orpc.alerts.unwatch.mutationOptions({
      onMutate: async ({ zip }) => {
        const key = orpc.alerts.watched.key();
        await qc.cancelQueries({ queryKey: key });
        const prev = qc.getQueryData(key);
        qc.setQueryData(key, (old: unknown) =>
          Array.isArray(old) ? old.filter((w: { zip: string }) => w.zip !== zip) : old,
        );
        return { prev, key };
      },
      onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
      onSettled: () => qc.invalidateQueries({ queryKey: orpc.alerts.key() }),
    }),
  );
}
