'use server';

import { createServerClient } from '@/lib/supabase';
import { Visita, ResponsavelTecnico } from '@/types/database.types';
import { cookies } from 'next/headers';

export interface DesempenhoTecnico {
  tecnicoId: string;
  nome: string;
  email: string;
  telefone: string;
  totalVisitas: number;
  totalConcluidas: number;
  totalAtrasadas: number;
  taxaConclusao: number;
}

export interface RelatorioEficiencia {
  hojeStr: string;
  seteDiasAtrasStr: string;
  globalTotal: number;
  globalConcluidas: number;
  globalAtrasadas: number;
  globalTaxaConclusao: number;
  desempenho: DesempenhoTecnico[];
}

export async function getTecnicosEficiencia(): Promise<RelatorioEficiencia> {
  const supabase = createServerClient();

  // Obter o token do usuário logado e buscar seu empresa_id
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  if (!token) {
    throw new Error('Não autorizado: Sessão ausente.');
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Não autorizado: Sessão inválida.');
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('perfis_usuarios')
    .select('role, empresa_id, status_acesso')
    .eq('id', user.id)
    .single();

  if (perfilError || !perfil) {
    throw new Error('Erro ao carregar perfil do usuário.');
  }

  if (perfil.status_acesso === false) {
    throw new Error('Acesso negado: Seu usuário está bloqueado.');
  }

  const normalizedRole = (perfil.role || '').toLowerCase();
  const isSuperAdmin = normalizedRole === 'super_admin';
  const empresaId = perfil.empresa_id;

  // Calcular datas baseadas no fuso horário de Brasília
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

  const seteDiasAtras = new Date(now);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const seteDiasAtrasStr = formatTZ(seteDiasAtras);

  try {
    // 1. Buscar todos os técnicos
    let tecQuery = supabase
      .from('responsaveis_tecnicos')
      .select('*')
      .order('nome', { ascending: true });

    if (!isSuperAdmin) {
      tecQuery = tecQuery.eq('empresa_id', empresaId);
    }

    const { data: dbTecnicos, error: tecError } = await tecQuery;

    if (tecError) throw new Error(tecError.message);

    // 2. Buscar todas as visitas do período (últimos 7 dias)
    let visitsQuery = supabase
      .from('visits')
      .select('*')
      .gte('data_visita', seteDiasAtrasStr)
      .lte('data_visita', hojeStr);

    if (!isSuperAdmin) {
      visitsQuery = visitsQuery.eq('empresa_id', empresaId);
    }

    const { data: dbVisits, error: visitsError } = await visitsQuery;

    if (visitsError) throw new Error(visitsError.message);

    const tecnicos = dbTecnicos as ResponsavelTecnico[];
    const visits = dbVisits as Visita[];

    // Se não há dados cadastrados, retornar estrutura zerada funcional
    if (tecnicos.length === 0) {
      return {
        hojeStr,
        seteDiasAtrasStr,
        globalTotal: 0,
        globalConcluidas: 0,
        globalAtrasadas: 0,
        globalTaxaConclusao: 0,
        desempenho: [],
      };
    }

    // 3. Agregação por técnico
    const desempenho: DesempenhoTecnico[] = tecnicos.map((tec) => {
      const visitasTecnico = visits.filter((v) => v.tecnico_id === tec.id);
      const totalVisitas = visitasTecnico.length;
      const totalConcluidas = visitasTecnico.filter((v) => v.status_visita === 'Realizada').length;
      // Conta como atrasada se está agendada e no passado OR se foi realizada com atraso
      const totalAtrasadas = visitasTecnico.filter(
        (v) => (v.data_visita < hojeStr && v.status_visita === 'Agendada') || v.realizada_com_atraso
      ).length;

      const taxaConclusao = totalVisitas > 0 ? Math.round((totalConcluidas / totalVisitas) * 100) : 0;

      return {
        tecnicoId: tec.id,
        nome: tec.nome,
        email: tec.email,
        telefone: tec.telefone,
        totalVisitas,
        totalConcluidas,
        totalAtrasadas,
        taxaConclusao,
      };
    });

    // 4. Métricas globais
    const globalTotal = visits.length;
    const globalConcluidas = visits.filter((v) => v.status_visita === 'Realizada').length;
    const globalAtrasadas = visits.filter(
      (v) => (v.data_visita < hojeStr && v.status_visita === 'Agendada') || v.realizada_com_atraso
    ).length;
    const globalTaxaConclusao = globalTotal > 0 ? Math.round((globalConcluidas / globalTotal) * 100) : 0;

    return {
      hojeStr,
      seteDiasAtrasStr,
      globalTotal,
      globalConcluidas,
      globalAtrasadas,
      globalTaxaConclusao,
      desempenho,
    };
  } catch (error) {
    console.error('Erro ao acessar base do Supabase no relatório de eficiência:', error);
    return {
      hojeStr,
      seteDiasAtrasStr,
      globalTotal: 0,
      globalConcluidas: 0,
      globalAtrasadas: 0,
      globalTaxaConclusao: 0,
      desempenho: [],
    };
  }
}

function getMockFallbackRelatorio(hojeStr: string, seteDiasAtrasStr: string): RelatorioEficiencia {
  const desempenho: DesempenhoTecnico[] = [
    {
      tecnicoId: 't1',
      nome: 'Carlos Eduardo Silva',
      email: 'carlos.silva@hublypro.com.br',
      telefone: '(41) 98888-1234',
      totalVisitas: 8,
      totalConcluidas: 7,
      totalAtrasadas: 0,
      taxaConclusao: 88,
    },
    {
      tecnicoId: 't2',
      nome: 'Fernanda Lima Souza',
      email: 'fernanda.lima@hublypro.com.br',
      telefone: '(41) 97777-5678',
      totalVisitas: 6,
      totalConcluidas: 4,
      totalAtrasadas: 1,
      taxaConclusao: 67,
    },
    {
      tecnicoId: 't3',
      nome: 'Rodrigo Medeiros',
      email: 'rodrigo.medeiros@hublypro.com.br',
      telefone: '(11) 99111-2233',
      totalVisitas: 5,
      totalConcluidas: 5,
      totalAtrasadas: 0,
      taxaConclusao: 100,
    },
  ];

  return {
    hojeStr,
    seteDiasAtrasStr,
    globalTotal: 19,
    globalConcluidas: 16,
    globalAtrasadas: 1,
    globalTaxaConclusao: 84,
    desempenho,
  };
}
