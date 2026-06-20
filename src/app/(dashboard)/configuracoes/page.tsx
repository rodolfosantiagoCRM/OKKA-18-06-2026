'use client';

import React, { useState, useEffect } from 'react';
import { 
  getWhatsappConfig, 
  saveWhatsappConfig, 
  testWhatsappSend, 
  triggerManualCheck 
} from '@/app/actions/whatsapp';
import { WhatsappConfig } from '@/types/database.types';

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<WhatsappConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  // Estados locais para edição
  const [ativo, setAtivo] = useState(false);
  const [apiProvider, setApiProvider] = useState<'evolution' | 'zapi' | 'custom'>('evolution');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instancia, setInstancia] = useState('');
  const [antecedenciaMinutos, setAntecedenciaMinutos] = useState(60);
  const [mensagemTemplate, setMensagemTemplate] = useState('');
  const [headersCustomizados, setHeadersCustomizados] = useState('');
  const [payloadCustomizado, setPayloadCustomizado] = useState('');

  // Estado para teste
  const [testeTelefone, setTesteTelefone] = useState('');
  const [testeMensagem, setTesteMensagem] = useState('Olá! Esta é uma mensagem de teste enviada através da integração WhatsApp do OKKA CRM.');
  const [isTesting, setIsTesting] = useState(false);
  
  // Estado para trigger manual
  const [isChecking, setIsChecking] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getWhatsappConfig();
        setConfig(data);
        setAtivo(data.ativo);
        setApiProvider(data.api_provider);
        setApiUrl(data.api_url || '');
        setApiKey(data.api_key || '');
        setInstancia(data.instancia || '');
        setAntecedenciaMinutos(data.antecedencia_minutos);
        setMensagemTemplate(data.mensagem_template);
        setHeadersCustomizados(data.headers_customizados || '');
        setPayloadCustomizado(data.payload_customizado || '');
      } catch (err: any) {
        showToast('Erro ao carregar configurações do banco.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Validar JSON se for customizado
    if (apiProvider === 'custom') {
      if (headersCustomizados.trim()) {
        try {
          JSON.parse(headersCustomizados);
        } catch (err) {
          showToast('Os cabeçalhos customizados devem ser um JSON válido.', 'error');
          setIsSaving(false);
          return;
        }
      }
      if (payloadCustomizado.trim()) {
        try {
          JSON.parse(payloadCustomizado);
        } catch (err) {
          showToast('O payload customizado deve ser um JSON válido.', 'error');
          setIsSaving(false);
          return;
        }
      }
    }

    try {
      const res = await saveWhatsappConfig({
        ativo,
        api_provider: apiProvider,
        api_url: apiUrl.trim(),
        api_key: apiKey.trim(),
        instancia: instancia.trim(),
        antecedencia_minutos: Number(antecedenciaMinutos),
        mensagem_template: mensagemTemplate,
        headers_customizados: headersCustomizados.trim() || null,
        payload_customizado: payloadCustomizado.trim() || null,
      });

      if (res.success) {
        showToast('Configurações salvas com sucesso!', 'success');
      } else {
        showToast(res.error || 'Erro ao salvar configurações.', 'error');
      }
    } catch (err: any) {
      showToast('Erro de conexão ao salvar.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!testeTelefone.trim()) {
      showToast('Informe um número de telefone para o teste.', 'error');
      return;
    }
    setIsTesting(true);
    try {
      const res = await testWhatsappSend(testeTelefone.trim(), testeMensagem);
      if (res.success) {
        showToast('Mensagem de teste enviada com sucesso!', 'success');
      } else {
        showToast(res.error || 'Erro no envio da mensagem de teste.', 'error');
      }
    } catch (err: any) {
      showToast('Erro interno no envio de teste.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTriggerCheck = async () => {
    setIsChecking(true);
    try {
      const res = await triggerManualCheck();
      if (res.success) {
        showToast(
          `Varredura concluída! ${res.sentCount} mensagens enviadas, ${res.skippedCount} visitas antigas ignoradas.`,
          'success'
        );
      } else {
        showToast(res.error || 'Erro ao processar notificações.', 'error');
      }
    } catch (err: any) {
      showToast('Erro interno ao executar varredura.', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-400 font-medium font-sans">Carregando painel de integrações...</span>
        </div>
      </div>
    );
  }

  const labelClass = "text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block";
  const inputClass = "w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none transition-all text-sm";
  const selectClass = "w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-gray-800 outline-none transition-all text-sm cursor-pointer appearance-none";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <span className="w-2.5 h-7 rounded-full bg-gradient-to-b from-orange-500 to-amber-500 inline-block shrink-0" />
              Configurações de Integração
            </h1>
            <p className="text-sm text-gray-500 mt-1">Conecte o CRM ao WhatsApp para notificar a equipe de técnicos em campo.</p>
          </div>
          
          <button
            onClick={handleTriggerCheck}
            disabled={isChecking || !ativo}
            className="px-5 py-2.5 bg-orange-50 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed border border-orange-200 text-orange-600 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {isChecking ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verificando...
              </>
            ) : (
              <>
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                </svg>
                Verificar e Notificar Agora
              </>
            )}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 text-white text-sm font-bold ${
            toast.type === 'error' ? 'bg-rose-600 border border-rose-500' : 'bg-gray-900 border border-gray-800'
          }`}>
            {toast.type === 'error' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.msg}
          </div>
        )}

        {/* Form Principal */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Card Ativação */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="space-y-1 pr-4">
              <h2 className="text-base font-bold text-gray-900">Notificações Automáticas</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Habilite o envio automático de mensagens de WhatsApp para os técnicos sobre visitas agendadas que se aproximam da antecedência definida.
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={ativo} 
                onChange={(e) => setAtivo(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-12 h-6.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {/* Card Configurações da API */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-gray-950 pb-3 border-b border-gray-100 flex items-center gap-2">
              <svg className="w-4.5 h-4.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Credenciais da API de WhatsApp
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Provedor */}
              <div className="space-y-1">
                <label className={labelClass}>Provedor da API</label>
                <div className="relative">
                  <select
                    value={apiProvider}
                    onChange={(e) => setApiProvider(e.target.value as any)}
                    className={selectClass}
                  >
                    <option value="evolution">Evolution API</option>
                    <option value="zapi">Z-API</option>
                    <option value="custom">POST HTTP Genérico (Qualquer Gateway)</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Antecedência */}
              <div className="space-y-1">
                <label className={labelClass}>Antecedência do Envio</label>
                <div className="relative">
                  <select
                    value={antecedenciaMinutos}
                    onChange={(e) => setAntecedenciaMinutos(Number(e.target.value))}
                    className={selectClass}
                  >
                    <option value="30">30 Minutos antes da visita</option>
                    <option value="60">1 Hora antes da visita</option>
                    <option value="120">2 Horas antes da visita</option>
                    <option value="180">3 Horas antes da visita</option>
                    <option value="360">6 Horas antes da visita</option>
                    <option value="720">12 Horas antes da visita</option>
                    <option value="1440">24 Horas antes da visita</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* URL da API */}
            <div className="space-y-1">
              <label className={labelClass}>
                {apiProvider === 'custom' ? 'URL do Endpoint HTTP POST' : 'URL Base da API'}
              </label>
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={
                  apiProvider === 'evolution'
                    ? 'https://sua-evolution-api.herokuapp.com'
                    : apiProvider === 'zapi'
                    ? 'https://api.z-api.io'
                    : 'https://seu-gateway.com.br/v1/messages'
                }
                className={inputClass}
                required={ativo}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {apiProvider === 'evolution' && 'Insira a URL base de sua Evolution API. O path (/message/sendText/{instancia}) será concatenado automaticamente se omitido.'}
                {apiProvider === 'zapi' && 'Insira a URL base do Z-API. O path (/instances/{instancia}/token/{token}/send-text) será concatenado se omitido.'}
                {apiProvider === 'custom' && 'URL completa do webhook ou endpoint externo que receberá a requisição POST.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Token / Chave */}
              <div className="space-y-1">
                <label className={labelClass}>
                  {apiProvider === 'evolution' ? 'ApiKey (Global/Instância)' : apiProvider === 'zapi' ? 'Token de Segurança' : 'Chave/Token (Opcional)'}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className={inputClass}
                />
              </div>

              {/* Instância */}
              {apiProvider !== 'custom' && (
                <div className="space-y-1">
                  <label className={labelClass}>Nome / ID da Instância</label>
                  <input
                    type="text"
                    value={instancia}
                    onChange={(e) => setInstancia(e.target.value)}
                    placeholder="Ex: MinhaInstancia"
                    className={inputClass}
                    required={ativo}
                  />
                </div>
              )}
            </div>

            {/* Configurações Customizadas */}
            {apiProvider === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className={labelClass}>Cabeçalhos Personalizados (Headers JSON)</label>
                  <textarea
                    rows={4}
                    value={headersCustomizados}
                    onChange={(e) => setHeadersCustomizados(e.target.value)}
                    placeholder='{&#10;  "Authorization": "Bearer SEU_TOKEN",&#10;  "x-custom-key": "valor"&#10;}'
                    className={`${inputClass} font-mono text-xs`}
                  />
                  <p className="text-[10px] text-gray-400">Insira um objeto JSON chave-valor para incluir no cabeçalho HTTP.</p>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Payload JSON Personalizado (Template)</label>
                  <textarea
                    rows={4}
                    value={payloadCustomizado}
                    onChange={(e) => setPayloadCustomizado(e.target.value)}
                    placeholder='{&#10;  "to": "{phone}",&#10;  "text": "{message}",&#10;  "type": "text"&#10;}'
                    className={`${inputClass} font-mono text-xs`}
                  />
                  <p className="text-[10px] text-gray-400">Use os marcadores <strong>{`{phone}`}</strong> e <strong>{`{message}`}</strong> para injeção dinâmica de dados.</p>
                </div>
              </div>
            )}
          </div>

          {/* Card Template da Mensagem */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-950 pb-3 border-b border-gray-100 flex items-center gap-2">
              <svg className="w-4.5 h-4.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Template da Notificação
            </h2>

            <div className="space-y-1">
              <label className={labelClass}>Texto da Mensagem</label>
              <textarea
                rows={5}
                value={mensagemTemplate}
                onChange={(e) => setMensagemTemplate(e.target.value)}
                className={`${inputClass} resize-none leading-relaxed`}
                required
              />
            </div>

            {/* Dica de Placeholders */}
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider">Variáveis Dinâmicas Disponíveis</h4>
              <p className="text-[11px] text-orange-700 leading-relaxed">
                Você pode utilizar os seguintes marcadores no corpo da mensagem. Eles serão substituídos automaticamente por dados reais da visita:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 pt-1 text-[10px] font-mono text-orange-900">
                <div>{`{nome_tecnico}`}</div>
                <div>{`{cliente_nome}`}</div>
                <div>{`{data_visita}`}</div>
                <div>{`{horario_visita}`}</div>
                <div>{`{endereco_obra}`}</div>
                <div>{`{observacoes}`}</div>
                <div className="col-span-2 sm:col-span-1">{`{antecedencia}`}</div>
              </div>
            </div>
          </div>

          {/* Botões do Form */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar Integração
                </>
              )}
            </button>
          </div>
        </form>

        {/* Card Envio de Teste */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-gray-950 pb-3 border-b border-gray-100 flex items-center gap-2">
            <svg className="w-4.5 h-4.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Ferramenta de Envio de Teste
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-1">
              <label className={labelClass}>Número do Celular</label>
              <input
                type="text"
                value={testeTelefone}
                onChange={(e) => setTesteTelefone(e.target.value)}
                placeholder="Ex: 41999991111"
                className={inputClass}
              />
              <p className="text-[9px] text-gray-400 mt-1">Informe apenas números, com o DDD.</p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className={labelClass}>Mensagem do Teste</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testeMensagem}
                  onChange={(e) => setTesteMensagem(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleTestSend}
                  disabled={isTesting}
                  className="px-5 bg-gray-900 hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shrink-0 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isTesting ? (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    'Disparar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card Ajuda Cron */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-950 pb-3 border-b border-gray-100 flex items-center gap-2">
            <svg className="w-4.5 h-4.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Agendamento do Cron (Automação de Fundo)
          </h2>

          <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
            <p>
              Para automatizar o envio de notificações de visitas, você deve configurar uma tarefa de <strong>Cron Job</strong> externa (usando serviços como Vercel Cron, GitHub Actions, EasyCron, Cron-Job.org ou Supabase `pg_cron`) para chamar o endpoint do CRM a cada 5 ou 10 minutos.
            </p>
            <p>
              O endpoint de notificação é:
            </p>
            <div className="bg-gray-900 text-gray-100 font-mono p-3.5 rounded-xl text-[11px] overflow-x-auto break-all shadow-inner border border-gray-800 flex items-center justify-between">
              <span>{`{CRM_URL}/api/cron/whatsapp-notifier?token=${config?.api_key || 'SEU_TOKEN_OU_SERVICE_ROLE_KEY'}`}</span>
            </div>
            <p className="text-[10px] text-gray-400">
              * Nota: Em ambiente de desenvolvimento, a autenticação da URL é desabilitada para facilidade de testes. Em produção, use o cabeçalho <code>Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY</code> ou passe a service_role key como o query param <code>token</code>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
