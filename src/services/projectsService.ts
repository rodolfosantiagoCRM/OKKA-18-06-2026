import { supabase } from '@/lib/supabase';
import { Project } from '@/types/database.types';

export const projectsService = {
  /**
   * Cria um novo projeto a partir de um Lead qualificado
   */
  async createProject(project: {
    lead_id: string;
    endereco: string;
    valor_total: number;
    status_projeto?: 'Orçamento' | 'Instalação' | 'Concluído';
    empresa_id?: string | null;
  }): Promise<Project> {
    // Tentar inferir o empresa_id da sessão ativa do usuário logado
    let empresaId = project.empresa_id;
    if (!empresaId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.empresa_id) {
        empresaId = session.user.user_metadata.empresa_id;
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          lead_id: project.lead_id,
          endereco: project.endereco,
          valor_total: project.valor_total,
          status_projeto: project.status_projeto || 'Orçamento',
          ...(empresaId && { empresa_id: empresaId }),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Erro ao criar o projeto.');
    }
    return data;
  },

  /**
   * Obtém todos os projetos vinculados ao CRM
   */
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, leads(*)')
      .order('criado_em', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Erro ao buscar projetos.');
    }
    return data || [];
  },

  /**
   * Atualiza o status/estágio de um projeto no Kanban
   */
  async updateProjectStatus(
    id: string,
    status_projeto: Project['status_projeto']
  ): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ status_projeto })
      .eq('id', id)
      .select('*, leads(*)')
      .single();

    if (error) {
      throw new Error(error.message || 'Erro ao atualizar status do projeto.');
    }
    return data as Project;
  },

  /**
   * Exclui um projeto pelo ID
   */
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Erro ao excluir o projeto.');
    }
  },
};
