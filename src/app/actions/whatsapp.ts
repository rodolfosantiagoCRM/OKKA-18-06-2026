'use server';

import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { WhatsappConfig, Visita } from '@/types/database.types';

// Helper de segurança para validar se o requisitante é admin ou mestre ativo
async function checkAdminPermission(supabaseAdmin: ReturnType<typeof createServerClient>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token) {
    throw new Error('Não autorizado: Sessão ausente.');
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Não autorizado: Sessão inválida.');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('perfis_usuarios')
    .select('role, status_acesso')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Erro ao validar permissões do usuário.');
  }

  if (profile.role !== 'admin' && profile.role !== 'mestre') {
    throw new Error('Acesso negado: Permissão restrita a administradores.');
  }

  if (profile.status_acesso === false) {
    throw new Error('Acesso negado: Seu usuário está bloqueado.');
  }

  return user;
}

// Limpa o número de telefone para formato brasileiro (DDI + DDD + Número apenas)
function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    return '55' + digits;
  }
  return digits;
}

interface SendParams {
  api_provider: 'evolution' | 'zapi' | 'custom';
  api_url: string;
  api_key: string | null;
  instancia: string | null;
  headers_customizados: string | null;
  payload_customizado: string | null;
  phone: string;
  message: string;
}

// Helper interno para disparar a requisição HTTP
async function sendWhatsAppHttp(params: SendParams): Promise<{ success: boolean; error?: string }> {
  const { api_provider, api_url, api_key, instancia, headers_customizados, payload_customizado, phone, message } = params;
  
  let targetUrl = api_url.trim();
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  let body = '';
  
  if (api_provider === 'evolution') {
    if (instancia && !targetUrl.includes('/message/sendText')) {
      const baseUrl = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl;
      targetUrl = `${baseUrl}/message/sendText/${instancia}`;
    }
    
    if (api_key) {
      headers['apikey'] = api_key;
    }
    
    body = JSON.stringify({
      number: phone,
      text: message,
    });
  } else if (api_provider === 'zapi') {
    if (instancia && api_key && !targetUrl.includes('/send-text')) {
      const baseUrl = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl;
      targetUrl = `${baseUrl}/instances/${instancia}/token/${api_key}/send-text`;
    } else if (api_key) {
      headers['Client-Token'] = api_key;
    }
    
    body = JSON.stringify({
      phone: phone,
      message: message,
    });
  } else {
    // Custom / Genérico
    if (headers_customizados) {
      try {
        const parsedHeaders = JSON.parse(headers_customizados);
        headers = { ...headers, ...parsedHeaders };
      } catch (e: any) {
        console.warn('Erro ao parsear cabeçalhos customizados:', e);
      }
    }
    
    const templateStr = payload_customizado || '{"phone": "{phone}", "message": "{message}"}';
    try {
      const parsedPayload = JSON.parse(templateStr);
      
      const replacePlaceholders = (obj: any): any => {
        if (typeof obj === 'string') {
          return obj.replace(/{phone}/g, phone).replace(/{message}/g, message);
        } else if (Array.isArray(obj)) {
          return obj.map(replacePlaceholders);
        } else if (obj !== null && typeof obj === 'object') {
          const res: any = {};
          for (const k in obj) {
            res[k] = replacePlaceholders(obj[k]);
          }
          return res;
        }
        return obj;
      };
      
      const payloadObj = replacePlaceholders(parsedPayload);
      body = JSON.stringify(payloadObj);
    } catch (e: any) {
      body = templateStr
        .replace(/{phone}/g, phone)
        .replace(/{message}/g, JSON.stringify(message).slice(1, -1));
    }
  }
  
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body,
    });
    
    const textResponse = await res.text();
    
    if (!res.ok) {
      return { 
        success: false, 
        error: `HTTP ${res.status}: ${textResponse || res.statusText}` 
      };
    }
    
    return { success: true };
  } catch (err: any) {
    return { 
      success: false, 
      error: err?.message || 'Erro de rede na chamada HTTP.' 
    };
  }
}

/**
 * Obtém a configuração atual do WhatsApp (ou retorna padrão mockado se a tabela não existir)
 */
export async function getWhatsappConfig(): Promise<WhatsappConfig> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      throw error;
    }

    return data as WhatsappConfig;
  } catch (err: any) {
    // Fallback amigável caso a tabela ou as colunas ainda não estejam prontas no banco
    console.warn('Erro ao obter whatsapp_config (tabela pode não ter sido criada no Supabase ainda):', err.message);
    return {
      id: 1,
      ativo: false,
      api_provider: 'evolution',
      api_url: '',
      api_key: '',
      instancia: '',
      antecedencia_minutos: 60,
      mensagem_template: 'Olá {nome_tecnico}, sua próxima visita técnica para o cliente {cliente_nome} no endereço {endereco_obra} será daqui a {antecedencia} (agendada para às {horario_visita}).',
      headers_customizados: null,
      payload_customizado: null,
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Salva a configuração do WhatsApp (somente admin/mestre)
 */
export async function saveWhatsappConfig(
  updates: Partial<Omit<WhatsappConfig, 'id' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    await checkAdminPermission(supabase);

    const { error } = await supabase
      .from('whatsapp_config')
      .upsert({
        id: 1,
        ...updates,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro ao salvar whatsapp_config:', err);
    return { success: false, error: err.message || 'Erro inesperado ao salvar configurações.' };
  }
}

/**
 * Envia uma mensagem de WhatsApp de teste rápida (somente admin/mestre)
 */
export async function testWhatsappSend(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    await checkAdminPermission(supabase);

    const config = await getWhatsappConfig();

    if (!config.api_url) {
      return { success: false, error: 'A URL da API de WhatsApp não está configurada.' };
    }

    const cleanPhone = cleanPhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, error: 'Número de telefone inválido. Informe o DDD e o número.' };
    }

    const result = await sendWhatsAppHttp({
      api_provider: config.api_provider,
      api_url: config.api_url,
      api_key: config.api_key,
      instancia: config.instancia,
      headers_customizados: config.headers_customizados,
      payload_customizado: config.payload_customizado,
      phone: cleanPhone,
      message,
    });

    return result;
  } catch (err: any) {
    console.error('Erro no envio de teste:', err);
    return { success: false, error: err.message || 'Erro inesperado ao disparar teste.' };
  }
}

/**
 * Executa o loop de verificação e envio de notificações para visitas próximas
 */
export async function runCronNotificationCheck(): Promise<{ success: boolean; sentCount?: number; skippedCount?: number; message?: string; error?: string }> {
  try {
    const supabase = createServerClient();
    const config = await getWhatsappConfig();
    if (!config.ativo) {
      return { success: false, error: 'A integração com WhatsApp está desabilitada nas configurações.' };
    }

    if (!config.api_url) {
      return { success: false, error: 'A URL da API de WhatsApp não está configurada.' };
    }

    // Buscar visitas "Agendada" que não foram enviadas e têm técnico
    const { data: visitas, error: visitasError } = await supabase
      .from('visits')
      .select('*, projects(*, leads(*)), responsaveis_tecnicos(*)')
      .eq('status_visita', 'Agendada')
      .eq('whatsapp_enviado', false);

    if (visitasError) {
      throw visitasError;
    }

    if (!visitas || visitas.length === 0) {
      return { success: true, sentCount: 0, skippedCount: 0, message: 'Nenhuma visita pendente de notificação.' };
    }

    let sentCount = 0;
    let skippedCount = 0;
    const now = new Date();

    for (const visita of visitas) {
      const tecnico = visita.responsaveis_tecnicos;
      if (!tecnico || !tecnico.telefone) {
        continue;
      }

      // Converter data_visita e horario para timestamp local
      const timeStr = (visita.horario || '09:00:00').substring(0, 8);
      // Assume -03:00 (fuso oficial de Brasília)
      const visitDate = new Date(`${visita.data_visita}T${timeStr}-03:00`);

      const diffMs = visitDate.getTime() - now.getTime();
      const antecedenciaMs = config.antecedencia_minutos * 60 * 1000;

      if (diffMs < 0) {
        // Ignora visitas no passado
        await supabase
          .from('visits')
          .update({ 
            whatsapp_enviado: true, 
            whatsapp_log: 'Ignorado: visita no passado na verificação' 
          })
          .eq('id', visita.id);
        skippedCount++;
        continue;
      }

      if (diffMs <= antecedenciaMs) {
        const clientName = visita.projects?.leads?.nome || 'Cliente não informado';
        const address = visita.projects?.endereco || 'Endereço não informado';

        const formatAntecedenciaStr = (min: number) => {
          if (min < 60) return `${min} minutos`;
          const hrs = min / 60;
          return hrs === 1 ? '1 hora' : `${hrs} horas`;
        };

        const [year, month, day] = visita.data_visita.split('-');
        const dateFormatted = `${day}/${month}/${year}`;
        const timeFormatted = timeStr.substring(0, 5);

        const formattedMessage = config.mensagem_template
          .replace(/{nome_tecnico}/g, tecnico.nome)
          .replace(/{cliente_nome}/g, clientName)
          .replace(/{data_visita}/g, dateFormatted)
          .replace(/{horario_visita}/g, timeFormatted)
          .replace(/{endereco_obra}/g, address)
          .replace(/{observacoes}/g, visita.observacoes || 'Sem observações')
          .replace(/{antecedencia}/g, formatAntecedenciaStr(config.antecedencia_minutos));

        const cleanPhone = cleanPhoneNumber(tecnico.telefone);
        
        try {
          const sendResult = await sendWhatsAppHttp({
            api_provider: config.api_provider,
            api_url: config.api_url,
            api_key: config.api_key,
            instancia: config.instancia,
            headers_customizados: config.headers_customizados,
            payload_customizado: config.payload_customizado,
            phone: cleanPhone,
            message: formattedMessage,
          });

          if (sendResult.success) {
            await supabase
              .from('visits')
              .update({
                whatsapp_enviado: true,
                whatsapp_log: `Enviado com sucesso via ${config.api_provider} em ${new Date().toLocaleString('pt-BR')}`
              })
              .eq('id', visita.id);
            sentCount++;
          } else {
            await supabase
              .from('visits')
              .update({
                whatsapp_log: `Falha: ${sendResult.error}`
              })
              .eq('id', visita.id);
          }
        } catch (sendErr: any) {
          console.error('Erro de envio HTTP na verificação:', sendErr);
          await supabase
            .from('visits')
            .update({
              whatsapp_log: `Erro HTTP: ${sendErr?.message || sendErr}`
            })
            .eq('id', visita.id);
        }
      }
    }

    return { success: true, sentCount, skippedCount, message: `Envio concluído: ${sentCount} enviadas, ${skippedCount} no passado.` };
  } catch (err: any) {
    console.error('Erro no runCronNotificationCheck:', err);
    return { success: false, error: err.message || 'Erro inesperado no envio automático.' };
  }
}

/**
 * Executa manualmente o loop de verificação e envio de notificações para visitas próximas
 */
export async function triggerManualCheck(): Promise<{ success: boolean; sentCount?: number; skippedCount?: number; error?: string }> {
  try {
    const supabase = createServerClient();
    await checkAdminPermission(supabase);

    const res = await runCronNotificationCheck();
    if (!res.success) {
      return { success: false, error: res.error };
    }
    return { success: true, sentCount: res.sentCount, skippedCount: res.skippedCount };
  } catch (err: any) {
    console.error('Erro no triggerManualCheck:', err);
    return { success: false, error: err.message || 'Erro inesperado no envio manual.' };
  }
}

