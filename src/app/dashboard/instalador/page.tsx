'use client';

import React from 'react';

export default function InstaladorDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Nível: Instalador / Técnico de Campo
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">
            Painel Operacional PWA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Minhas visitas técnicas agendadas, preenchimento de relatórios e controle de materiais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visitas para Hoje</div>
          <div className="text-3xl font-black text-gray-900 mt-2">3 Visitas</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">⏰ Primeira às 09:30</div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Relatórios Pendentes</div>
          <div className="text-3xl font-black text-gray-900 mt-2">1 pendente</div>
          <div className="text-xs text-amber-600 font-semibold mt-2">⚠️ Necessário enviar antes do final do dia</div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estoque de Cabos</div>
          <div className="text-3xl font-black text-gray-900 mt-2">120 metros</div>
          <div className="text-xs text-gray-500 font-semibold mt-2">Malha Radiante 15W/m</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas do Técnico</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#0a4ee4] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            📅 Minha Agenda
          </button>
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#0a4ee4] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            📝 Lançar Relatório de Visita
          </button>
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#0a4ee4] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            📦 Solicitar Materiais
          </button>
          <button className="p-4 border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#0a4ee4] rounded-xl transition-all font-semibold text-sm text-left shadow-sm">
            📞 Suporte da Engenharia
          </button>
        </div>
      </div>
    </div>
  );
}
