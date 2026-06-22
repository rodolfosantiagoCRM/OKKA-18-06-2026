'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { Project } from '@/types/database.types';

interface ModalAgendamentoVisitaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visita: {
    project_id: string;
    data_visita: string;
    horario: string;
    status_visita: 'Agendada';
    observacoes: string;
    tecnico_id?: string | null;
    cliente?: string;
    endereco?: string;
  }) => Promise<void>;
  isSaving: boolean;
}

function getTodayStr() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(val: string) {
  if (!val) return '';
  const [y, m, d] = val.split('-');
  return `${d}/${m}/${y}`;
}

const MOCK_FALLBACK_PROJECTS: Project[] = [
  { id: 'p1', lead_id: 'l1', status_projeto: 'Instalação', endereco: 'Rua das Palmeiras, 405 - Cond. Royal - Curitiba', valor_total: 12500, criado_em: '2026-06-10T00:00:00Z', leads: { id: 'l1', nome: 'Roberto Mendonça', email: 'roberto@email.com', telefone: '(41) 99999-1111', cidade: 'Curitiba', area_m2: 80, status: 'Qualificado', criado_em: '2026-06-08T00:00:00Z' } },
  { id: 'p2', lead_id: 'l2', status_projeto: 'Instalação', endereco: 'Av. Batel, 1200 - Apto 402 - Curitiba', valor_total: 8000, criado_em: '2026-06-12T00:00:00Z', leads: { id: 'l2', nome: 'Clarice Lispector', email: 'clarice@email.com', telefone: '(41) 99999-2222', cidade: 'Curitiba', area_m2: 45, status: 'Qualificado', criado_em: '2026-06-11T00:00:00Z' } },
  { id: 'p3', lead_id: 'l3', status_projeto: 'Orçamento', endereco: 'Rua Desembargador Motta, 882 - Mercês', valor_total: 15400, criado_em: '2026-06-15T00:00:00Z', leads: { id: 'l3', nome: 'Julio Cortázar', email: 'julio@email.com', telefone: '(41) 99999-3333', cidade: 'Curitiba', area_m2: 110, status: 'Qualificado', criado_em: '2026-06-14T11:00:00Z' } },
  { id: 'p4', lead_id: 'l4', status_projeto: 'Orçamento', endereco: 'Al. Julia da Costa, 150 - Cabral', valor_total: 9800, criado_em: '2026-06-16T00:00:00Z', leads: { id: 'l4', nome: 'Gabriel García Márquez', email: 'gabriel@email.com', telefone: '(41) 99999-4444', cidade: 'Curitiba', area_m2: 60, status: 'Qualificado', criado_em: '2026-06-15T16:20:00Z' } },
];

export default function ModalAgendamentoVisita({
  isOpen,
  onClose,
  onSave,
  isSaving,
}: ModalAgendamentoVisitaProps) {
  const { projects: dbProjects, isLoading: isLoadingProjects } = useProjects();
  const { responsaveis: dbResponsaveis } = useResponsaveis();

  const isDbConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  const projects = isDbConfigured ? dbProjects : MOCK_FALLBACK_PROJECTS;

  // Filtra apenas projetos que possuem um lead válido e ativo (evita órfãos de exclusão)
  const activeProjects = useMemo(() => {
    return projects.filter((p) => !!p.leads);
  }, [projects]);

  const [projectId, setProjectId] = useState('');
  const [dataVisita, setDataVisita] = useState(getTodayStr);
  const [horario, setHorario] = useState('09:00');
  const [tecnicoId, setTecnicoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const MOCK_FALLBACK_TECNICOS = [
    { id: 't1', nome: 'Carlos Eduardo Silva' },
    { id: 't2', nome: 'Fernanda Lima Souza' },
    { id: 't3', nome: 'Rodrigo Medeiros' },
  ];
  const responsaveis = isDbConfigured ? dbResponsaveis : MOCK_FALLBACK_TECNICOS;

  // Ajusta o projectId se a lista de projetos carregar depois
  useEffect(() => {
    if (activeProjects.length > 0 && (!projectId || !activeProjects.some(p => p.id === projectId))) {
      setProjectId(activeProjects[0].id);
    }
  }, [activeProjects, projectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) { setErrorMessage('Por favor, selecione um projeto.'); return; }
    if (!dataVisita) { setErrorMessage('Por favor, selecione a data da visita.'); return; }
    if (!horario) { setErrorMessage('Por favor, informe o horário da visita.'); return; }

    const selectedProj = projects.find((p) => p.id === projectId);
    if (!selectedProj) return;

    try {
      await onSave({
        project_id: projectId,
        data_visita: dataVisita,
        horario: horario,
        status_visita: 'Agendada',
        observacoes: observacoes,
        tecnico_id: tecnicoId || null,
        cliente: selectedProj.leads?.nome || 'Cliente Desconhecido',
        endereco: selectedProj.endereco || 'Endereço não informado',
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao agendar visita.';
      setErrorMessage(msg);
    }
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none transition-all text-sm";
  const selectClass = "w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl pl-9 pr-4 py-2.5 text-gray-800 outline-none transition-all text-sm cursor-pointer appearance-none";
  const labelClass = "text-xs font-bold uppercase tracking-wider text-gray-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-400" />

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-gray-900">Agendar Nova Visita</h3>
            <p className="text-xs text-gray-500 mt-1">Selecione o projeto, técnico, data e horário.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 transition-colors p-1.5 cursor-pointer rounded-xl hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">

            {/* Erro */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorMessage}
              </div>
            )}

            {/* Aviso de falta de projetos no banco */}
            {isDbConfigured && projects.length === 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-semibold flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <svg className="w-4.5 h-4.5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Nenhum projeto cadastrado no banco de dados.</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed text-amber-600 pl-6">
                  Para agendar uma visita, você precisa ter um projeto ativo. Cadastre um lead no menu <strong>Leads</strong> e mude o status para <strong>Qualificado</strong> para gerar um projeto automaticamente.
                </p>
              </div>
            )}

            {/* Projeto */}
            <div className="space-y-1.5">
              <label htmlFor="project_id" className={labelClass}>Projeto / Cliente</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
                <select
                  id="project_id"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={selectClass}
                >
                  {isLoadingProjects && dbProjects.length === 0 ? (
                    <option value="">Carregando projetos...</option>
                  ) : activeProjects.length === 0 ? (
                    <option value="">Nenhum projeto ativo disponível</option>
                  ) : (
                    activeProjects.map((proj) => {
                      const end = proj.endereco || '';
                      return (
                        <option key={proj.id} value={proj.id}>
                          {proj.leads?.nome || 'Cliente Sem Nome'} — {end.length > 38 ? `${end.substring(0, 38)}...` : end}
                        </option>
                      );
                    })
                  )}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Técnico */}
            <div className="space-y-1.5">
              <label htmlFor="tecnico_id" className={labelClass}>Técnico Responsável</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <select
                  id="tecnico_id"
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecionar técnico depois</option>
                  {responsaveis.map((tec) => (
                    <option key={tec.id} value={tec.id}>{tec.nome}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Data + Horário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Data */}
              <div className="space-y-1.5">
                <label className={labelClass}>Data da Visita</label>
                <div
                  className="relative flex items-center bg-gray-50 border border-gray-200 hover:border-orange-300 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 rounded-xl transition-all overflow-hidden cursor-pointer"
                  onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
                >
                  <svg className="w-4 h-4 text-gray-400 ml-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="flex-1 pl-2 py-2.5 text-sm text-gray-700 select-none font-medium">
                    {dataVisita ? formatDisplayDate(dataVisita) : 'Selecionar data'}
                  </span>
                  <input
                    ref={dateInputRef}
                    type="date"
                    id="data_visita"
                    value={dataVisita}
                    onChange={(e) => setDataVisita(e.target.value)}
                    required
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="px-3 py-2.5 bg-orange-50 border-l border-orange-200 text-orange-500 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Horário */}
              <div className="space-y-1.5">
                <label className={labelClass}>Horário</label>
                <div
                  className="relative flex items-center bg-gray-50 border border-gray-200 hover:border-orange-300 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 rounded-xl transition-all overflow-hidden cursor-pointer"
                  onClick={() => timeInputRef.current?.showPicker?.() || timeInputRef.current?.focus()}
                >
                  <svg className="w-4 h-4 text-gray-400 ml-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="flex-1 pl-2 py-2.5 text-sm text-gray-700 font-mono font-bold select-none">
                    {horario || '09:00'}
                  </span>
                  <input
                    ref={timeInputRef}
                    type="time"
                    id="horario"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    required
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="px-3 py-2.5 bg-orange-50 border-l border-orange-200 text-orange-500 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Atalhos de horário */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Atalhos de Horário</label>
              <div className="flex flex-wrap gap-2">
                {['07:00', '08:00', '09:00', '10:00', '13:00', '14:00', '15:00', '16:00'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorario(h)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      horario === h
                        ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/30'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label htmlFor="modal_observacoes" className={labelClass}>
                Instruções / Observações Iniciais
              </label>
              <textarea
                id="modal_observacoes"
                rows={3}
                placeholder="Descreva o que precisa ser feito nesta visita..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !projectId || !dataVisita || !horario}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Agendando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar Agendamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
