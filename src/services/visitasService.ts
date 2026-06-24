import { supabase } from '@/lib/supabase';
import { Visita } from '@/types/database.types';

export const visitasService = {
  /**
   * Obtém a lista completa de visitas técnicas, incluindo os dados do projeto e do lead associado
   */
  async getVisitas(): Promise<Visita[]> {
    const { data, error } = await supabase
      .from('visits')
      .select('*, projects(*, leads(*)), responsaveis_tecnicos(*), empresas(*)')
      .order('data_visita', { ascending: true })
      .order('horario', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Erro ao carregar cronograma de visitas.');
    }

    // Como o Supabase retorna joins na tipagem de objetos aninhados,
    // mapeamos o resultado para corresponder à nossa interface Visita
    return (data || []) as unknown as Visita[];
  },

  /**
   * Atualiza as informações de uma visita técnica (relato do técnico no campo)
   */
  async updateVisita(id: string, updates: Partial<Visita>): Promise<Visita> {
    const { data, error } = await supabase
      .from('visits')
      .update({
        status_visita: updates.status_visita,
        material_usado: updates.material_usado,
        valor_gasto: updates.valor_gasto,
        observacoes: updates.observacoes,
        data_visita: updates.data_visita,
        horario: updates.horario,
        tecnico_id: updates.tecnico_id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Erro ao salvar relatório da visita.');
    }
    return data as Visita;
  },

  /**
   * Cria uma nova visita técnica agendada para um projeto
   */
  async createVisita(visita: {
    project_id: string;
    data_visita: string;
    horario: string;
    status_visita?: 'Agendada' | 'Realizada' | 'Cancelada';
    observacoes?: string;
    tecnico_id?: string | null;
    pdf_proposta_url?: string | null;
    agendado_por?: string | null;
    empresa_id?: string | null;
  }): Promise<Visita> {
    // Tentar inferir o empresa_id da sessão ativa do usuário logado
    let empresaId = visita.empresa_id;
    if (!empresaId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.empresa_id) {
        empresaId = session.user.user_metadata.empresa_id;
      }
    }

    const { data, error } = await supabase
      .from('visits')
      .insert([
        {
          project_id: visita.project_id,
          data_visita: visita.data_visita,
          horario: visita.horario,
          status_visita: visita.status_visita || 'Agendada',
          material_usado: [],
          valor_gasto: 0,
          observacoes: visita.observacoes || '',
          tecnico_id: visita.tecnico_id || null,
          pdf_proposta_url: visita.pdf_proposta_url || null,
          agendado_por: visita.agendado_por || null,
          ...(empresaId && { empresa_id: empresaId }),
        },
      ])
      .select('*, projects(*, leads(*)), responsaveis_tecnicos(*), empresas(*)')
      .single();

    if (error) {
      throw new Error(error.message || 'Erro ao criar visita técnica.');
    }
    return data as unknown as Visita;
  },

  /**
   * Exclui uma visita técnica pelo ID
   */
  async deleteVisita(id: string): Promise<void> {
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Erro ao excluir visita técnica.');
    }
  },

  /**
   * Obtém todas as visitas técnicas de um projeto específico, incluindo o responsável técnico
   */
  async getVisitasByProjectId(projectId: string): Promise<Visita[]> {
    const { data, error } = await supabase
      .from('visits')
      .select('*, responsaveis_tecnicos(*)')
      .eq('project_id', projectId)
      .order('data_visita', { ascending: false })
      .order('horario', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Erro ao carregar histórico de visitas do projeto.');
    }
    return (data || []) as unknown as Visita[];
  },
};
