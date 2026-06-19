import React from 'react';
import { Visita } from '@/types/database.types';

interface VisitaCardProps {
  visita: Visita;
  onOpenModal: (visita: Visita) => void;
  showDate?: boolean;
}

export default function VisitaCard({ visita, onOpenModal, showDate = false }: VisitaCardProps) {
  // Puxar dados aninhados se existirem, caso contrário usar fallback dos dados simulados
  const clienteNome = visita.projects?.leads?.nome || visita.cliente;
  const endereco = visita.projects?.endereco || visita.endereco;

  // Função para evitar que o clique no link do mapa abra o modal da visita
  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco || '')}`;

  return (
    <div
      onClick={() => onOpenModal(visita)}
      className="bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group shadow-md hover:shadow-orange-500/5 hover:-translate-y-0.5"
    >
      <div className="space-y-2 flex-1 w-full">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-slate-950 text-orange-400 border border-orange-500/10">
            {showDate ? `${visita.data_visita.split('-').reverse().slice(0, 2).join('/')} - ` : ''}
            {visita.horario.substring(0, 5)} Hs
          </span>
          <h4 className="font-bold text-slate-100 group-hover:text-orange-400 transition-colors text-sm md:text-base">
            {clienteNome}
          </h4>
        </div>
        
        {/* Endereço com link para Google Maps */}
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400 leading-tight">
            {endereco}
          </p>
          {endereco && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleMapClick}
              title="Abrir rota no Google Maps"
              className="p-1 rounded bg-slate-950 border border-slate-850 hover:border-orange-500/30 text-slate-400 hover:text-orange-400 transition-all flex items-center justify-center cursor-pointer shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t border-slate-850 md:border-t-0 pt-2.5 md:pt-0">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
            visita.status_visita === 'Realizada'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : visita.status_visita === 'Cancelada'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
          }`}
        >
          {visita.status_visita}
        </span>
        <svg
          className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition-colors hidden md:block"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
