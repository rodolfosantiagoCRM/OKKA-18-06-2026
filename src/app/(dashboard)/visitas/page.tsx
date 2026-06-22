'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useVisitas } from '@/hooks/useVisitas';
import AgendaHeader from '@/components/crm/agenda-header';
import ModalPreenchimentoVisita from '@/components/crm/modal-preenchimento-visita';
import ModalAgendamentoVisita from '@/components/crm/modal-agendamento-visita';
import VisitaCard from '@/components/crm/visita-card';
import { Visita } from '@/types/database.types';

// Dados simulados de fallback estruturados de forma robusta
const MOCK_FALLBACK_VISITAS: Visita[] = [
  {
    id: 'v1',
    project_id: 'p1',
    data_visita: '', // Preenchido dinamicamente
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
    data_visita: '', // Preenchido dinamicamente
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
    data_visita: '', // Preenchido dinamicamente
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
    data_visita: '', // Preenchido dinamicamente
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
  },
  // Item para demonstrar o Alerta de Atrasos no Mock
  {
    id: 'v-atrasada',
    project_id: 'p1',
    data_visita: '2026-06-05', // Data passada
    horario: '15:00',
    status_visita: 'Agendada',
    material_usado: [],
    valor_gasto: 0,
    observacoes: 'Visita de vistoria atrasada devido a ajuste de agenda do cliente.',
    criado_em: '2026-06-05T00:00:00Z',
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
  }
];

function getFormattedHeaderDate(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthName = months[parseInt(month, 10) - 1];
  return `${parseInt(day, 10)} ${monthName}`;
}

function getFormattedFullDateWithDayOfWeek(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const weekdays = [
    'Domingo',
    'Segunda-Feira',
    'Terça-Feira',
    'Quarta-Feira',
    'Quinta-Feira',
    'Sexta-Feira',
    'Sábado'
  ];
  const monthName = months[month - 1];
  const weekdayName = weekdays[date.getDay()];
  
  return `${day} ${monthName} ${year} — ${weekdayName}`;
}

export default function DashboardVisitas() {
  const {
    visitas: dbVisitas,
    hojeStr: dbHojeStr,
    amanhaStr: dbAmanhaStr,
    atrasadas: dbAtrasadas,
    hoje: dbHoje,
    amanha: dbAmanha,
    proximas: dbProximas,
    isLoading,
    updateVisita,
    isUpdating,
    createVisita,
    isCreating,
    deleteVisita,
  } = useVisitas();

  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAgendarModalOpen, setIsAgendarModalOpen] = useState(false);

  // Toast de feedback
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');

  // Fallback local caso o banco esteja vazio
  const [localVisitasFallback, setLocalVisitasFallback] = useState<Visita[]>(MOCK_FALLBACK_VISITAS);

  const isDbConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  // Gerar datas no fuso horário do Brasil para o mock, se necessário
  const clientDates = useMemo(() => {
    const now = new Date();
    const formatTZ = (d: Date) => {
      const formatted = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
      const [day, month, year] = formatted.split('/');
      return `${year}-${month}-${day}`;
    };
    const hoje = formatTZ(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const amanha = formatTZ(tomorrow);
    return { hoje, amanha };
  }, []);

  const hojeStr = isDbConfigured ? dbHojeStr : clientDates.hoje;
  const amanhaStr = isDbConfigured ? dbAmanhaStr : clientDates.amanha;

  // Agrupamento em memória dos dados locais quando o banco não estiver configurado
  const groupedFallback = useMemo(() => {
    const list = localVisitasFallback.map((v) => {
      let date = v.data_visita;
      if (!date) {
        if (v.id === 'v1' || v.id === 'v2') {
          date = hojeStr;
        } else if (v.id === 'v3') {
          date = amanhaStr;
        } else if (v.id === 'v4') {
          const future = new Date();
          future.setDate(future.getDate() + 3);
          const formatted = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(future);
          const [day, month, year] = formatted.split('/');
          date = `${year}-${month}-${day}`;
        }
      }
      return { ...v, data_visita: date };
    });

    const atrasadas = list.filter((v) => v.data_visita < hojeStr && v.status_visita === 'Agendada');
    const hoje = list.filter((v) => v.data_visita === hojeStr);
    const amanha = list.filter((v) => v.data_visita === amanhaStr);
    const proximas = list.filter((v) => v.data_visita > amanhaStr);

    return { atrasadas, hoje, amanha, proximas, raw: list };
  }, [localVisitasFallback, hojeStr, amanhaStr]);

  // Escolhe os grupos com base na presença de dados do banco
  const activeAtrasadas = isDbConfigured ? dbAtrasadas : groupedFallback.atrasadas;
  const activeHoje = isDbConfigured ? dbHoje : groupedFallback.hoje;
  const activeAmanha = isDbConfigured ? dbAmanha : groupedFallback.amanha;
  const activeProximas = isDbConfigured ? dbProximas : groupedFallback.proximas;
  const activeRaw = isDbConfigured ? dbVisitas : groupedFallback.raw;

  const handleOpenModal = (visita: Visita) => {
    setSelectedVisita(visita);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedVisita(null);
    setIsModalOpen(false);
  };

  const handleDeleteVisita = async (id: string) => {
    try {
      if (isDbConfigured) {
        await deleteVisita(id);
        showToast('Visita excluída com sucesso!', 'success');
      } else {
        setLocalVisitasFallback((prev) => prev.filter((v) => v.id !== id));
        showToast('Visita removida!', 'success');
      }
      // Fecha modal se estiver aberto
      setIsModalOpen(false);
      setSelectedVisita(null);
    } catch (err: any) {
      console.error('Falha ao excluir visita:', err);
      showToast(err?.message || 'Erro ao excluir visita. Verifique as permissões.', 'error');
    }
  };

  const handleSaveReport = async (id: string, updates: Partial<Visita>) => {
    if (isDbConfigured) {
      await updateVisita({ id, updates });
    } else {
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
    tecnico_id?: string | null;
    cliente?: string;
    endereco?: string;
  }) => {
    if (isDbConfigured) {
      await createVisita(novaVisita);
    } else {
      const newId = `v-local-${Date.now()}`;
      const newRecord: Visita = {
        id: newId,
        project_id: novaVisita.project_id,
        data_visita: novaVisita.data_visita,
        horario: novaVisita.horario,
        status_visita: novaVisita.status_visita,
        material_usado: [],
        valor_gasto: 0,
        observacoes: novaVisita.observacoes,
        tecnico_id: novaVisita.tecnico_id || null,
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

  // Helper de filtragem para aplicar os filtros globais (busca e status)
  const applyFilters = useCallback((list: Visita[]) => {
    return list.filter((v) => {
      // Filtro por Status
      if (statusFilter === 'Atrasada') {
        const isAtrasada = v.status_visita === 'Agendada' && v.data_visita < hojeStr;
        if (!isAtrasada) return false;
      } else if (statusFilter !== 'Todas' && v.status_visita !== statusFilter) {
        return false;
      }
      // Filtro por termo de busca
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
  }, [statusFilter, searchTerm, hojeStr]);

  // Filtrar os grupos separadamente para preservar o design das colunas
  const atrasadasFiltered = useMemo(() => applyFilters(activeAtrasadas), [activeAtrasadas, applyFilters]);
  const hojeFiltered = useMemo(() => applyFilters(activeHoje), [activeHoje, applyFilters]);
  const amanhaFiltered = useMemo(() => applyFilters(activeAmanha), [activeAmanha, applyFilters]);
  const proximasFiltered = useMemo(() => applyFilters(activeProximas), [activeProximas, applyFilters]);

  const showDateColumns = statusFilter === 'Todas' || statusFilter === 'Agendada';

  const unifiedFilteredVisitas = useMemo(() => {
    if (showDateColumns) return [];
    const filtered = applyFilters(activeRaw);
    return [...filtered].sort((a, b) => {
      if (a.data_visita !== b.data_visita) {
        return b.data_visita.localeCompare(a.data_visita);
      }
      return b.horario.localeCompare(a.horario);
    });
  }, [showDateColumns, applyFilters, activeRaw]);

  // Agrupar as próximas visitas por data
  const proximasGroupedByDate = useMemo(() => {
    const groups: Record<string, Visita[]> = {};
    proximasFiltered.forEach((v) => {
      if (!groups[v.data_visita]) {
        groups[v.data_visita] = [];
      }
      groups[v.data_visita].push(v);
    });
    return Object.keys(groups)
      .sort()
      .map((date) => ({
        date,
        visitas: groups[date],
      }));
  }, [proximasFiltered]);

  // KPIs
  const totalHoje = activeHoje.filter((v) => v.status_visita === 'Agendada').length;
  const materiaisPendentesCount = activeRaw.filter(
    (v) => !v.material_usado || v.material_usado.length === 0
  ).length;
  const visitasExecutadas = activeRaw.filter((v) => v.status_visita !== 'Agendada').length;
  const taxaConclusao =
    activeRaw.length > 0 ? Math.round((visitasExecutadas / activeRaw.length) * 100) : 0;

  if (isLoading && isDbConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-400 font-medium">Carregando cronograma...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-7">
        
        <AgendaHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onAgendarClick={() => setIsAgendarModalOpen(true)}
          atrasadasCount={activeAtrasadas.length}
        />

        {/* Toast de Feedback */}
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 text-white text-sm font-bold ${
            toast.type === 'error' ? 'bg-rose-600 border border-rose-500' : 'bg-gray-900 border border-gray-800'
          }`}>
            {toast.type === 'error' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.msg}
          </div>
        )}

        {/* 1. Painel de Visitas em Atraso */}
        {showDateColumns && atrasadasFiltered.length > 0 && (
          <div className="bg-white border border-rose-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Cabeçalho do Painel */}
            <div className="flex items-center justify-between px-5 py-4 bg-rose-50 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-800">Visitas Técnicas em Atraso</h3>
                  <p className="text-[10px] text-rose-500 font-medium mt-0.5">Agendadas para datas passadas — ainda não foram concluídas ou canceladas</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-rose-100 border border-rose-200 text-rose-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                {atrasadasFiltered.length} {atrasadasFiltered.length === 1 ? 'atraso' : 'atrasos'}
              </span>
            </div>

            {/* Tabela de Atrasos */}
            <div className="divide-y divide-rose-50">
              {atrasadasFiltered.map((v) => {
                const clienteNome = v.projects?.leads?.nome || v.cliente || '—';
                const endereco = v.projects?.endereco || v.endereco || '—';
                const tecnicoNome = v.responsaveis_tecnicos?.nome || (v.tecnico_id ? 'Técnico #' + v.tecnico_id.slice(0, 6) : 'Não definido');
                const tecnicoTelefone =
                  v.responsaveis_tecnicos?.telefone ||
                  (v.tecnico_id === 't1' ? '(41) 98888-1234' :
                   v.tecnico_id === 't2' ? '(41) 97777-5678' :
                   v.tecnico_id === 't3' ? '(41) 99999-1111' : null);
                const dateParts = (v.data_visita || '').split('-');
                const [yr, mo, dy] = dateParts.length === 3 ? dateParts : ['', '', ''];
                const dataFormatada = yr && mo && dy ? `${dy}/${mo}/${yr}` : '—';
                const hora = v.horario?.substring(0, 5) || '—';
                
                // Calcular dias de atraso
                const hoje = new Date();
                const dataVisita = yr && mo && dy ? new Date(Number(yr), Number(mo) - 1, Number(dy)) : null;
                const diasAtraso = dataVisita ? Math.floor((hoje.getTime() - dataVisita.getTime()) / (1000 * 60 * 60 * 24)) : 0;

                return (
                  <div
                    key={v.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4 hover:bg-rose-50/40 transition-colors group"
                  >
                    {/* Badge de data/hora */}
                    <div className="flex items-center justify-between md:block shrink-0 md:text-center min-w-[72px]">
                      <div className="bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-2 text-center w-full md:w-auto">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">{dataFormatada}</p>
                        <p className="text-sm font-black text-rose-700 font-mono leading-none mt-0.5">{hora}</p>
                        <p className="text-[8px] text-rose-400 font-semibold mt-0.5">hs</p>
                      </div>
                      
                      {/* Badge de atraso no mobile (ao lado da data) */}
                      <span className="md:hidden text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-full">
                        +{diasAtraso}d
                      </span>
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 md:gap-y-1">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Cliente</p>
                        <p className="text-sm font-black text-gray-900 break-words md:truncate">{clienteNome}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Endereço / Obra</p>
                        <p className="text-xs text-gray-600 break-words md:truncate">{endereco}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Técnico Responsável</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-sm">
                            {tecnicoNome.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-rose-700 bg-rose-50/80 border border-rose-100 px-2.5 py-0.5 rounded-md break-words md:truncate">
                            {tecnicoNome}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badge de atraso + ações */}
                    <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 border-t border-rose-100/50 md:border-t-0 pt-3 md:pt-0">
                      {/* Badge de atraso no desktop */}
                      <span className="hidden md:inline-block text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-full">
                        +{diasAtraso}d
                      </span>
                      {tecnicoTelefone && (
                        <button
                          onClick={() => {
                            const cleanPhone = tecnicoTelefone.replace(/\D/g, '');
                            const phoneWithCountry = cleanPhone.length === 10 || cleanPhone.length === 11 
                              ? `55${cleanPhone}` 
                              : cleanPhone;

                            const text = `Olá *${tecnicoNome}*,\n\nPassando para lembrar que você tem uma visita técnica *ATRASADA* pendente:\n\n*Cliente:* ${clienteNome}\n*Data Original:* ${dataFormatada}\n*Horário:* ${hora} hs\n*Endereço:* ${endereco}\n${v.observacoes ? `*Observações:* ${v.observacoes}\n` : ''}\nPor favor, atualize o status ou regularize a visita no CRM.`;

                            const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`;
                            window.open(url, '_blank');
                          }}
                          title="Alertar Instalador via WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-emerald-600 hover:text-emerald-700 transition-all cursor-pointer inline-flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.46 3.426 1.265 4.887l-1.272 4.654 4.761-1.248c1.411.769 3.012 1.207 4.71 1.207 5.517 0 9.996-4.478 9.996-9.996S17.52 2 12.004 2zm5.008 14.337c-.205.577-1.011 1.103-1.602 1.173-.4.048-.922.072-1.485-.11-3.567-1.157-5.908-4.757-6.086-4.992-.178-.235-1.442-1.92-1.442-3.66 0-1.739.905-2.595 1.226-2.946.321-.351.7-.439.932-.439.234 0 .468.002.671.012.208.01.49-.078.766.592.28.681.959 2.333 1.042 2.499.083.165.138.358.028.577-.11.22-.165.358-.33.55-.165.193-.346.43-.495.577-.165.165-.337.345-.145.676.193.33.856 1.411 1.834 2.285.836.745 1.542.977 1.872 1.143.33.165.522.138.718-.087.195-.226.837-.977 1.06-1.312.22-.335.439-.28.742-.165.303.116 1.925.909 2.256 1.074.33.165.55.247.629.385.08.138.08.799-.125 1.376z"/>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(v)}
                        title="Editar / Regularizar"
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-400 hover:text-orange-500 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir a visita de ${clienteNome} (${dataFormatada})?`)) {
                            handleDeleteVisita(v.id);
                          }
                        }}
                        title="Excluir Visita"
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 border border-gray-200 hover:border-rose-300 text-gray-400 hover:text-rose-500 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!showDateColumns ? (
          <div className="bg-white border border-gray-150 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  statusFilter === 'Realizada' ? 'bg-emerald-500' :
                  statusFilter === 'Cancelada' ? 'bg-rose-500' :
                  'bg-rose-600 animate-pulse'
                }`} />
                <h2 className="text-xl font-black text-gray-900">
                  {statusFilter === 'Realizada' ? 'Visitas Realizadas' :
                   statusFilter === 'Cancelada' ? 'Visitas Canceladas' :
                   'Visitas em Atraso'}
                </h2>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                statusFilter === 'Realizada' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                statusFilter === 'Cancelada' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                'bg-rose-50 border-rose-200 text-rose-600'
              }`}>
                {unifiedFilteredVisitas.length} {unifiedFilteredVisitas.length === 1 ? 'visita' : 'visitas'}
              </span>
            </div>

            <div className="space-y-3">
              {unifiedFilteredVisitas.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic text-sm">
                  Nenhuma visita encontrada com este status.
                </div>
              ) : (
                unifiedFilteredVisitas.map((v) => (
                  <VisitaCard
                    key={v.id}
                    visita={v}
                    onOpenModal={handleOpenModal}
                    onDelete={handleDeleteVisita}
                    showDate={true}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {/* 2. Grid de Agendamento (Hoje e Amanhã) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna 1: Hoje */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visitas de Hoje</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 mt-1">
                      Hoje, <span className="text-orange-500">{getFormattedHeaderDate(hojeStr)}</span>
                    </h2>
                  </div>
                  <span className="text-[10px] font-black bg-orange-50 border border-orange-200 text-orange-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {hojeFiltered.length} {hojeFiltered.length === 1 ? 'Agendamento' : 'Agendamentos'}
                  </span>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {hojeFiltered.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 italic text-sm">
                      Nenhuma visita agendada para hoje.
                    </div>
                  ) : (
                    hojeFiltered.map((v) => (
                      <VisitaCard key={v.id} visita={v} onOpenModal={handleOpenModal} onDelete={handleDeleteVisita} />
                    ))
                  )}
                </div>
              </div>

              {/* Coluna 2: Amanhã */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visitas de Amanhã</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 mt-1">
                      Amanhã, <span className="text-blue-500">{getFormattedHeaderDate(amanhaStr)}</span>
                    </h2>
                  </div>
                  <span className="text-[10px] font-black bg-blue-50 border border-blue-200 text-blue-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {amanhaFiltered.length} {amanhaFiltered.length === 1 ? 'Agendamento' : 'Agendamentos'}
                  </span>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {amanhaFiltered.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 italic text-sm">
                      Nenhuma visita agendada para amanhã.
                    </div>
                  ) : (
                    amanhaFiltered.map((v) => (
                      <VisitaCard key={v.id} visita={v} onOpenModal={handleOpenModal} onDelete={handleDeleteVisita} />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 3. Lista de Próximas */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <h2 className="text-base font-black text-gray-900">Cronograma de Próximas Visitas</h2>
                </div>
                <span className="text-[10px] font-black bg-purple-50 border border-purple-200 text-purple-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {proximasFiltered.length} {proximasFiltered.length === 1 ? 'Visita' : 'Visitas'}
                </span>
              </div>

              <div className="space-y-6">
                {proximasGroupedByDate.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 italic text-sm">
                    Nenhuma outra visita futura agendada.
                  </div>
                ) : (
                  proximasGroupedByDate.map((group) => (
                    <div key={group.date} className="space-y-3">
                      <div className="flex items-center gap-2 pt-2 pb-1 border-b border-gray-100/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <h3 className="text-xs font-black text-purple-700 tracking-wide uppercase">
                          {getFormattedFullDateWithDayOfWeek(group.date)}
                        </h3>
                      </div>
                      <div className="space-y-3 pl-4 border-l-2 border-purple-100/60">
                        {group.visitas.map((v) => (
                          <VisitaCard key={v.id} visita={v} onOpenModal={handleOpenModal} onDelete={handleDeleteVisita} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal de Edição */}
        {isModalOpen && selectedVisita && (
          <ModalPreenchimentoVisita
            isOpen={isModalOpen}
            visita={selectedVisita}
            onClose={handleCloseModal}
            onSave={handleSaveReport}
            isSaving={isUpdating}
            onDelete={handleDeleteVisita}
          />
        )}

        {/* Modal de Agendamento */}
        {isAgendarModalOpen && (
          <ModalAgendamentoVisita
            isOpen={isAgendarModalOpen}
            onClose={() => setIsAgendarModalOpen(false)}
            onSave={handleScheduleVisita}
            isSaving={isCreating}
          />
        )}
      </div>
    </div>
  );
}
