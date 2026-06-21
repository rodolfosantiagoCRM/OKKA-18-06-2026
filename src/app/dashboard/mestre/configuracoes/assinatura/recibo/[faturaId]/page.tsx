'use client';

import React, { useState, useEffect, use } from 'react';
import { getFaturaDetails } from '@/actions/faturamento';
import { Fatura } from '@/types/database.types';

interface PageProps {
  params: Promise<{ faturaId: string }>;
}

export default function ReciboPage({ params }: PageProps) {
  const { faturaId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    async function loadRecibo() {
      try {
        const res = await getFaturaDetails(faturaId);
        if (res.success && res.fatura) {
          setFatura(res.fatura);
          setEmpresa(res.empresa);
        } else {
          setError(res.error || 'Erro ao carregar recibo.');
        }
      } catch (err: any) {
        console.error(err);
        setError('Falha de comunicação ao buscar recibo.');
      } finally {
        setLoading(false);
      }
    }
    loadRecibo();
  }, [faturaId]);

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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '';
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return cnpj;
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs text-gray-400 font-bold">Gerando recibo para impressão...</span>
        </div>
      </div>
    );
  }

  if (error || !fatura) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-gray-200 p-8 rounded-2xl max-w-sm text-center space-y-4 shadow-md">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-base font-bold text-gray-900">Não foi possível carregar este documento</h2>
          <p className="text-xs text-gray-500">{error || 'Fatura inválida.'}</p>
          <button 
            onClick={() => window.close()} 
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 flex justify-center font-sans text-gray-805 selection:bg-gray-200">
      <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-md rounded-2xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between">
        
        {/* Border Top Decorative */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-800 print:hidden" />

        <div className="space-y-8">
          {/* Header Recibo */}
          <div className="flex justify-between items-start border-b border-dashed border-gray-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gray-950 flex items-center justify-center">
                  <span className="text-white font-black text-xs">O</span>
                </div>
                <span className="text-sm font-black tracking-tight text-gray-900">OKKA CRM</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Plataforma SaaS Integrada - Hubly Pro</p>
            </div>
            
            <div className="text-right">
              <span className="text-xs font-black text-gray-900 block">RECIBO DE PAGAMENTO</span>
              <span className="text-[10px] font-mono text-gray-400 block mt-1">ID: #{fatura.id.substring(0, 18).toUpperCase()}</span>
            </div>
          </div>

          {/* Dados da Empresa / Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-dashed border-gray-200 pb-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Prestador do Serviço</span>
              <span className="font-bold text-gray-900 block">OKKA Soluções Tecnológicas Ltda</span>
              <span className="text-gray-500 block">CNPJ: 45.982.112/0001-08</span>
              <span className="text-gray-500 block">Curitiba - PR, Brasil</span>
            </div>

            <div className="space-y-1.5 md:text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tomador do Serviço</span>
              <span className="font-bold text-gray-900 block">{empresa?.nome_fantasia || 'Cliente CRM'}</span>
              <span className="text-gray-500 block">CNPJ: {formatCNPJ(empresa?.cnpj)}</span>
              <span className="text-gray-500 block">Conta Mestra ativa</span>
            </div>
          </div>

          {/* Descrição e Detalhes da Cobrança */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Detalhamento dos Serviços</span>
            
            <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 font-bold text-gray-600 grid grid-cols-4">
                <span className="col-span-2">Item</span>
                <span className="text-center">Período</span>
                <span className="text-right">Valor</span>
              </div>
              <div className="px-4 py-3 grid grid-cols-4 items-center">
                <div className="col-span-2 font-medium text-gray-900">
                  Assinatura Mensal Recorrente - Plano Pro
                  <span className="text-[10px] text-gray-400 block mt-0.5">Acesso multiusuário e integração de Whatsapp</span>
                </div>
                <span className="text-center text-gray-500">30 dias</span>
                <span className="text-right font-black text-gray-900">{formatCurrency(fatura.valor)}</span>
              </div>
            </div>
          </div>

          {/* Totais e Status do Pagamento */}
          <div className="bg-gray-50 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100">
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Status da Transação</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                  fatura.status === 'Paga' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : fatura.status === 'Falhou' 
                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {fatura.status === 'Paga' ? 'PAGAMENTO APROVADO' : fatura.status === 'Falhou' ? 'PAGAMENTO RECUSADO' : 'AGUARDANDO PAGAMENTO'}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Pago</span>
              <span className="text-2xl font-black text-gray-900 block mt-0.5">{formatCurrency(fatura.valor)}</span>
            </div>
          </div>

          {/* Rodapé / Informações de Auditoria */}
          <div className="text-[10px] text-gray-400 space-y-1.5 border-t border-dashed border-gray-200 pt-6 font-medium leading-relaxed">
            <p>
              <strong>Data do registro:</strong> {formatDate(fatura.criado_em)}
            </p>
            {fatura.mp_payment_id && (
              <p>
                <strong>Gateway ID (Mercado Pago):</strong> {fatura.mp_payment_id}
              </p>
            )}
            <p className="text-[9px] text-gray-400 mt-2">
              Este recibo de serviço tem caráter meramente informativo de quitação de fatura SaaS e comprovação de pagamento de assinatura mensal.
            </p>
          </div>
        </div>

        {/* Ações da Página */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3 print:hidden">
          <button
            onClick={() => window.close()}
            className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
          >
            Fechar
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-4.5 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Recibo
          </button>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .min-h-screen {
            min-height: auto !important;
            background-color: white !important;
            padding: 0 !important;
          }
          .shadow-md {
            box-shadow: none !important;
          }
          .border {
            border-color: #e5e7eb !important;
          }
          .bg-white {
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
