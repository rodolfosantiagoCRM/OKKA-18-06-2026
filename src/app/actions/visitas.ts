'use server';

import { createServerClient } from '@/lib/supabase';
import { Visita } from '@/types/database.types';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function getGroupedVisitas() {
  const supabase = createServerClient();

  // Validar se o usuário logado é técnico ou instalador e filtrar por ID
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  
  let currentUserId: string | null = null;
  let isTechnicalUser = false;

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      currentUserId = user.id;
      let role = user.user_metadata?.role || '';
      
      if (!role) {
        // Tentar obter da tabela perfis_usuarios
        const { data: perfil } = await supabase
          .from('perfis_usuarios')
          .select('role')
          .eq('id', user.id)
          .single();
        if (perfil?.role) {
          role = perfil.role;
        } else {
          // Tentar obter da tabela perfis
          const { data: perfilAntigo } = await supabase
            .from('perfis')
            .select('role')
            .eq('id', user.id)
            .single();
          if (perfilAntigo?.role) {
            role = perfilAntigo.role;
          }
        }
      }
      
      const normalizedRole = (role || '').toLowerCase();
      if (normalizedRole === 'tecnico' || normalizedRole === 'instalador') {
        isTechnicalUser = true;
      }
    }
  }

  let query = supabase
    .from('visits')
    .select('*, projects(*, leads(*)), responsaveis_tecnicos(*)');

  // Aplicar restrição de técnico se for o caso
  if (isTechnicalUser && currentUserId) {
    query = query.eq('tecnico_id', currentUserId);
  }

  const { data, error } = await query
    .order('data_visita', { ascending: true })
    .order('horario', { ascending: true });

  if (error) {
    console.error('Erro ao buscar visitas no banco:', error);
    throw new Error(error.message || 'Erro ao carregar cronograma de visitas.');
  }

  const visits = (data || []) as unknown as Visita[];

  // Obter datas corretas no fuso horário do Brasil (America/Sao_Paulo)
  const now = new Date();
  const formatTZ = (d: Date) => {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    const [day, month, year] = formatted.split('/');
    return `${year}-${month}-${day}`;
  };

  const hojeStr = formatTZ(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const amanhaStr = formatTZ(tomorrow);

  // IMPORTANTE: atrasadas = status 'Agendada' com data ANTERIOR a hoje (não aparecem em "Hoje")
  // hoje = visitas do dia de hoje (apenas status 'Agendada')
  // amanha = visitas de amanhã (apenas status 'Agendada')
  // proximas = visitas após amanhã (apenas status 'Agendada')
  const atrasadas = visits.filter(v => v.data_visita < hojeStr && v.status_visita === 'Agendada');
  const hoje = visits.filter(v => v.data_visita === hojeStr && v.status_visita === 'Agendada');
  const amanha = visits.filter(v => v.data_visita === amanhaStr && v.status_visita === 'Agendada');
  const proximas = visits.filter(v => v.data_visita > amanhaStr && v.status_visita === 'Agendada');

  return {
    hojeStr,
    amanhaStr,
    atrasadas,
    hoje,
    amanha,
    proximas,
    rawVisitas: visits,
  };
}

/**
 * Exclui uma visita técnica pelo ID usando service_role (ignora RLS).
 * Deve ser chamada apenas por administradores/mestres.
 */
export async function deleteVisitaAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // createServerClient usa SUPABASE_SERVICE_ROLE_KEY → bypassa RLS
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir visita:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exceção ao excluir visita:', err);
    return { success: false, error: err?.message || 'Erro inesperado ao excluir visita.' };
  }
}

export async function criarNovaVisita(formData: FormData): Promise<{ success: boolean; data?: Visita; error?: string }> {
  try {
    const supabase = createServerClient();
    
    // Extração dos dados do FormData
    const projectId = formData.get('project_id') as string;
    const tecnicoId = formData.get('tecnico_id') as string | null;
    const dataVisita = formData.get('data_visita') as string;
    const horario = formData.get('horario') as string;
    const observacoes = formData.get('observacoes') as string || '';
    const pdfFile = formData.get('pdf_proposta') as File | null;

    if (!projectId) {
      return { success: false, error: 'O ID do projeto é obrigatório.' };
    }
    if (!dataVisita) {
      return { success: false, error: 'A data da visita é obrigatória.' };
    }
    if (!horario) {
      return { success: false, error: 'O horário da visita é obrigatório.' };
    }

    let pdfUrl: string | null = null;

    // Se houver arquivo PDF
    if (pdfFile && pdfFile.size > 0) {
      if (!pdfFile.name.toLowerCase().endsWith('.pdf') && pdfFile.type !== 'application/pdf') {
        return { success: false, error: 'Apenas arquivos PDF são permitidos.' };
      }

      // Upload do arquivo para o bucket documentos_crm
      const fileBuffer = Buffer.from(await pdfFile.arrayBuffer());
      const fileExt = 'pdf';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documentos_crm')
        .upload(fileName, fileBuffer, {
          contentType: 'application/pdf',
          duplex: 'half'
        });

      if (uploadError) {
        console.error('Erro ao subir PDF no Storage:', uploadError);
        return { success: false, error: `Erro no upload da proposta: ${uploadError.message}` };
      }

      // Recuperar URL pública
      const { data: urlData } = supabase.storage
        .from('documentos_crm')
        .getPublicUrl(fileName);

      pdfUrl = urlData.publicUrl;
    }

    // Inserção no banco
    const { data: visitaData, error: dbError } = await supabase
      .from('visits')
      .insert([
        {
          project_id: projectId,
          data_visita: dataVisita,
          horario: horario,
          status_visita: 'Agendada',
          material_usado: [],
          valor_gasto: 0,
          observacoes: observacoes,
          tecnico_id: tecnicoId || null,
          pdf_proposta_url: pdfUrl
        }
      ])
      .select('*, projects(*, leads(*)), responsaveis_tecnicos(*)')
      .single();

    if (dbError) {
      console.error('Erro ao salvar visita no banco:', dbError);
      
      // Rollback manual do arquivo de storage se a inserção no banco falhar
      if (pdfUrl) {
        const fileName = pdfUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from('documentos_crm').remove([fileName]);
        }
      }
      return { success: false, error: `Erro ao salvar visita no banco: ${dbError.message}` };
    }

    return { success: true, data: visitaData as unknown as Visita };
  } catch (err: any) {
    console.error('Exceção ao criar nova visita:', err);
    return { success: false, error: err?.message || 'Erro inesperado ao criar nova visita.' };
  }
}
