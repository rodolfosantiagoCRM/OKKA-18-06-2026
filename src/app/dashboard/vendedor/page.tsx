'use client';

import React from 'react';

export default function VendedorDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <span className="text-[10px] font-bold text-[#E25B3C] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Nível: Vendas / Comercial
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">
            Painel de Vendas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestão ativa de Leads, propostas em andamento e simulação de projetos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Meus Leads Novos</div>
          <div className="text-3xl font-black text-gray-900 mt-2">8 Leads</div>
          <div className="text-xs text-orange-600 font-semibold mt-2">⚡ Requer contato imediato</div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Propostas Enviadas</div>
          <div className="text-3xl font-black text-gray-900 mt-2">14 ativas</div>
          <div className="text-xs text-gray-500 font-semibold mt-2">Valor potencial: R$ 85.000,00</div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Metas do Mês</div>
          <div className="text-3xl font-black text-gray-900 mt-2">72%</div>
          <div className="text-xs text-[#E25B3C] font-semibold mt-2">Falta pouco para atingir a bonificação!</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ações Operacionais de Vendas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#E25B3C] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            ✨ Capturar Novo Lead
          </button>
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#E25B3C] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            📝 Criar Proposta Comercial
          </button>
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#E25B3C] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            📞 Histórico de Contatos
          </button>
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#E25B3C] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            📅 Agendar Reunião
          </button>
        </div>
      </div>
    </div>
  );
}
