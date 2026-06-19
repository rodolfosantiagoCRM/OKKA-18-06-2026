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
  }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          lead_id: project.lead_id,
          endereco: project.endereco,
          valor_total: project.valor_total,
          status_projeto: project.status_projeto || 'Orçamento',
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
};
