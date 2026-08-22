import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useToast } from "../components/toast";

export function useAdminOverview(enabled = true) {
  return useQuery(orpc.admin.overview.queryOptions({ enabled, retry: false }));
}

export function useAdminProperties(enabled = true) {
  return useQuery(orpc.admin.properties.queryOptions({ enabled, retry: false }));
}

export function useAdminZips(enabled = true) {
  return useQuery(orpc.admin.zips.queryOptions({ enabled, retry: false }));
}

export function useAdminLeads(enabled = true) {
  return useQuery(orpc.admin.leads.queryOptions({ enabled, retry: false }));
}

export function useAdminUsers(enabled = true) {
  return useQuery(orpc.admin.users.queryOptions({ enabled, retry: false }));
}

function useAdminMutation<T extends { mutationOptions: (o?: unknown) => unknown }>(
  proc: T,
  message: string,
) {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation(
    (proc.mutationOptions as (o: unknown) => never)({
      onSuccess: () => push(message),
      onSettled: () => {
        qc.invalidateQueries({ queryKey: orpc.admin.key() });
        qc.invalidateQueries({ queryKey: orpc.properties.key() });
        qc.invalidateQueries({ queryKey: orpc.zips.key() });
        qc.invalidateQueries({ queryKey: orpc.leads.key() });
      },
    }),
  );
}

export const useUpsertProperty = () => useAdminMutation(orpc.admin.upsertProperty, "PROPERTY SAVED");
export const useDeleteProperty = () => useAdminMutation(orpc.admin.deleteProperty, "PROPERTY REMOVED");
export const useUpsertZip = () => useAdminMutation(orpc.admin.upsertZip, "ZIP SAVED");
export const useDeleteZip = () => useAdminMutation(orpc.admin.deleteZip, "ZIP REMOVED");
export const useUpsertLead = () => useAdminMutation(orpc.admin.upsertLead, "LEAD SAVED");
export const useDeleteLead = () => useAdminMutation(orpc.admin.deleteLead, "LEAD REMOVED");
export const useGrantRole = () => useAdminMutation(orpc.admin.grantRole, "ROLE GRANTED");
