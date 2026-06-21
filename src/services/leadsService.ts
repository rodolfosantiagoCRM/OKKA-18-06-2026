import { supabase } from '@/lib/supabase';
import { Lead } from '@/types/database.types';

export const leadsService = {
  /**
   * Cria um novo lead (chamado pela Landing Page)
   */
  async createLead(lead: {
    nome: string;
    email: string | null;
    telefone: string;
    cidade: string;
    area_m2: number | null;
    endereco_obra?: string | null;
    valor_estimado?: number | null;
    materiais_previstos?: string[] | null;
    observacoes?: string | null;
    status?: Lead['status'];
    cep?: string | null;
  }): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          nome: lead.nome,
          email: lead.email,
          telefone: lead.telefone,
          cidade: lead.cidade,
          area_m2: lead.area_m2,
          endereco_obra: lead.endereco_obra || null,
          valor_estimado: lead.valor_estimado || 0,
          materiais_previstos: lead.materiais_previstos || [],
          observacoes: lead.observacoes || null,
          status: lead.status || 'Novo',
          cep: lead.cep || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Erro ao salvar o lead.');
    }
    return data;
  },

  /**
   * Obtém todos os leads (chamado pelo CRM)
   */
  async getLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Erro ao buscar leads.');
    }
    return data || [];
  },

  /**
   * Atualiza o status de um lead
   */
  async updateLeadStatus(id: string, status: Lead['status']): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Erro ao atualizar status do lead.');
    }
    return data;
  },

  /**
   * Atualiza um lead por completo
   */
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Erro ao atualizar o lead.');
    }
    return data;
  },
};
