import React from 'react';

interface AgendaHeaderProps {
  totalHoje: number;
  materiaisPendentesCount: number;
  taxaConclusao: number;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onAgendarClick: () => void;
}

export default function AgendaHeader({
  totalHoje,
  materiaisPendentesCount,
  taxaConclusao,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onAgendarClick,
}: AgendaHeaderProps) {
  return (
    <div className="space-y-8">
      {/* Header do Painel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Painel de Campo
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-slate-100">Visitas Técnicas</h1>
          <p className="text-xs text-slate-400 mt-1">Controle de ativações de piso radiante e testes de carga.</p>
        </div>
        <button
          onClick={onAgendarClick}
          className="bg-gradient-to-r from-orange-500 to-amber-650 hover:from-orange-600 hover:to-amber-705 text-white font-bold text-xs px-4.5 py-2.5 rounded-lg shadow-lg shadow-orange-500/10 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Agendar Visita
        </button>
      </div>

      {/* Grid de KPIs Superiores (Design Térmico Premium) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* KPI 1: Visitas Hoje */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-4 p-2 bg-orange-500/10 text-orange-400 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Agendados Hoje</p>
          <h3 className="text-3xl font-extrabold text-slate-150 mt-2">{totalHoje}</h3>
          <p className="text-[10px] text-orange-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
            Serviços pendentes de ativação
          </p>
        </div>

        {/* KPI 2: Materiais Pendentes */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-4 p-2 bg-amber-500/10 text-amber-400 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Materiais Pendentes</p>
          <h3 className="text-3xl font-extrabold text-slate-150 mt-2">{materiaisPendentesCount}</h3>
          <p className="text-[10px] text-amber-400 mt-1">Visitas sem relatório de insumos</p>
        </div>

        {/* KPI 3: Taxa de Conclusão */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-4 p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Taxa de Eficiência</p>
          <h3 className="text-3xl font-extrabold text-slate-150 mt-2">{taxaConclusao}%</h3>
          <p className="text-[10px] text-emerald-400 mt-1">Conclusão acumulada da equipe</p>
        </div>
      </div>

      {/* Filtros de Busca e Status de Visita */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 border border-slate-850 rounded-2xl">
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-3 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por cliente ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
          />
        </div>

        <div className="flex gap-1 p-1 bg-slate-950 border border-slate-850 rounded-lg overflow-x-auto w-full md:w-auto">
          {['Todas', 'Agendada', 'Realizada', 'Cancelada'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                statusFilter === status
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {status === 'Todas' ? 'Todas' : status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
