import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitasService } from '@/services/visitasService';
import { Visita } from '@/types/database.types';
import { getGroupedVisitas } from '@/app/actions/visitas';

export function useVisitas() {
  const queryClient = useQueryClient();

  // Query para buscar a lista de visitas técnicas agrupadas vinda do servidor
  const visitasQuery = useQuery({
    queryKey: ['visitas'],
    queryFn: getGroupedVisitas,
    refetchInterval: 30000, // Atualiza automaticamente a cada 30 segundos
    refetchOnWindowFocus: true, // Recarrega ao voltar o foco para o app
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

  // Mutação para exclusão de uma visita técnica
  const deleteVisitaMutation = useMutation({
    mutationFn: (id: string) => visitasService.deleteVisita(id),
    onSuccess: () => {
      // Força a revalidação imediata do cronograma de visitas
      queryClient.invalidateQueries({ queryKey: ['visitas'] });
    },
  });

  return {
    visitas: visitasQuery.data?.rawVisitas || [],
    hojeStr: visitasQuery.data?.hojeStr || '',
    amanhaStr: visitasQuery.data?.amanhaStr || '',
    atrasadas: visitasQuery.data?.atrasadas || [],
    hoje: visitasQuery.data?.hoje || [],
    amanha: visitasQuery.data?.amanha || [],
    proximas: visitasQuery.data?.proximas || [],
    isLoading: visitasQuery.isLoading,
    error: visitasQuery.error,
    updateVisita: updateVisitaMutation.mutateAsync,
    isUpdating: updateVisitaMutation.isPending,
    createVisita: createVisitaMutation.mutateAsync,
    isCreating: createVisitaMutation.isPending,
    deleteVisita: deleteVisitaMutation.mutateAsync,
    isDeleting: deleteVisitaMutation.isPending,
  };
}
