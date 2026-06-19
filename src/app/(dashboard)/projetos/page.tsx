'use client';

import React, { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types/database.types';

// Colunas do Kanban
const KANBAN_STAGES = [
  'Orçamento',
  'Preparação',
  'Instalação',
  'Teste de Carga',
  'Concluído',
] as const;

type StageType = typeof KANBAN_STAGES[number];

// Dados simulados para fallback (mockup se o banco estiver vazio)
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
    status_projeto: 'Preparação',
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
    status_projeto: 'Teste de Carga',
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

export default function ProjectsKanban() {
  const { projects: dbProjects, isLoading } = useProjects();
  const [localProjectsFallback, setLocalProjectsFallback] = useState<Project[]>(MOCK_FALLBACK_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');

  const isDbConfigured = dbProjects.length > 0;
  const listProjects = isDbConfigured ? dbProjects : localProjectsFallback;

  // Filtragem dos projetos baseada em busca
  const filteredProjects = listProjects.filter((project) => {
    const nome = project.leads?.nome || 'Sem Nome';
    const endereco = project.endereco;
    return (
      nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endereco.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Função para mover o card de coluna (mudar status do projeto)
  const handleMoveProject = async (projectId: string, newStage: StageType) => {
    if (isDbConfigured) {
      // Chamada real para atualizar no banco
      // await projectsService.updateProjectStatus(projectId, newStage)
      // Em produção, isso dispararia queryClient.invalidateQueries({ queryKey: ['projects'] })
    } else {
      // Atualização no estado local (Mockup)
      setLocalProjectsFallback((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status_projeto: newStage } : p))
      );
    }
  };

  // KPIs
  const totalFaturamento = listProjects.reduce((acc, p) => acc + p.valor_total, 0);
  const totalEmAndamento = listProjects.filter(
    (p) =>
      p.status_projeto === 'Preparação' ||
      p.status_projeto === 'Instalação' ||
      p.status_projeto === 'Teste de Carga'
  ).length;
  const totalConcluidos = listProjects.filter((p) => p.status_projeto === 'Concluído').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header e Subtítulo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Calefação - Kanban de Obras</h1>
            <p className="text-sm text-slate-400 mt-1">
              Acompanhamento de progresso de instalação das malhas de aquecimento.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <span className="absolute left-3 top-3 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar projeto por cliente ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-650 outline-none transition-all"
            />
          </div>
        </div>

        {/* KPIs superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Contratos Ativos</p>
            <h3 className="text-2xl font-extrabold text-orange-400 mt-1.5">
              R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Valor acumulado de projetos</p>
          </div>
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Obras em Andamento</p>
            <h3 className="text-2xl font-extrabold text-slate-200 mt-1.5">{totalEmAndamento}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Obras em preparação/instalação/teste</p>
          </div>
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Instalações Concluídas</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1.5">{totalConcluidos}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Pisos entregues e certificados</p>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => {
            const stageProjects = filteredProjects.filter((p) => p.status_projeto === stage);

            return (
              <div
                key={stage}
                className="bg-slate-900/50 border border-slate-850 rounded-xl p-4 min-w-[240px] flex flex-col space-y-4"
              >
                {/* Header da Coluna */}
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-350">{stage}</h4>
                  <span className="text-[10px] font-bold bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {stageProjects.length}
                  </span>
                </div>

                {/* Lista de Cards */}
                <div className="flex flex-col gap-3 min-h-[300px]">
                  {stageProjects.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-850 rounded-lg text-slate-650 text-xs italic">
                      Sem projetos
                    </div>
                  ) : (
                    stageProjects.map((project) => {
                      const clienteNome = project.leads?.nome || 'Sem Nome';
                      const currentIdx = KANBAN_STAGES.indexOf(stage);

                      return (
                        <div
                          key={project.id}
                          className="bg-slate-950 border border-slate-850 hover:border-slate-700 p-4 rounded-lg space-y-3 shadow transition-all group"
                        >
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-200 text-sm group-hover:text-orange-400 transition-colors">
                              {clienteNome}
                            </h5>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {project.endereco}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[11px] font-semibold">
                            <span className="text-orange-400">
                              R$ {project.valor_total.toLocaleString('pt-BR')}
                            </span>
                            
                            {/* Setas de Controle */}
                            <div className="flex gap-1.5">
                              {currentIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveProject(project.id, KANBAN_STAGES[currentIdx - 1])
                                  }
                                  title="Voltar etapa"
                                  className="w-5 h-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-center transition-colors"
                                >
                                  ←
                                </button>
                              )}
                              {currentIdx < KANBAN_STAGES.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveProject(project.id, KANBAN_STAGES[currentIdx + 1])
                                  }
                                  title="Avançar etapa"
                                  className="w-5 h-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-center transition-colors"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
