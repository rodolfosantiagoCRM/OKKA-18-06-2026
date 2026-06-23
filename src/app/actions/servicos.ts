'use server';

import { createServerClient } from '@/lib/supabase';

const FALLBACK_SERVICES = [
  'Aquecimento de piso',
  'Instalação Sistemas Solares',
  'Limpeza de placas Solares',
  'Carregamento Veicular'
];

export async function getTiposServico(): Promise<string[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('tipos_servico')
      .select('nome')
      .order('nome', { ascending: true });

    if (error) {
      console.warn('Erro ao carregar tipos de serviço do banco, usando fallback:', error.message);
      return FALLBACK_SERVICES;
    }

    if (!data || data.length === 0) {
      return FALLBACK_SERVICES;
    }

    return data.map((d: any) => d.nome);
  } catch (err) {
    console.warn('Erro ao conectar ao banco para buscar tipos de serviço, usando fallback:', err);
    return FALLBACK_SERVICES;
  }
}

export async function criarTipoServico(nome: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    if (!nome || !nome.trim()) {
      return { success: false, error: 'O nome do serviço é obrigatório.' };
    }
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('tipos_servico')
      .insert([{ nome: nome.trim() }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar tipo de serviço:', error);
      return { success: false, error: error.message || 'Erro ao criar tipo de serviço.' };
    }

    return { success: true, data: data.nome };
  } catch (err) {
    console.error('Erro inesperado ao criar tipo de serviço:', err);
    return { success: false, error: (err as Error).message || 'Erro inesperado ao criar tipo de serviço.' };
  }
}
