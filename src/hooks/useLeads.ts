import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsService } from '@/services/leadsService';

export function useLeads() {
  const queryClient = useQueryClient();

  // Query para buscar leads (utilizado no CRM)
  const leadsQuery = useQuery({
    queryKey: ['leads'],
    queryFn: leadsService.getLeads,
  });

  // Mutação para criar novos leads (utilizado na Landing Page ou CRM)
  const createLeadMutation = useMutation({
    mutationFn: leadsService.createLead,
    onSuccess: () => {
      // Força a revalidação da query de leads
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // Mutação para atualizar o status de um lead
  const updateLeadStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: import('@/types/database.types').Lead['status'] }) =>
      leadsService.updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // Mutação para atualizar um lead completo
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<import('@/types/database.types').Lead> }) =>
      leadsService.updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  return {
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    error: leadsQuery.error,
    createLead: createLeadMutation.mutateAsync,
    isCreating: createLeadMutation.isPending,
    updateLeadStatus: updateLeadStatusMutation.mutateAsync,
    isUpdatingStatus: updateLeadStatusMutation.isPending,
    updateLead: updateLeadMutation.mutateAsync,
    isUpdatingLead: updateLeadMutation.isPending,
  };
}
