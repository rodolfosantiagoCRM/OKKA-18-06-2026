import React from 'react';
import { Visita } from '@/types/database.types';

interface VisitaCardProps {
  visita: Visita;
  onOpenModal: (visita: Visita) => void;
  showDate?: boolean;
  onDelete?: (id: string) => void;
}

function checkIsAtrasado(dateStr: string, timeStr: string, status: string): boolean {
  if (status !== 'Agendada') return false;
  const now = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const visitDate = new Date(y, m - 1, d, hours, minutes);
  return visitDate < now;
}

export default function VisitaCard({ visita, onOpenModal, showDate = false, onDelete }: VisitaCardProps) {
  const clienteNome = visita.projects?.leads?.nome || visita.cliente;
  const endereco = visita.projects?.endereco || visita.endereco;

  const tecnicoNome =
    visita.responsaveis_tecnicos?.nome ||
    (visita.tecnico_id === 't1' ? 'Carlos Eduardo Silva' :
     visita.tecnico_id === 't2' ? 'Fernanda Lima Souza' :
     visita.tecnico_id === 't3' ? 'Rodrigo Medeiros' : null);

  const isAtrasado = checkIsAtrasado(visita.data_visita, visita.horario, visita.status_visita);

  const handleMapClick = (e: React.MouseEvent) => e.stopPropagation();
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco || '')}`;

  const statusBadge = isAtrasado ? (
    <span className="px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide uppercase border bg-rose-50 border-rose-200 text-rose-600 animate-pulse flex items-center gap-1.5 shadow-sm">
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      Atrasado
    </span>
  ) : (
    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide uppercase border flex items-center gap-1.5 ${
      visita.status_visita === 'Realizada'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : visita.status_visita === 'Cancelada'
        ? 'bg-rose-50 border-rose-200 text-rose-700'
        : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        visita.status_visita === 'Realizada' ? 'bg-emerald-500' :
        visita.status_visita === 'Cancelada' ? 'bg-rose-500' :
        'bg-amber-500 animate-pulse'
      }`} />
      {visita.status_visita}
    </span>
  );

  return (
    <div
      onClick={() => onOpenModal(visita)}
      className="bg-white hover:bg-gray-50 border border-gray-100 hover:border-orange-200 hover:shadow-md p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group shadow-sm"
    >
      {/* Lado Esquerdo */}
      <div className="flex items-start gap-4 flex-1 w-full min-w-0">
        {/* Badge de horário */}
        <div className="shrink-0 text-center">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 min-w-[60px]">
            {showDate && (
              <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                {visita.data_visita.split('-').reverse().slice(0, 2).join('/')}
              </p>
            )}
            <p className="text-sm font-black text-orange-600 font-mono leading-none">
              {visita.horario.substring(0, 5)}
            </p>
            <p className="text-[8px] text-orange-400 font-semibold">hs</p>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <h4 className="font-black text-gray-900 group-hover:text-orange-600 transition-colors text-sm md:text-base leading-tight">
            {clienteNome}
          </h4>

          {endereco && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400 leading-tight truncate">{endereco}</p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleMapClick}
                title="Abrir no Google Maps"
                className="p-1 rounded-lg bg-gray-100 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-400 hover:text-orange-500 transition-all shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
            </div>
          )}

          {tecnicoNome && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-[8px] font-black shrink-0">
                {tecnicoNome.charAt(0)}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                <strong className="text-gray-700">{tecnicoNome}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t border-gray-100 md:border-t-0 pt-3 md:pt-0">
        {statusBadge}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Deseja realmente excluir esta visita técnica?')) {
                onDelete(visita.id);
              }
            }}
            title="Excluir Visita"
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 border border-gray-200 hover:border-rose-300 text-gray-400 hover:text-rose-500 transition-all cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors hidden md:block"
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
