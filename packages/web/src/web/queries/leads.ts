import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useToast } from "../components/toast";

export function useLeads(input: { audience: "realtor" | "contractor"; tier?: string; exclusivity?: string }) {
  return useQuery(orpc.leads.list.queryOptions({ input }));
}

export function usePurchasedLeads(enabled = true) {
  return useQuery(orpc.leads.purchased.queryOptions({ enabled }));
}

export function useBuyLead() {
  const qc = useQueryClient();
  const { pushAward, push } = useToast();
  return useMutation(
    orpc.leads.purchase.mutationOptions({
      onSuccess: (data) => {
        if (data.awarded) pushAward(data.awarded);
        else push("LEAD ALREADY IN YOUR BOOK");
      },
      onSettled: () => {
        qc.invalidateQueries({ queryKey: orpc.leads.key() });
        qc.invalidateQueries({ queryKey: orpc.gamification.key() });
      },
    }),
  );
}

export function useSetLeadStatus() {
  const qc = useQueryClient();
  return useMutation(
    orpc.leads.setStatus.mutationOptions({
      onSettled: () => qc.invalidateQueries({ queryKey: orpc.leads.key() }),
    }),
  );
}
