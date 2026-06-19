import React, { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
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
    // Campos auxiliares para o fallback local
    cliente?: string;
    endereco?: string;
  }) => Promise<void>;
  isSaving: boolean;
}

export default function ModalAgendamentoVisita({
  isOpen,
  onClose,
  onSave,
  isSaving,
}: ModalAgendamentoVisitaProps) {
  const { projects: dbProjects, isLoading: isLoadingProjects } = useProjects();
  const [projectId, setProjectId] = useState('');
  const [dataVisita, setDataVisita] = useState('2026-06-18'); // Hoje no sistema
  const [horario, setHorario] = useState('09:00');
  const [observacoes, setObservacoes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fallback local de projetos caso o banco esteja vazio
  const MOCK_FALLBACK_PROJECTS: Project[] = [
    {
      id: 'p1',
      lead_id: 'l1',
      status_projeto: 'Instalação',
      endereco: 'Rua das Palmeiras, 405 - Cond. Royal - Curitiba',
      valor_total: 12500,
      criado_em: '2026-06-10T00:00:00Z',
      leads: {
        id: 'l1',
        nome: 'Roberto Mendonça',
        email: 'roberto@email.com',
        telefone: '(41) 99999-1111',
        cidade: 'Curitiba',
        area_m2: 80,
        status: 'Qualificado',
        criado_em: '2026-06-08T00:00:00Z'
      }
    },
    {
      id: 'p2',
      lead_id: 'l2',
      status_projeto: 'Instalação',
      endereco: 'Av. Batel, 1200 - Apto 402 - Curitiba',
      valor_total: 8000,
      criado_em: '2026-06-12T00:00:00Z',
      leads: {
        id: 'l2',
        nome: 'Clarice Lispector',
        email: 'clarice@email.com',
        telefone: '(41) 99999-2222',
        cidade: 'Curitiba',
        area_m2: 45,
        status: 'Qualificado',
        criado_em: '2026-06-11T00:00:00Z'
      }
    },
    {
      id: 'p3',
      lead_id: 'l3',
      status_projeto: 'Orçamento',
      endereco: 'Rua Desembargador Motta, 882 - Mercês',
      valor_total: 15400,
      criado_em: '2026-06-15T00:00:00Z',
      leads: {
        id: 'l3',
        nome: 'Julio Cortázar',
        email: 'julio@email.com',
        telefone: '(41) 99999-3333',
        cidade: 'Curitiba',
        area_m2: 110,
        status: 'Qualificado',
        criado_em: '2026-06-14T00:00:00Z'
      }
    },
    {
      id: 'p4',
      lead_id: 'l4',
      status_projeto: 'Orçamento',
      endereco: 'Al. Julia da Costa, 150 - Cabral',
      valor_total: 9800,
      criado_em: '2026-06-16T00:00:00Z',
      leads: {
        id: 'l4',
        nome: 'Gabriel García Márquez',
        email: 'gabriel@email.com',
        telefone: '(41) 99999-4444',
        cidade: 'Curitiba',
        area_m2: 60,
        status: 'Qualificado',
        criado_em: '2026-06-15T00:00:00Z'
      }
    }
  ];

  const projects = dbProjects.length > 0 ? dbProjects : MOCK_FALLBACK_PROJECTS;

  useEffect(() => {
    if (isOpen && projects.length > 0) {
      setProjectId(projects[0].id);
      setDataVisita('2026-06-18');
      setHorario('09:00');
      setObservacoes('');
      setErrorMessage('');
    }
  }, [isOpen, dbProjects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setErrorMessage('Por favor, selecione um projeto.');
      return;
    }

    const selectedProj = projects.find((p) => p.id === projectId);
    if (!selectedProj) return;

    try {
      await onSave({
        project_id: projectId,
        data_visita: dataVisita,
        horario: horario,
        status_visita: 'Agendada',
        observacoes: observacoes,
        cliente: selectedProj.leads?.nome || 'Cliente Desconhecido',
        endereco: selectedProj.endereco || 'Endereço não informado',
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao agendar visita.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Escuro */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Conteúdo do Modal */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />

        {/* Header Modal */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Agendar Nova Visita Técnica</h3>
            <p className="text-xs text-slate-400 mt-1">Selecione o projeto e configure o dia e horário.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-350 transition-colors p-1 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body Modal / Formulário */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Selecionar Projeto */}
            <div className="space-y-2">
              <label htmlFor="project_id" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Projeto / Cliente
              </label>
              <select
                id="project_id"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2.5 text-slate-200 outline-none transition-all text-sm cursor-pointer"
              >
                {isLoadingProjects && dbProjects.length === 0 ? (
                  <option value="">Carregando projetos...</option>
                ) : projects.length === 0 ? (
                  <option value="">Nenhum projeto ativo disponível</option>
                ) : (
                  projects.map((proj) => (
                    <option key={proj.id} value={proj.id} className="bg-slate-950 text-slate-200">
                      {proj.leads?.nome || 'Cliente Sem Nome'} — {proj.endereco.length > 40 ? `${proj.endereco.substring(0, 40)}...` : proj.endereco}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Grid Data e Hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="data_visita" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Data da Visita
                </label>
                <input
                  type="date"
                  id="data_visita"
                  value={dataVisita}
                  onChange={(e) => setDataVisita(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2.5 text-slate-200 outline-none transition-all text-sm cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="horario" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Horário
                </label>
                <input
                  type="time"
                  id="horario"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2.5 text-slate-200 outline-none transition-all text-sm cursor-pointer"
                />
              </div>
            </div>

            {/* Observações Iniciais */}
            <div className="space-y-2">
              <label htmlFor="modal_observacoes" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Instruções de Campo / Observações Iniciais
              </label>
              <textarea
                id="modal_observacoes"
                rows={3}
                placeholder="Insira detalhes sobre o que precisa ser feito nesta visita..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-650 outline-none transition-all text-sm resize-none"
              />
            </div>
          </div>

          {/* Footer Modal */}
          <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-250 rounded-lg font-semibold text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !projectId}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-orange-500/10 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Agendando...
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
