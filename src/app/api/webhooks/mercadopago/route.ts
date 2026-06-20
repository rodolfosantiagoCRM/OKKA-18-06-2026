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

    // Suporte para payloads de teste direto / mockados
    const testStatus = body.status;
    const testAssinaturaId = body.assinatura_mp_id;

    if (testStatus && testAssinaturaId) {
      console.log(`[Mercado Pago Webhook] Executando override de teste: ${testAssinaturaId} -> ${testStatus}`);
      const supabaseAdmin = getSupabaseAdmin();
      
      const { data, error } = await supabaseAdmin
        .from('empresas')
        .update({ status_assinatura: testStatus })
        .eq('assinatura_mp_id', testAssinaturaId)
        .select();

      if (error) {
        console.error('[Mercado Pago Webhook] Erro ao atualizar status (override):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Status atualizado (override)', data });
    }

    // Processamento de Notificação Padrão do Mercado Pago
    // Mercado Pago envia o ID do preapproval (assinatura) na propriedade data.id
    const action = body.action || body.type;
    const subscriptionId = body.data?.id || body.id;

    if (!subscriptionId) {
      console.warn('[Mercado Pago Webhook] ID de assinatura ausente no payload.');
      return NextResponse.json({ error: 'ID de assinatura não fornecido.' }, { status: 400 });
    }

    // Apenas processa se for relacionado a assinatura (preapproval)
    const isSubscriptionEvent = 
      action === 'subscription.updated' || 
      action === 'subscription.created' ||
      body.type === 'subscription' ||
      body.type === 'preapproval';

    if (!isSubscriptionEvent) {
      console.log(`[Mercado Pago Webhook] Evento ignorado (não é de assinatura): ${action}`);
      return NextResponse.json({ success: true, message: 'Evento ignorado' });
    }

    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    let finalStatus: 'ativa' | 'inadimplente' | 'cancelada' = 'inadimplente';

    if (mpToken) {
      console.log(`[Mercado Pago Webhook] Consultando assinatura ${subscriptionId} na API do Mercado Pago...`);
      // Consultar os detalhes reais da assinatura na API do Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${mpToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!mpResponse.ok) {
        const errText = await mpResponse.text();
        console.error(`[Mercado Pago Webhook] Erro ao consultar Mercado Pago (HTTP ${mpResponse.status}):`, errText);
        return NextResponse.json({ error: 'Erro ao consultar detalhes da assinatura no Mercado Pago.' }, { status: 502 });
      }

      const mpData = await mpResponse.json();
      const mpStatus = mpData.status; // 'authorized', 'paused', 'cancelled'

      console.log(`[Mercado Pago Webhook] Status retornado pelo Mercado Pago: ${mpStatus}`);

      // Mapear status
      if (mpStatus === 'authorized') {
        finalStatus = 'ativa';
      } else if (mpStatus === 'paused') {
        finalStatus = 'inadimplente';
      } else if (mpStatus === 'cancelled') {
        finalStatus = 'cancelada';
      }
    } else {
      console.warn('[Mercado Pago Webhook] MERCADO_PAGO_ACCESS_TOKEN ausente. Usando mapeamento com base no payload (se fornecido).');
      // Fallback: se o payload original já contiver algum status conhecido
      const rawStatus = body.data?.status || body.status;
      if (rawStatus === 'authorized' || rawStatus === 'active') {
        finalStatus = 'ativa';
      } else if (rawStatus === 'paused') {
        finalStatus = 'inadimplente';
      } else if (rawStatus === 'cancelled') {
        finalStatus = 'cancelada';
      } else {
        // Default caso não saiba o status
        finalStatus = 'ativa'; // Evita bloquear o cliente em testes locais se o token não existir
      }
    }

    console.log(`[Mercado Pago Webhook] Atualizando assinatura no banco: ID ${subscriptionId} -> Status: ${finalStatus}`);
    
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('empresas')
      .update({ status_assinatura: finalStatus })
      .eq('assinatura_mp_id', subscriptionId)
      .select();

    if (error) {
      console.error('[Mercado Pago Webhook] Erro ao atualizar tabela empresas:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.warn(`[Mercado Pago Webhook] Nenhuma empresa encontrada com assinatura_mp_id: ${subscriptionId}`);
      return NextResponse.json({ success: true, message: 'Assinatura atualizada, mas nenhuma empresa estava vinculada a este ID.' });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Status de assinatura sincronizado com sucesso.',
      empresaId: data[0].id,
      status: finalStatus
    });
  } catch (err: any) {
    console.error('[Mercado Pago Webhook] Falha crítica no processamento:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
