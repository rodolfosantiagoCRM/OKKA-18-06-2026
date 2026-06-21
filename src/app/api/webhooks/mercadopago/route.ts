import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar o cliente direto com service_role para bypass de RLS no Webhook
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Mercado Pago Webhook] Evento recebido:', JSON.stringify(body));

    // 1. Suporte para payloads de teste direto / mockados (Útil para testes no CRM)
    const testStatus = body.status;
    const testAssinaturaId = body.assinatura_mp_id;
    const testEmpresaId = body.empresa_id;

    if (testStatus && (testAssinaturaId || testEmpresaId)) {
      console.log(`[Mercado Pago Webhook] Executando override de teste: ${testAssinaturaId || testEmpresaId} -> ${testStatus}`);
      const supabaseAdmin = getSupabaseAdmin();
      
      let query = supabaseAdmin.from('empresas').update({ status_assinatura: testStatus });
      if (testEmpresaId) {
        query = query.eq('id', testEmpresaId);
      } else {
        query = query.eq('assinatura_mp_id', testAssinaturaId);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error('[Mercado Pago Webhook] Erro ao atualizar status (override):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Adicionar registro de fatura de teste se o status for ativa ou inadimplente
      if (data && data.length > 0) {
        const statusFatura = testStatus === 'ativa' ? 'Paga' : 'Falhou';
        await supabaseAdmin.from('faturas').insert({
          empresa_id: data[0].id,
          valor: 99.90,
          data_vencimento: new Date().toISOString(),
          status: statusFatura,
          mp_payment_id: 'test_payment_' + Math.random().toString(36).substr(2, 9)
        });
      }

      return NextResponse.json({ success: true, message: 'Status atualizado (override de teste)', data });
    }

    // 2. Extrair informações básicas do webhook do Mercado Pago
    // Mercado Pago pode enviar o evento no campo 'action' (v1/v2 webhooks) ou no campo 'type' (legacy notification)
    const action = body.action || body.type || '';
    
    // O ID do recurso pode vir em data.id ou simplesmente id no topo do objeto
    const resourceId = body.data?.id || body.id;

    if (!resourceId) {
      console.warn('[Mercado Pago Webhook] ID de recurso ausente no payload do webhook.');
      return NextResponse.json({ error: 'ID do recurso não fornecido.' }, { status: 400 });
    }

    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!mpToken) {
      console.warn('[Mercado Pago Webhook] MERCADO_PAGO_ACCESS_TOKEN ausente nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Token do Mercado Pago não configurado no servidor.' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 3. Determinar o tipo de notificação
    // Eventos de pagamento: payment.created, payment.updated, etc.
    const isPaymentEvent = action.startsWith('payment') || body.type === 'payment';
    
    // Eventos de assinatura/preapproval: subscription.authorized, subscription.created, subscription.updated, preapproval, etc.
    const isSubscriptionEvent = 
      action === 'subscription.authorized' ||
      action.startsWith('subscription') || 
      action.startsWith('preapproval') ||
      body.type === 'subscription' ||
      body.type === 'preapproval';

    // A. Tratamento de Pagamentos (payment.created ou payment.updated)
    if (isPaymentEvent) {
      console.log(`[Mercado Pago Webhook] Buscando detalhes do pagamento ${resourceId} na API do MP...`);
      
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${mpToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error(`[Mercado Pago Webhook] Erro ao buscar pagamento no MP (HTTP ${mpResponse.status}):`, errorText);
        return NextResponse.json({ error: 'Erro ao validar pagamento com Mercado Pago.' }, { status: 502 });
      }

      const paymentData = await mpResponse.json();
      const mpStatus = paymentData.status; // approved, rejected, cancelled, refunded, charged_back, pending, in_process
      const empresaId = paymentData.external_reference; // Deve conter o ID da empresa no CRM
      const valor = paymentData.transaction_amount || 0;

      if (!empresaId) {
        console.warn(`[Mercado Pago Webhook] Pagamento MP ${resourceId} recebido sem external_reference. Ignorando.`);
        return NextResponse.json({ success: true, message: 'Evento ignorado: external_reference ausente.' });
      }

      // Validar se a empresa realmente existe no CRM
      const { data: empresa, error: empresaError } = await supabaseAdmin
        .from('empresas')
        .select('id, nome_fantasia')
        .eq('id', empresaId)
        .maybeSingle();

      if (empresaError || !empresa) {
        console.error(`[Mercado Pago Webhook] Empresa ID ${empresaId} correspondente ao external_reference não foi encontrada.`);
        return NextResponse.json({ error: 'Empresa não encontrada no banco.' }, { status: 404 });
      }

      console.log(`[Mercado Pago Webhook] Pagamento verificado no MP. Status: ${mpStatus} | Empresa: ${empresa.nome_fantasia} (${empresaId})`);

      if (mpStatus === 'approved') {
        // 1. Atualizar o status da assinatura na tabela empresas
        const { error: updateError } = await supabaseAdmin
          .from('empresas')
          .update({ status_assinatura: 'ativa' })
          .eq('id', empresaId);

        if (updateError) {
          console.error('[Mercado Pago Webhook] Erro ao ativar assinatura da empresa:', updateError);
        }

        // 2. Registrar a fatura correspondente como 'Paga'
        const { error: faturaError } = await supabaseAdmin
          .from('faturas')
          .insert({
            empresa_id: empresaId,
            valor: valor,
            data_vencimento: new Date().toISOString(),
            status: 'Paga',
            mp_payment_id: String(resourceId)
          });

        if (faturaError) {
          console.error('[Mercado Pago Webhook] Erro ao registrar fatura Paga:', faturaError);
        }

        return NextResponse.json({ success: true, message: 'Assinatura ativada e fatura paga gerada.' });

      } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(mpStatus)) {
        // Se o pagamento falhou, foi recusado ou devolvido
        // 1. Atualizar status da empresa para 'inadimplente'
        const { error: updateError } = await supabaseAdmin
          .from('empresas')
          .update({ status_assinatura: 'inadimplente' })
          .eq('id', empresaId);

        if (updateError) {
          console.error('[Mercado Pago Webhook] Erro ao inadimplir empresa:', updateError);
        }

        // 2. Registrar a fatura como 'Falhou'
        const { error: faturaError } = await supabaseAdmin
          .from('faturas')
          .insert({
            empresa_id: empresaId,
            valor: valor,
            data_vencimento: new Date().toISOString(),
            status: 'Falhou',
            mp_payment_id: String(resourceId)
          });

        if (faturaError) {
          console.error('[Mercado Pago Webhook] Erro ao registrar fatura Falhou:', faturaError);
        }

        return NextResponse.json({ success: true, message: 'Assinatura inadimplida e registro de falha criado.' });
      }

      return NextResponse.json({ success: true, message: `Pagamento recebido com status pendente/em processamento: ${mpStatus}` });
    }

    // B. Tratamento de Eventos de Assinatura/Preapproval (ex: subscription.authorized)
    if (isSubscriptionEvent) {
      console.log(`[Mercado Pago Webhook] Buscando detalhes da assinatura ${resourceId} na API do MP...`);

      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${mpToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error(`[Mercado Pago Webhook] Erro ao buscar assinatura no MP (HTTP ${mpResponse.status}):`, errorText);
        return NextResponse.json({ error: 'Erro ao validar assinatura com Mercado Pago.' }, { status: 502 });
      }

      const subscriptionData = await mpResponse.json();
      const mpStatus = subscriptionData.status; // authorized, paused, cancelled
      const empresaId = subscriptionData.external_reference;

      if (!empresaId) {
        console.warn(`[Mercado Pago Webhook] Assinatura MP ${resourceId} recebida sem external_reference (empresa_id). Ignorando.`);
        return NextResponse.json({ success: true, message: 'Evento ignorado: external_reference de assinatura ausente.' });
      }

      // Mapear o status da assinatura retornado pelo MP para os termos do CRM
      let finalStatus: 'ativa' | 'inadimplente' | 'cancelada' = 'inadimplente';
      if (mpStatus === 'authorized') {
        finalStatus = 'ativa';
      } else if (mpStatus === 'paused') {
        finalStatus = 'inadimplente';
      } else if (mpStatus === 'cancelled') {
        finalStatus = 'inadimplente';
      }

      console.log(`[Mercado Pago Webhook] Sincronizando assinatura ${resourceId} | Status MP: ${mpStatus} -> CRM: ${finalStatus} | Empresa: ${empresaId}`);

      const { error: updateError } = await supabaseAdmin
        .from('empresas')
        .update({
          status_assinatura: finalStatus,
          assinatura_mp_id: String(resourceId)
        })
        .eq('id', empresaId);

      if (updateError) {
        console.error('[Mercado Pago Webhook] Erro ao atualizar assinatura da empresa:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Status de assinatura e ID sincronizados com sucesso.',
        status: finalStatus
      });
    }

    console.log(`[Mercado Pago Webhook] Tipo de evento ignorado ou não tratado: ${action}`);
    return NextResponse.json({ success: true, message: 'Webhook recebido mas não necessitou de processamento.' });

  } catch (err: any) {
    console.error('[Mercado Pago Webhook] Falha crítica no webhook:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
