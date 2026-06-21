'use server';

import { createServerClient } from '@/lib/supabase';
import { cookies, headers } from 'next/headers';
import { Fatura, PlanoSaaS } from '@/types/database.types';

// Helper de segurança para validar se o requisitante é mestre ou super_admin ativo e obter dados de contexto
async function getMestreUserContext(supabaseClient: ReturnType<typeof createServerClient>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token) {
    throw new Error('Não autorizado: Sessão ausente.');
  }

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Não autorizado: Sessão inválida.');
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('perfis_usuarios')
    .select('role, status_acesso, empresa_id, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Erro ao validar permissões do usuário.');
  }

  if (profile.role !== 'mestre' && profile.role !== 'super_admin') {
    throw new Error('Acesso negado: Permissão restrita ao proprietário da conta mestra.');
  }

  if (profile.status_acesso === false) {
    throw new Error('Acesso negado: Seu usuário está bloqueado.');
  }

  if (!profile.empresa_id) {
    throw new Error('Nenhuma empresa vinculada a este usuário.');
  }

  return {
    empresa_id: profile.empresa_id,
    email: profile.email || user.email || ''
  };
}

/**
 * Busca os dados consolidados do faturamento da empresa atual, faturas e planos disponíveis
 */
export async function getFaturamentoDados() {
  try {
    const supabase = createServerClient();
    const context = await getMestreUserContext(supabase);

    // 1. Buscar a empresa para verificar o status de assinatura atual
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome_fantasia, status_assinatura, assinatura_mp_id')
      .eq('id', context.empresa_id)
      .single();

    if (empresaError || !empresa) {
      console.error('Erro ao buscar empresa:', empresaError);
      return { success: false, error: 'Empresa não encontrada no sistema.' };
    }

    // 2. Buscar o histórico de faturas
    const { data: faturas, error: faturasError } = await supabase
      .from('faturas')
      .select('*')
      .eq('empresa_id', context.empresa_id)
      .order('criado_em', { ascending: false });

    if (faturasError) {
      console.error('Erro ao buscar faturas:', faturasError);
      return { success: false, error: 'Erro ao carregar o histórico de faturas.' };
    }

    // 3. Buscar os planos SaaS disponíveis no sistema
    const { data: planos, error: planosError } = await supabase
      .from('planos_saas')
      .select('*')
      .order('valor', { ascending: true });

    if (planosError) {
      console.error('Erro ao buscar planos SaaS:', planosError);
      return { success: false, error: 'Erro ao buscar planos disponíveis.' };
    }

    return {
      success: true,
      empresa,
      faturas: faturas as Fatura[],
      planos: planos as PlanoSaaS[]
    };
  } catch (err: any) {
    console.error('Erro no getFaturamentoDados:', err);
    return { success: false, error: err.message || 'Erro inesperado ao carregar dados de faturamento.' };
  }
}

/**
 * Cria uma assinatura (preapproval) no Mercado Pago e gera o link do checkout de pagamento
 */
export async function iniciarCheckoutAssinatura(planoId: string) {
  try {
    const supabase = createServerClient();
    const context = await getMestreUserContext(supabase);

    // 1. Buscar detalhes do plano no banco
    const { data: plano, error: planoError } = await supabase
      .from('planos_saas')
      .select('*')
      .eq('id', planoId)
      .single();

    if (planoError || !plano) {
      console.error('Erro ao buscar plano:', planoError);
      return { success: false, error: 'Plano não encontrado ou indisponível.' };
    }

    // 2. Recuperar as credenciais do Mercado Pago
    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!mpToken) {
      return { 
        success: false, 
        error: 'Serviço de pagamento indisponível: Credenciais do Mercado Pago ausentes no servidor.' 
      };
    }

    // 3. Gerar a URL de retorno dinâmica (back_url) baseada no Host da requisição
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const back_url = `${protocol}://${host}/dashboard/mestre/configuracoes/assinatura`;

    console.log(`[Faturamento Server Action] Iniciando checkout de assinatura para plano ${plano.nome} (MP Plan: ${plano.mp_plan_id})`);

    // 4. Chamar a API de Preapproval do Mercado Pago para obter o init_point (Checkout Pro de Assinatura)
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        preapproval_plan_id: plano.mp_plan_id,
        payer_email: context.email,
        back_url: back_url,
        reason: `Assinatura ${plano.nome} - Hubly Pro`,
        external_reference: context.empresa_id,
        status: 'pending'
      })
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error(`[Faturamento Server Action] Erro na API do Mercado Pago (HTTP ${mpResponse.status}):`, errorText);
      
      let friendlyError = 'Não foi possível gerar a assinatura no Mercado Pago.';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) friendlyError = `Mercado Pago: ${errorJson.message}`;
      } catch (_) {}

      return { success: false, error: friendlyError };
    }

    const mpData = await mpResponse.json();

    if (!mpData.init_point) {
      console.error('[Faturamento Server Action] Campo init_point ausente na resposta do Mercado Pago:', mpData);
      return { success: false, error: 'Mercado Pago não retornou a URL de redirecionamento do checkout.' };
    }

    return {
      success: true,
      url: mpData.init_point
    };
  } catch (err: any) {
    console.error('Erro no iniciarCheckoutAssinatura:', err);
    return { success: false, error: err.message || 'Erro inesperado ao gerar link de pagamento.' };
  }
}

/**
 * Busca os detalhes de uma fatura específica para geração do recibo
 */
export async function getFaturaDetails(faturaId: string) {
  try {
    const supabase = createServerClient();
    const context = await getMestreUserContext(supabase);

    // 1. Buscar a fatura garantindo o isolamento da empresa
    const { data: fatura, error: faturaError } = await supabase
      .from('faturas')
      .select('*')
      .eq('id', faturaId)
      .eq('empresa_id', context.empresa_id)
      .single();

    if (faturaError || !fatura) {
      console.error('Erro ao buscar fatura:', faturaError);
      return { success: false, error: 'Fatura não encontrada ou sem permissão de acesso.' };
    }

    // 2. Buscar dados adicionais da empresa para o recibo
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('nome_fantasia, cnpj')
      .eq('id', context.empresa_id)
      .single();

    if (empresaError || !empresa) {
      console.error('Erro ao buscar empresa para recibo:', empresaError);
      return { success: false, error: 'Dados da empresa não localizados.' };
    }

    return {
      success: true,
      fatura: fatura as Fatura,
      empresa
    };
  } catch (err: any) {
    console.error('Erro no getFaturaDetails:', err);
    return { success: false, error: err.message || 'Erro inesperado ao buscar faturamento.' };
  }
}

