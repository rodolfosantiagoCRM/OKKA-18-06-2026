import React from 'react';

interface AgendaHeaderProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onAgendarClick: () => void;
}

export default function AgendaHeader({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onAgendarClick,
}: AgendaHeaderProps) {
  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Painel de Campo
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">Gestão de Visitas Técnicas</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de ativações de piso radiante e testes de carga.</p>
        </div>
        <button
          onClick={onAgendarClick}
          className="bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto animate-fade-in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Agendar Visita
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por cliente ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold focus:bg-white"
          />
        </div>

        <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {['Todas', 'Agendada', 'Realizada', 'Cancelada'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                statusFilter === status
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
