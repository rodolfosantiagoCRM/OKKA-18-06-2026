'use client';

import React from 'react';

export default function MestreDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Nível: Mestre (Administração)
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">
            Painel da Gerência
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visão completa do faturamento, controle de acessos e eficiência técnica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Faturamento Consolidado</div>
          <div className="text-3xl font-black text-gray-900 mt-2">R$ 158.400,00</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">↑ +14.2% em relação ao mês anterior</div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Taxa de Conversão</div>
          <div className="text-3xl font-black text-gray-900 mt-2">68.5%</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">↑ +3.1% em relação ao trimestre anterior</div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Usuários Ativos</div>
          <div className="text-3xl font-black text-gray-900 mt-2">12 colaboradores</div>
          <div className="text-xs text-gray-500 font-semibold mt-2">0 contas bloqueadas</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ações Estratégicas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#E25B3C] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            👥 Gerenciar Equipes
          </button>
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#E25B3C] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            📊 Relatório Financeiro
          </button>
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#E25B3C] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            ⚙️ Configurar Metas
          </button>
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#E25B3C] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            🔒 Auditoria de Acessos
          </button>
        </div>
      </div>
    </div>
  );
}
