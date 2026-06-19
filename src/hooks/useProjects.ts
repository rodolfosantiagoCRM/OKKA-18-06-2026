import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '@/services/projectsService';

export function useProjects() {
  const queryClient = useQueryClient();

  // Query para buscar a lista de projetos do CRM
  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getProjects,
  });

  // Mutação para criar novos projetos (vinculado à qualificação de Leads)
  const createProjectMutation = useMutation({
    mutationFn: projectsService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects: projectsQuery.data || [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject: createProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
  };
}
