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

  // Constrói o endereço completo utilizando os dados do cadastro do Lead se disponíveis,
  // garantindo que o Google Maps encontre a localização correta com base na Rua/Número, Cidade e CEP.
  let enderecoObraCompleto = '';
  if (visita.projects?.leads) {
    const lead = visita.projects.leads;
    const parts = [];
    if (lead.endereco_obra) parts.push(lead.endereco_obra);
    if (lead.cidade) parts.push(lead.cidade);
    if (lead.cep) parts.push(lead.cep);
    enderecoObraCompleto = parts.join(', ');
  }

  const endereco = enderecoObraCompleto || visita.projects?.endereco || visita.endereco;

  const tecnicoNome =
    visita.responsaveis_tecnicos?.nome ||
    (visita.tecnico_id === 't1' ? 'Carlos Eduardo Silva' :
     visita.tecnico_id === 't2' ? 'Fernanda Lima Souza' :
     visita.tecnico_id === 't3' ? 'Rodrigo Medeiros' : null);

  const tecnicoTelefone =
    visita.responsaveis_tecnicos?.telefone ||
    (visita.tecnico_id === 't1' ? '(41) 98888-1234' :
     visita.tecnico_id === 't2' ? '(41) 97777-5678' :
     visita.tecnico_id === 't3' ? '(41) 99999-1111' : null);

  const handleWhatsAppAlert = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o modal de preenchimento
    if (!tecnicoTelefone) {
      alert('Telefone do instalador não cadastrado.');
      return;
    }

    const cleanPhone = tecnicoTelefone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 || cleanPhone.length === 11 
      ? `55${cleanPhone}` 
      : cleanPhone;

    const dataFormatada = visita.data_visita.split('-').reverse().join('/');
    const horario = visita.horario.substring(0, 5);
    const text = `Olá *${tecnicoNome}*,\n\nPassando para lembrar do seu agendamento de visita técnica:\n\n*Cliente:* ${clienteNome}\n*Data:* ${dataFormatada}\n*Horário:* ${horario} hs\n*Endereço:* ${endereco}\n${visita.observacoes ? `*Observações:* ${visita.observacoes}\n` : ''}\nBom trabalho!`;

    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

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
            <div className="flex items-start md:items-center gap-2">
              <p className="text-xs text-gray-400 leading-relaxed break-words flex-1 md:truncate">{endereco}</p>
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
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-sm">
                {tecnicoNome.charAt(0)}
              </div>
              <span className="text-xs font-bold text-orange-700 bg-orange-50/80 border border-orange-100 px-2 py-0.5 rounded-md break-words">
                {tecnicoNome}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t border-gray-100 md:border-t-0 pt-3 md:pt-0">
        {statusBadge}
        {tecnicoNome && tecnicoTelefone && (
          <button
            onClick={handleWhatsAppAlert}
            title="Alertar Instalador via WhatsApp"
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-emerald-600 hover:text-emerald-700 transition-all cursor-pointer shrink-0 inline-flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.46 3.426 1.265 4.887l-1.272 4.654 4.761-1.248c1.411.769 3.012 1.207 4.71 1.207 5.517 0 9.996-4.478 9.996-9.996S17.52 2 12.004 2zm5.008 14.337c-.205.577-1.011 1.103-1.602 1.173-.4.048-.922.072-1.485-.11-3.567-1.157-5.908-4.757-6.086-4.992-.178-.235-1.442-1.92-1.442-3.66 0-1.739.905-2.595 1.226-2.946.321-.351.7-.439.932-.439.234 0 .468.002.671.012.208.01.49-.078.766.592.28.681.959 2.333 1.042 2.499.083.165.138.358.028.577-.11.22-.165.358-.33.55-.165.193-.346.43-.495.577-.165.165-.337.345-.145.676.193.33.856 1.411 1.834 2.285.836.745 1.542.977 1.872 1.143.33.165.522.138.718-.087.195-.226.837-.977 1.06-1.312.22-.335.439-.28.742-.165.303.116 1.925.909 2.256 1.074.33.165.55.247.629.385.08.138.08.799-.125 1.376z"/>
            </svg>
          </button>
        )}
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
