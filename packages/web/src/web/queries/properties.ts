import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useToast } from "../components/toast";

export type SearchInput = {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  types?: string[];
  zip?: string;
  sort: "score" | "priceAsc" | "priceDesc" | "newest";
};

export function usePropertySearch(input: SearchInput) {
  return useQuery(orpc.properties.search.queryOptions({ input }));
}

export function useFacets() {
  return useQuery(orpc.properties.facets.queryOptions({ staleTime: 5 * 60_000 }));
}

export function useProperty(id: string) {
  return useQuery(orpc.properties.get.queryOptions({ input: { id }, enabled: Boolean(id) }));
}

export function useSavedProperties(enabled = true) {
  return useQuery(orpc.properties.saved.queryOptions({ enabled }));
}

/** Optimistic save toggle — the list flips instantly, the award toast follows. */
export function useToggleSave() {
  const qc = useQueryClient();
  const { pushAward } = useToast();
  return useMutation(
    orpc.properties.toggleSave.mutationOptions({
      onMutate: async ({ propertyId }) => {
        const searchKey = orpc.properties.search.key();
        await qc.cancelQueries({ queryKey: searchKey });
        const snapshots = qc.getQueriesData({ queryKey: searchKey });
        qc.setQueriesData({ queryKey: searchKey }, (old: unknown) =>
          Array.isArray(old)
            ? old.map((p: { id: string; saved: boolean }) =>
                p.id === propertyId ? { ...p, saved: !p.saved } : p,
              )
            : old,
        );
        const detailKey = orpc.properties.get.key({ input: { id: propertyId } });
        const detail = qc.getQueryData(detailKey);
        if (detail) {
          qc.setQueryData(detailKey, (old: unknown) =>
            old && typeof old === "object"
              ? { ...(old as { saved: boolean }), saved: !(old as { saved: boolean }).saved }
              : old,
          );
        }
        return { snapshots, detailKey, detail };
      },
      onError: (_err, _input, ctx) => {
        ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
        if (ctx?.detail) qc.setQueryData(ctx.detailKey, ctx.detail);
      },
      onSuccess: (data) => pushAward(data.awarded),
      onSettled: () => {
        qc.invalidateQueries({ queryKey: orpc.properties.key() });
        qc.invalidateQueries({ queryKey: orpc.gamification.key() });
      },
    }),
  );
}
