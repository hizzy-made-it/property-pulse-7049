import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/api";

export type SearchInput = {
  city?: string;
  zip?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  sort?: "score" | "priceAsc" | "priceDesc" | "newest";
};

export function usePropertySearch(input: SearchInput) {
  return useQuery(orpc.properties.search.queryOptions({ input: { sort: "score", ...input } }));
}

export function useFacets() {
  return useQuery(orpc.properties.facets.queryOptions());
}

export function useProperty(id: string) {
  return useQuery(orpc.properties.get.queryOptions({ input: { id }, enabled: Boolean(id) }));
}

export function useSavedProperties(enabled = true) {
  return useQuery(orpc.properties.saved.queryOptions({ enabled }));
}

/** Optimistic save toggle — the list flips instantly, the server owns the points. */
export function useToggleSave() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.properties.toggleSave.mutationOptions({
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.properties.key() });
        void queryClient.invalidateQueries({ queryKey: orpc.gamification.key() });
      },
    }),
  );
}
