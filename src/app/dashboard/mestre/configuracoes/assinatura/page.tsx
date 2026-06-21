'use client';

import React, { useState, useEffect } from 'react';
import { getFaturamentoDados, iniciarCheckoutAssinatura } from '@/actions/faturamento';
import { Fatura, PlanoSaaS } from '@/types/database.types';

export default function AssinaturaPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Dados do faturamento
  const [empresa, setEmpresa] = useState<any>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [planos, setPlanos] = useState<PlanoSaaS[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFaturamentoDados();
      if (res.success) {
        setEmpresa(res.empresa);
        setFaturas(res.faturas || []);
        setPlanos(res.planos || []);
      } else {
        setError(res.error || 'Erro ao carregar dados do faturamento.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro crítico ao carregar dados do faturamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckout = async (planoId: string) => {
    setActionLoading(planoId);
    try {
      const res = await iniciarCheckoutAssinatura(planoId);
      if (res.success && res.url) {
        showToast('Link de checkout gerado! Redirecionando...');
        // Redireciona o usuário para o Mercado Pago com segurança
        window.location.href = res.url;
      } else {
        showToast(res.error || 'Erro ao iniciar checkout de assinatura.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Ocorreu um erro ao conectar com o gateway de pagamento.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#E25B3C]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-400 font-semibold font-sans">Carregando painel de assinatura...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FCFBFA] p-6 md:p-10 font-sans flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900">Falha ao Carregar Faturamento</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
          <button
            onClick={loadData}
            className="w-full py-3 bg-[#E25B3C] hover:bg-orange-655 text-white font-bold rounded-2xl transition-all shadow-md shadow-orange-500/20 cursor-pointer text-sm"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Mapear o status atual da assinatura
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ativa':
        return {
          label: 'Ativa',
          bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          dotColor: 'bg-emerald-500',
        };
      case 'inadimplente':
        return {
          label: 'Aguardando Pagamento',
          bgColor: 'bg-amber-50 border-amber-200 text-amber-700',
          dotColor: 'bg-amber-500',
        };
      case 'cancelada':
      default:
        return {
          label: 'Suspensa',
          bgColor: 'bg-rose-50 border-rose-200 text-rose-700',
          dotColor: 'bg-rose-500',
        };
    }
  };

  const statusConfig = getStatusConfig(empresa?.status_assinatura);

  // Encontrar plano ativo (se houver assinatura_mp_id e planos)
  const planoAtivo = planos.find(p => empresa?.assinatura_mp_id && p.mp_plan_id) || planos[0];

  return (
    <div className="min-h-screen bg-[#FCFBFA] text-gray-900 p-6 md:p-10 font-sans selection:bg-[#E25B3C] selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <span className="w-2.5 h-7 rounded-full bg-gradient-to-b from-orange-500 to-amber-500 inline-block shrink-0" />
              Faturamento & Assinatura SaaS
            </h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie a assinatura do seu workspace e consulte o histórico de cobranças do OKKA CRM.</p>
          </div>
        </div>

        {/* Toast Alert */}
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

        {/* Status Card & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card de Status da Assinatura */}
          <div className="md:col-span-2 bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status da Assinatura</span>
                <span className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${statusConfig.bgColor}`}>
                  <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} inline-block`} />
                  {statusConfig.label}
                </span>
              </div>
              
              <div className="pt-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {empresa?.status_assinatura === 'ativa' 
                    ? `Plano Contratado: ${planoAtivo?.nome || 'Pro Mensal'}` 
                    : 'Sem Assinatura Ativa'}
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-lg">
                  {empresa?.status_assinatura === 'ativa' 
                    ? 'Sua assinatura está ativa e configurada via débito recorrente no Mercado Pago. O acesso aos recursos estratégicos e painéis de liderança está totalmente liberado.' 
                    : 'Sua conta está sem um plano ativo ou pendente de pagamento. Para liberar o acesso total ao sistema de gestão de visitas e relatórios, ative seu plano no botão abaixo.'}
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                {planoAtivo && (
                  <button
                    onClick={() => handleCheckout(planoAtivo.id)}
                    disabled={actionLoading !== null}
                    className="px-5 py-3 bg-[#E25B3C] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl transition-all shadow-md shadow-orange-500/15 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading === planoAtivo.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Conectando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        {empresa?.status_assinatura === 'ativa' ? 'Atualizar Cartão/Assinatura' : 'Assinar Plano Pro Agora'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card Resumo do Workspace */}
          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Minha Organização</span>
              <h4 className="text-lg font-black text-gray-900 truncate">{empresa?.nome_fantasia || 'Nome da Empresa'}</h4>
              
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400 font-medium">Ciclo de Faturamento:</span>
                  <span className="text-gray-800 font-bold">Mensal</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400 font-medium">Valor recorrente:</span>
                  <span className="text-gray-800 font-bold">{planoAtivo ? formatCurrency(planoAtivo.valor) : 'R$ 99,90'}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-gray-400 font-medium">Plataforma SaaS:</span>
                  <span className="text-orange-600 font-black uppercase">Hubly Pro</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-[10px] text-gray-400 leading-normal">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Transações processadas via infraestrutura segura do Mercado Pago.
            </div>
          </div>

        </div>

        {/* Planos Disponíveis (Exibe caso o status não seja Ativo para facilitar a assinatura direta) */}
        {empresa?.status_assinatura !== 'ativa' && planos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Selecione o plano ideal para sua empresa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {planos.map((plano) => (
                <div 
                  key={plano.id} 
                  className={`bg-white border-2 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all ${
                    plano.nome.includes('Pro') 
                      ? 'border-orange-500 scale-102 shadow-orange-500/5' 
                      : 'border-gray-200/80 hover:border-orange-300'
                  }`}
                >
                  {plano.nome.includes('Pro') && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[9px] uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                      Recomendado
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-black text-gray-900">{plano.nome}</h4>
                      <p className="text-[11px] text-gray-400 mt-1">Acesso completo ao CRM corporativo.</p>
                    </div>

                    <div className="flex items-baseline gap-1 py-2">
                      <span className="text-3xl font-black text-gray-900">{formatCurrency(plano.valor)}</span>
                      <span className="text-xs text-gray-400 font-bold">/mês</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Visitas Técnicas Ilimitadas
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Gestão de Equipe e Técnicos
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Integração API WhatsApp
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Auditoria de Acessos IAM
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleCheckout(plano.id)}
                      disabled={actionLoading !== null}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        plano.nome.includes('Pro')
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {actionLoading === plano.id ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Processando...
                        </>
                      ) : (
                        'Contratar Plano'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices Data Table */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Histórico de Faturas</h3>
            <p className="text-xs text-gray-400 mt-1">Consulte os pagamentos registrados para esta empresa.</p>
          </div>

          {faturas.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-2xl p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-gray-400 border border-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-bold">Nenhuma fatura registrada.</p>
              <p className="text-[10px] text-gray-400">Assim que sua primeira assinatura ou renovação for processada, os recibos aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-150">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-55/70 border-b border-gray-150 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Cód. Transação</th>
                    <th className="px-5 py-3.5">Vencimento / Data</th>
                    <th className="px-5 py-3.5">Valor</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {faturas.map((fatura) => (
                    <tr key={fatura.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-gray-500 uppercase">
                        {fatura.mp_payment_id || `FAT-${fatura.id.substring(0, 8)}`}
                      </td>
                      <td className="px-5 py-4 text-gray-600 font-medium">
                        {formatDate(fatura.data_vencimento)}
                      </td>
                      <td className="px-5 py-4 text-gray-900 font-black">
                        {formatCurrency(fatura.valor)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                          fatura.status === 'Paga' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : fatura.status === 'Falhou' 
                            ? 'bg-rose-50 border-rose-200 text-rose-700' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {fatura.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={`/dashboard/mestre/configuracoes/assinatura/recibo/${fatura.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-[#E25B3C] text-gray-600 hover:text-[#E25B3C] rounded-lg transition-colors font-bold text-[11px] shadow-sm bg-white"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Recibo
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
