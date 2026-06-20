'use client';

import React, { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types/database.types';

const KANBAN_STAGES = [
  'Orçamento',
  'Preparação',
  'Instalação',
  'Teste de Carga',
  'Concluído',
] as const;

type StageType = typeof KANBAN_STAGES[number];

const STAGE_COLORS: Record<StageType, { header: string; dot: string; badge: string }> = {
  'Orçamento':     { header: 'border-blue-300 bg-blue-50',    dot: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Preparação':    { header: 'border-amber-300 bg-amber-50',  dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Instalação':    { header: 'border-orange-300 bg-orange-50', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Teste de Carga':{ header: 'border-violet-300 bg-violet-50', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  'Concluído':     { header: 'border-emerald-300 bg-emerald-50', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const MOCK_FALLBACK_PROJECTS: Project[] = [
  { id: 'p1', lead_id: 'l1', status_projeto: 'Instalação', endereco: 'Rua das Palmeiras, 405 - Cond. Royal - Curitiba', valor_total: 12500, criado_em: '2026-06-10T00:00:00Z', leads: { id: 'l1', nome: 'Roberto Mendonça', email: 'roberto@email.com', telefone: '(41) 99999-1111', cidade: 'Curitiba', area_m2: 80, status: 'Qualificado', criado_em: '2026-06-08T00:00:00Z' } },
  { id: 'p2', lead_id: 'l2', status_projeto: 'Preparação', endereco: 'Av. Batel, 1200 - Apto 402 - Curitiba', valor_total: 8000, criado_em: '2026-06-12T00:00:00Z', leads: { id: 'l2', nome: 'Clarice Lispector', email: 'clarice@email.com', telefone: '(41) 99999-2222', cidade: 'Curitiba', area_m2: 45, status: 'Qualificado', criado_em: '2026-06-11T00:00:00Z' } },
  { id: 'p3', lead_id: 'l3', status_projeto: 'Orçamento', endereco: 'Rua Desembargador Motta, 882 - Mercês', valor_total: 15400, criado_em: '2026-06-15T00:00:00Z', leads: { id: 'l3', nome: 'Julio Cortázar', email: 'julio@email.com', telefone: '(41) 99999-3333', cidade: 'Curitiba', area_m2: 110, status: 'Qualificado', criado_em: '2026-06-14T00:00:00Z' } },
  { id: 'p4', lead_id: 'l4', status_projeto: 'Teste de Carga', endereco: 'Al. Julia da Costa, 150 - Cabral', valor_total: 9800, criado_em: '2026-06-16T00:00:00Z', leads: { id: 'l4', nome: 'Gabriel García Márquez', email: 'gabriel@email.com', telefone: '(41) 99999-4444', cidade: 'Curitiba', area_m2: 60, status: 'Qualificado', criado_em: '2026-06-15T00:00:00Z' } },
];

export default function ProjectsKanban() {
  const { projects: dbProjects, isLoading, updateProjectStatus } = useProjects();
  const [localProjectsFallback, setLocalProjectsFallback] = useState<Project[]>(MOCK_FALLBACK_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');

  const isDbConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
  const listProjects = isDbConfigured ? dbProjects : localProjectsFallback;

  const filteredProjects = listProjects.filter((project) => {
    const nome = project.leads?.nome || '';
    const endereco = project.endereco;
    return nome.toLowerCase().includes(searchTerm.toLowerCase()) || endereco.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleMoveProject = async (projectId: string, newStage: StageType) => {
    if (isDbConfigured) {
      await updateProjectStatus({ id: projectId, status_projeto: newStage });
    } else {
      setLocalProjectsFallback((prev) => prev.map((p) => (p.id === projectId ? { ...p, status_projeto: newStage } : p)));
    }
  };

  const totalFaturamento = listProjects.reduce((acc, p) => acc + p.valor_total, 0);
  const totalEmAndamento = listProjects.filter((p) => ['Preparação', 'Instalação', 'Teste de Carga'].includes(p.status_projeto)).length;
  const totalConcluidos = listProjects.filter((p) => p.status_projeto === 'Concluído').length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-7">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Obras
            </span>
            <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">Kanban de Obras</h1>
            <p className="text-sm text-gray-500 mt-1">Acompanhamento das instalações de malhas de aquecimento de piso.</p>
          </div>
          <div className="relative w-full md:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar projeto ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Portfólio Total</p>
            <h3 className="text-2xl font-black text-orange-500 mt-2">
              R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">Valor acumulado de contratos</p>
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Obras em Andamento</p>
            <h3 className="text-2xl font-black text-gray-900 mt-2">{totalEmAndamento}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Preparação, instalação e teste</p>
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Instalações Concluídas</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-2">{totalConcluidos}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Pisos entregues e certificados</p>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => {
            const stageProjects = filteredProjects.filter((p) => p.status_projeto === stage);
            const colors = STAGE_COLORS[stage];

            return (
              <div key={stage} className="bg-white border border-gray-100 rounded-2xl min-w-[220px] flex flex-col shadow-sm overflow-hidden">
                {/* Header da Coluna */}
                <div className={`flex justify-between items-center p-4 border-b-2 ${colors.header}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">{stage}</h4>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${colors.badge}`}>
                    {stageProjects.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3 p-3 min-h-[280px]">
                  {stageProjects.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-10 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 text-xs italic">
                      Vazio
                    </div>
                  ) : (
                    stageProjects.map((project) => {
                      const clienteNome = project.leads?.nome || 'Sem Nome';
                      const currentIdx = KANBAN_STAGES.indexOf(stage);

                      return (
                        <div
                          key={project.id}
                          className="bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-white p-4 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-all group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                                {clienteNome.charAt(0)}
                              </div>
                              <h5 className="font-black text-gray-900 text-sm group-hover:text-orange-600 transition-colors leading-tight">
                                {clienteNome}
                              </h5>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-snug pl-8">{project.endereco}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                            <span className="text-xs font-black text-orange-500">
                              R$ {project.valor_total.toLocaleString('pt-BR')}
                            </span>
                            <div className="flex gap-1">
                              {currentIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveProject(project.id, KANBAN_STAGES[currentIdx - 1])}
                                  title="Voltar etapa"
                                  className="w-6 h-6 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer flex items-center justify-center transition-colors text-xs font-bold"
                                >
                                  ←
                                </button>
                              )}
                              {currentIdx < KANBAN_STAGES.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveProject(project.id, KANBAN_STAGES[currentIdx + 1])}
                                  title="Avançar etapa"
                                  className="w-6 h-6 bg-orange-500 hover:bg-orange-600 border border-orange-400 rounded-lg text-white cursor-pointer flex items-center justify-center transition-colors text-xs font-bold shadow-sm shadow-orange-500/20"
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
