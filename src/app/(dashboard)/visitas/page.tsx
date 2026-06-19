'use client';

import React, { useState } from 'react';
import { useVisitas } from '@/hooks/useVisitas';
import AgendaHeader from '@/components/crm/agenda-header';
import AgendaTimeline from '@/components/crm/agenda-timeline';
import ModalPreenchimentoVisita from '@/components/crm/modal-preenchimento-visita';
import ModalAgendamentoVisita from '@/components/crm/modal-agendamento-visita';
import { Visita } from '@/types/database.types';

// Dados simulados de fallback (para exibição caso o banco não esteja preenchido)
const MOCK_FALLBACK_VISITAS: Visita[] = [
  {
    id: 'v1',
    project_id: 'p1',
    data_visita: '2026-06-18', // Hoje
    horario: '09:00',
    status_visita: 'Agendada',
    material_usado: ['Cabo Calefator 15W', 'Termostato Wifi Black'],
    valor_gasto: 150.00,
    observacoes: 'Instalação da malha radiante no banheiro da suíte master.',
    criado_em: '2026-06-18T00:00:00Z',
    projects: {
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
    }
  },
  {
    id: 'v2',
    project_id: 'p2',
    data_visita: '2026-06-18', // Hoje
    horario: '14:30',
    status_visita: 'Agendada',
    material_usado: [],
    valor_gasto: 0,
    observacoes: 'Teste de carga elétrica e calibração dos sensores de piso.',
    criado_em: '2026-06-18T00:00:00Z',
    projects: {
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
    }
  },
  {
    id: 'v3',
    project_id: 'p3',
    data_visita: '2026-06-19', // Amanhã
    horario: '10:00',
    status_visita: 'Agendada',
    material_usado: [],
    valor_gasto: 0,
    observacoes: 'Preparação do contrapiso e fixação das guias de isolamento.',
    criado_em: '2026-06-18T00:00:00Z',
    projects: {
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
    }
  },
  {
    id: 'v4',
    project_id: 'p4',
    data_visita: '2026-06-21', // Próximos dias
    horario: '11:00',
    status_visita: 'Agendada',
    material_usado: [],
    valor_gasto: 0,
    observacoes: 'Medição inicial e entrega técnica do kit de automação.',
    criado_em: '2026-06-18T00:00:00Z',
    projects: {
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
  }
];

export default function DashboardVisitas() {
  const {
    visitas: dbVisitas,
    isLoading,
    updateVisita,
    isUpdating,
    createVisita,
    isCreating,
  } = useVisitas();

  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAgendarModalOpen, setIsAgendarModalOpen] = useState(false);

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');

  // Fallback local caso o banco esteja vazio
  const [localVisitasFallback, setLocalVisitasFallback] = useState<Visita[]>(MOCK_FALLBACK_VISITAS);

  // Decide qual lista de visitas utilizar (banco se houver dados, senão fallback simulado)
  const isDbConfigured = dbVisitas.length > 0;
  const listVisitas = isDbConfigured ? dbVisitas : localVisitasFallback;

  const handleOpenModal = (visita: Visita) => {
    setSelectedVisita(visita);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedVisita(null);
    setIsModalOpen(false);
  };

  const handleSaveReport = async (id: string, updates: Partial<Visita>) => {
    if (isDbConfigured) {
      // Caso o Supabase esteja ativo, executa a mutação
      await updateVisita({ id, updates });
    } else {
      // Caso contrário, atualiza o estado local para manter a interatividade do mockup
      setLocalVisitasFallback((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
      );
    }
  };

  const handleScheduleVisita = async (novaVisita: {
    project_id: string;
    data_visita: string;
    horario: string;
    status_visita: 'Agendada';
    observacoes: string;
    cliente?: string;
    endereco?: string;
  }) => {
    if (isDbConfigured) {
      await createVisita(novaVisita);
    } else {
      // Cria registro mockado
      const newId = `v${localVisitasFallback.length + 1}`;
      const newRecord: Visita = {
        id: newId,
        project_id: novaVisita.project_id,
        data_visita: novaVisita.data_visita,
        horario: novaVisita.horario,
        status_visita: novaVisita.status_visita,
        material_usado: [],
        valor_gasto: 0,
        observacoes: novaVisita.observacoes,
        criado_em: new Date().toISOString(),
        cliente: novaVisita.cliente,
        endereco: novaVisita.endereco,
        projects: {
          id: novaVisita.project_id,
          lead_id: 'l-mock',
          status_projeto: 'Instalação',
          endereco: novaVisita.endereco || '',
          valor_total: 10000,
          criado_em: new Date().toISOString(),
          leads: {
            id: 'l-mock',
            nome: novaVisita.cliente || 'Cliente Mock',
            email: '',
            telefone: '',
            cidade: 'Curitiba',
            area_m2: 50,
            status: 'Qualificado',
            criado_em: new Date().toISOString()
          }
        }
      };
      setLocalVisitasFallback((prev) => [...prev, newRecord]);
    }
  };

  // Filtragem dinâmica
  const filteredVisitas = listVisitas.filter((v) => {
    // Filtro por Status
    if (statusFilter !== 'Todas' && v.status_visita !== statusFilter) {
      return false;
    }
    // Filtro por termo de busca (cliente, endereço ou observações)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const nomeCliente = (v.projects?.leads?.nome || v.cliente || '').toLowerCase();
      const endereco = (v.projects?.endereco || v.endereco || '').toLowerCase();
      const observacoes = (v.observacoes || '').toLowerCase();
      return (
        nomeCliente.includes(term) ||
        endereco.includes(term) ||
        observacoes.includes(term)
      );
    }
    return true;
  });

  // Cálculos de KPIs baseados na lista total (completa)
  const hojeStr = '2026-06-18';
  const visitasHoje = listVisitas.filter((v) => v.data_visita === hojeStr);
  const totalHoje = visitasHoje.filter((v) => v.status_visita === 'Agendada').length;
  const materiaisPendentesCount = listVisitas.filter(
    (v) => !v.material_usado || v.material_usado.length === 0
  ).length;

  const visitasExecutadas = listVisitas.filter((v) => v.status_visita !== 'Agendada').length;
  const taxaConclusao =
    listVisitas.length > 0 ? Math.round((visitasExecutadas / listVisitas.length) * 100) : 0;

  if (isLoading && isDbConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-slate-400">Carregando cronograma...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Componente KPIs e Cabeçalho */}
        <AgendaHeader
          totalHoje={totalHoje}
          materiaisPendentesCount={materiaisPendentesCount}
          taxaConclusao={taxaConclusao}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onAgendarClick={() => setIsAgendarModalOpen(true)}
        />

        {/* Componente Timeline por Dias (com dados filtrados) */}
        {filteredVisitas.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-12 text-center">
            <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-450 text-sm font-medium">Nenhuma visita atende aos filtros aplicados.</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-xs text-orange-450 hover:underline font-bold"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <AgendaTimeline visitas={filteredVisitas} onOpenModal={handleOpenModal} />
        )}

        {/* Componente Modal de Preenchimento Técnico */}
        <ModalPreenchimentoVisita
          isOpen={isModalOpen}
          visita={selectedVisita}
          onClose={handleCloseModal}
          onSave={handleSaveReport}
          isSaving={isUpdating}
        />

        {/* Componente Modal de Agendamento */}
        <ModalAgendamentoVisita
          isOpen={isAgendarModalOpen}
          onClose={() => setIsAgendarModalOpen(false)}
          onSave={handleScheduleVisita}
          isSaving={isCreating}
        />
      </div>
    </div>
  );
}
