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

  // Mutação para atualizar o status/estágio de um projeto
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, status_projeto }: { id: string; status_projeto: import('@/types/database.types').Project['status_projeto'] }) =>
      projectsService.updateProjectStatus(id, status_projeto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Mutação para excluir um projeto
  const deleteProjectMutation = useMutation({
    mutationFn: projectsService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['visitas'] });
    },
  });

  return {
    projects: projectsQuery.data || [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject: createProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
    updateProjectStatus: updateProjectMutation.mutateAsync,
    isUpdatingProject: updateProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutateAsync,
    isDeletingProject: deleteProjectMutation.isPending,
  };
}
