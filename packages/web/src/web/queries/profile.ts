import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useMe() {
  return useQuery(orpc.profile.me.queryOptions({ staleTime: 15_000 }));
}

export function useAddRole() {
  const qc = useQueryClient();
  return useMutation(
    orpc.profile.addRole.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.profile.key() }),
    }),
  );
}

export function useRemoveRole() {
  const qc = useQueryClient();
  return useMutation(
    orpc.profile.removeRole.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.profile.key() }),
    }),
  );
}

export function useSetPrimaryRole() {
  const qc = useQueryClient();
  return useMutation(
    orpc.profile.setPrimaryRole.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.profile.key() }),
    }),
  );
}
