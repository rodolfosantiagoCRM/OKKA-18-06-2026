import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitasService } from '@/services/visitasService';
import { Visita } from '@/types/database.types';

export function useVisitas() {
  const queryClient = useQueryClient();

  // Query para buscar a lista de visitas técnicas
  const visitasQuery = useQuery({
    queryKey: ['visitas'],
    queryFn: visitasService.getVisitas,
  });

  // Mutação para preenchimento de relatório da visita pelo técnico
  const updateVisitaMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Visita> }) =>
      visitasService.updateVisita(id, updates),
    onSuccess: () => {
      // Força a revalidação imediata do cronograma de visitas
      queryClient.invalidateQueries({ queryKey: ['visitas'] });
    },
  });

  // Mutação para agendamento de uma nova visita
  const createVisitaMutation = useMutation({
    mutationFn: visitasService.createVisita,
    onSuccess: () => {
      // Força a revalidação imediata do cronograma de visitas
      queryClient.invalidateQueries({ queryKey: ['visitas'] });
    },
  });

  return {
    visitas: visitasQuery.data || [],
    isLoading: visitasQuery.isLoading,
    error: visitasQuery.error,
    updateVisita: updateVisitaMutation.mutateAsync,
    isUpdating: updateVisitaMutation.isPending,
    createVisita: createVisitaMutation.mutateAsync,
    isCreating: createVisitaMutation.isPending,
  };
}
