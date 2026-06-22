'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Metas {
  faturamento: number;
  conversao: number;
  leads: number;
}

export default function MestreDashboardPage() {
  // Estados para Modals e Interatividade
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [totalColaboradores, setTotalColaboradores] = useState(12);

  // Metas do sistema (persistem no localStorage)
  const [metas, setMetas] = useState<Metas>({
    faturamento: 200000,
    conversao: 75,
    leads: 150
  });

  // Valores temporários dos inputs do modal
  const [tempFaturamento, setTempFaturamento] = useState('200000');
  const [tempConversao, setTempConversao] = useState('75');
  const [tempLeads, setTempLeads] = useState('150');

  // Sistema de Toast Alerts
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Carregar metas salvas e obter usuários reais
  useEffect(() => {
    // Carregar Metas do LocalStorage
    const savedMetas = localStorage.getItem('hubly_metas_mestre');
    if (savedMetas) {
      try {
        const parsed = JSON.parse(savedMetas);
        setMetas(parsed);
        setTempFaturamento(parsed.faturamento.toString());
        setTempConversao(parsed.conversao.toString());
        setTempLeads(parsed.leads.toString());
      } catch (e) {
        console.error('Erro ao ler metas do localStorage:', e);
      }
    }

    // Obter contagem de usuários ativos reais no Supabase
    async function fetchUserCount() {
      try {
        const { data, error } = await supabase
          .from('perfis_usuarios')
          .select('id', { count: 'exact' });
        
        if (!error && data) {
          setTotalColaboradores(data.length);
        }
      } catch (err) {
        console.warn('Erro ao carregar contagem de colaboradores, usando fallback.', err);
      }
    }
    fetchUserCount();
  }, []);

  // Salvar novas Metas
  const handleSaveMetas = (e: React.FormEvent) => {
    e.preventDefault();
    const newMetas: Metas = {
      faturamento: Number(tempFaturamento) || 0,
      conversao: Number(tempConversao) || 0,
      leads: Number(tempLeads) || 0
    };

    setMetas(newMetas);
    localStorage.setItem('hubly_metas_mestre', JSON.stringify(newMetas));
    setShowGoalsModal(false);
    showToastMsg('Metas estratégicas atualizadas com sucesso!');
  };

  // Formatação de Moeda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="space-y-6 relative selection:bg-[#0a4ee4] selection:text-white">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-900 border border-gray-800 text-white shadow-2xl transition-all duration-300">
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Nível: Mestre (Administração Geral)
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">
            Painel da Gerência
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visão completa do faturamento, controle de acessos corporativos e eficiência técnica.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Faturamento */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Faturamento Consolidado</div>
          <div className="text-3xl font-black text-gray-900 mt-2">R$ 158.400,00</div>
          <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-gray-100">
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              79.2% da Meta
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Meta: {formatCurrency(metas.faturamento)}</span>
          </div>
        </div>

        {/* Conversão */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Taxa de Conversão</div>
          <div className="text-3xl font-black text-gray-900 mt-2">68.5%</div>
          <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-gray-100">
            <span className="text-xs text-orange-600 font-bold flex items-center gap-1">
              91.3% da Meta
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Meta: {metas.conversao}%</span>
          </div>
        </div>

        {/* Usuários Ativos */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Usuários Ativos</div>
          <div className="text-3xl font-black text-gray-900 mt-2">{totalColaboradores} colaboradores</div>
          <div className="text-xs text-gray-500 font-semibold mt-3.5 pt-3.5 border-t border-gray-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Todos os acessos IAM ativos
          </div>
        </div>
      </div>

      {/* Ações Estratégicas */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ações Estratégicas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <Link href="/responsaveis-tecnicos" className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#0a4ee4] rounded-xl transition-all font-semibold text-sm text-left shadow-sm flex items-center gap-2 text-gray-800 hover:text-[#0a4ee4]">
            👥 Gerenciar Equipes
          </Link>

          <button 
            onClick={() => setShowFinanceModal(true)}
            className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#0a4ee4] rounded-xl transition-all font-semibold text-sm text-left shadow-sm flex items-center gap-2 text-gray-800 hover:text-[#0a4ee4] cursor-pointer"
          >
            📊 Relatório Financeiro
          </button>

          <button 
            onClick={() => setShowGoalsModal(true)}
            className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#0a4ee4] rounded-xl transition-all font-semibold text-sm text-left shadow-sm flex items-center gap-2 text-gray-800 hover:text-[#0a4ee4] cursor-pointer"
          >
            ⚙️ Configurar Metas
          </button>

          <Link href="/responsaveis-tecnicos" className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#0a4ee4] rounded-xl transition-all font-semibold text-sm text-left shadow-sm flex items-center gap-2 text-gray-800 hover:text-[#0a4ee4]">
            🔒 Auditoria de Acessos
          </Link>

        </div>
      </div>

      {/* Modal Relatório Financeiro (Simulado) */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowFinanceModal(false)} className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs" />
          <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-gray-900">Relatório Financeiro Estratégico</h3>
                <p className="text-xs text-gray-500 mt-1">Visão consolidada de receitas e custos operacionais.</p>
              </div>
              <button onClick={() => setShowFinanceModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Gráfico Mockup em CSS */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Histórico de Faturamento (Últimos 4 meses)</h4>
                <div className="h-44 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-end justify-around gap-2">
                  <div className="flex flex-col items-center gap-1.5 w-1/4">
                    <span className="text-[10px] text-gray-400 font-bold">R$ 112k</span>
                    <div className="w-full bg-gray-200 rounded-t-lg h-24 transition-all duration-500" />
                    <span className="text-xs font-bold text-gray-600">Março</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-1/4">
                    <span className="text-[10px] text-gray-400 font-bold">R$ 134k</span>
                    <div className="w-full bg-gray-200 rounded-t-lg h-28 transition-all duration-500" />
                    <span className="text-xs font-bold text-gray-600">Abril</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-1/4">
                    <span className="text-[10px] text-gray-400 font-bold">R$ 145k</span>
                    <div className="w-full bg-gray-200 rounded-t-lg h-30 transition-all duration-500" />
                    <span className="text-xs font-bold text-gray-600">Maio</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-1/4">
                    <span className="text-[10px] text-[#0a4ee4] font-black">R$ 158.4k</span>
                    <div className="w-full bg-gradient-to-t from-orange-500 to-amber-500 rounded-t-lg h-36 transition-all duration-500 shadow-md shadow-orange-500/10" />
                    <span className="text-xs font-black text-gray-900">Junho</span>
                  </div>
                </div>
              </div>

              {/* Detalhes de custos e receitas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Receita Líquida Estimada</span>
                  <span className="text-xl font-black text-emerald-800 block mt-1">R$ 118.800,00</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1">75% da receita bruta</span>
                </div>
                <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                  <span className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block">Custo Operacional Total</span>
                  <span className="text-xl font-black text-orange-850 block mt-1">R$ 39.600,00</span>
                  <span className="text-[10px] text-orange-650 font-semibold block mt-1">25% (Visitas, Materiais e Deslocamento)</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="text-[10px] text-gray-400 font-semibold">⚠️ Dados simulados baseados em visitas técnicas reais</span>
              <button 
                onClick={() => {
                  setShowFinanceModal(false);
                  showToastMsg('Relatório financeiro exportado para PDF com sucesso!');
                }}
                className="px-4.5 py-2.5 bg-[#0a4ee4] hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurar Metas */}
      {showGoalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowGoalsModal(false)} className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs" />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-150 transform transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-gray-900">Configurar Metas</h3>
                <p className="text-xs text-gray-500 mt-1">Ajuste os alvos mensais da operação do CRM.</p>
              </div>
              <button onClick={() => setShowGoalsModal(false)} className="text-gray-400 hover:text-gray-650 transition-colors p-1 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveMetas}>
              <div className="p-6 space-y-4">
                
                {/* Faturamento */}
                <div className="space-y-1.5">
                  <label htmlFor="goal_faturamento" className="text-xs font-bold uppercase tracking-wider text-gray-400">Meta de Faturamento (R$)</label>
                  <input
                    type="number"
                    id="goal_faturamento"
                    required
                    value={tempFaturamento}
                    onChange={(e) => setTempFaturamento(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-805 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                </div>

                {/* Taxa de Conversão */}
                <div className="space-y-1.5">
                  <label htmlFor="goal_conversao" className="text-xs font-bold uppercase tracking-wider text-gray-400">Meta de Conversão (%)</label>
                  <input
                    type="number"
                    id="goal_conversao"
                    required
                    value={tempConversao}
                    onChange={(e) => setTempConversao(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-805 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                </div>

                {/* Geração de Leads */}
                <div className="space-y-1.5">
                  <label htmlFor="goal_leads" className="text-xs font-bold uppercase tracking-wider text-gray-400">Meta de Leads Cadastrados</label>
                  <input
                    type="number"
                    id="goal_leads"
                    required
                    value={tempLeads}
                    onChange={(e) => setTempLeads(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-805 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                </div>

              </div>

              <div className="p-5 border-t border-gray-100 flex justify-end gap-2.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowGoalsModal(false)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-305 text-gray-600 hover:text-gray-800 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-[#0a4ee4] hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
