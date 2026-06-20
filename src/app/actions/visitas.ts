'use server';

import { createServerClient } from '@/lib/supabase';
import { Visita } from '@/types/database.types';
import { cookies } from 'next/headers';

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

  // Agrupamento baseado nas datas do servidor (evitando fuso horário cliente)
  const atrasadas = visits.filter(v => v.data_visita < hojeStr && v.status_visita === 'Agendada');
  const hoje = visits.filter(v => v.data_visita === hojeStr);
  const amanha = visits.filter(v => v.data_visita === amanhaStr);
  const proximas = visits.filter(v => v.data_visita > amanhaStr);

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
