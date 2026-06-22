'use client';

import React, { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project, Visita } from '@/types/database.types';

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
  { id: 'p1', lead_id: 'l1', status_projeto: 'Instalação', endereco: 'Rua das Palmeiras, 405 - Cond. Royal - Curitiba', valor_total: 12500, criado_em: '2026-06-10T00:00:00Z', leads: { id: 'l1', nome: 'Roberto Mendonça', email: 'roberto@email.com', telefone: '(41) 99999-1111', cidade: 'Curitiba', area_m2: 80, status: 'Qualificado', criado_em: '2026-06-08T00:00:00Z', numero: '405', tipo_servico: 'Aquecimento de piso' } },
  { id: 'p2', lead_id: 'l2', status_projeto: 'Preparação', endereco: 'Av. Batel, 1200 - Apto 402 - Curitiba', valor_total: 8000, criado_em: '2026-06-12T00:00:00Z', leads: { id: 'l2', nome: 'Clarice Lispector', email: 'clarice@email.com', telefone: '(41) 99999-2222', cidade: 'Curitiba', area_m2: 45, status: 'Qualificado', criado_em: '2026-06-11T00:00:00Z', numero: '1200 A', tipo_servico: 'Limpeza de placas Solares' } },
  { id: 'p3', lead_id: 'l3', status_projeto: 'Orçamento', endereco: 'Rua Desembargador Motta, 882 - Mercês', valor_total: 15400, criado_em: '2026-06-15T00:00:00Z', leads: { id: 'l3', nome: 'Julio Cortázar', email: 'julio@email.com', telefone: '(41) 99999-3333', cidade: 'Curitiba', area_m2: 110, status: 'Qualificado', criado_em: '2026-06-14T00:00:00Z', numero: '882', tipo_servico: 'Instalação Sistemas Solares' } },
  { id: 'p4', lead_id: 'l4', status_projeto: 'Teste de Carga', endereco: 'Al. Julia da Costa, 150 - Cabral', valor_total: 9800, criado_em: '2026-06-16T00:00:00Z', leads: { id: 'l4', nome: 'Gabriel García Márquez', email: 'gabriel@email.com', telefone: '(41) 99999-4444', cidade: 'Curitiba', area_m2: 60, status: 'Qualificado', criado_em: '2026-06-15T00:00:00Z', numero: '150', tipo_servico: 'Carregamento Veicular' } },
];

const MOCK_FALLBACK_VISITAS: Partial<Visita>[] = [
  {
    id: 'v1',
    project_id: 'p1',
    data_visita: '2026-06-12',
    horario: '09:00',
    status_visita: 'Realizada',
    material_usado: ['Cabo Calefator 15W', 'Termostato Wifi Black', 'Fita de Fixação Metálica'],
    valor_gasto: 480.00,
    observacoes: 'Instalação da malha radiante no banheiro concluída e testada a continuidade.',
    responsaveis_tecnicos: { id: 't1', nome: 'Carlos Eduardo Silva', email: 'carlos@email.com', telefone: '(41) 98888-1234', created_at: '' }
  },
  {
    id: 'v2',
    project_id: 'p1',
    data_visita: '2026-06-18',
    horario: '14:30',
    status_visita: 'Realizada',
    material_usado: ['Termostato Wifi Black', 'Sensores de Calefação'],
    valor_gasto: 150.00,
    observacoes: 'Ligação final do termostato e teste de aquecimento inicial do piso.',
    responsaveis_tecnicos: { id: 't2', nome: 'Fernanda Lima Souza', email: 'fernanda@email.com', telefone: '(41) 97777-5678', created_at: '' }
  }
];

export default function ProjectsKanban() {
  const { projects: dbProjects, isLoading, updateProjectStatus, deleteProject } = useProjects();
  const [localProjectsFallback, setLocalProjectsFallback] = useState<Project[]>(MOCK_FALLBACK_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Abas: 'andamento' (Kanban com as 4 colunas) ou 'concluidos' (Histórico e concluídos)
  const [activeTab, setActiveTab] = useState<'andamento' | 'concluidos'>('andamento');
  
  // Estado para o histórico do projeto selecionado
  const [selectedProjectForHistory, setSelectedProjectForHistory] = useState<Project | null>(null);

  // Toast de feedback
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isDbConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
  
  const listProjects = isDbConfigured ? dbProjects : localProjectsFallback;

  // Filtra projetos órfãos e aplica busca de texto
  const filteredProjects = listProjects.filter((project) => {
    // Apenas projetos que possuem um lead ativo
    if (!project.leads) return false;
    
    const nome = project.leads.nome.toLowerCase();
    const endereco = project.endereco.toLowerCase();
    const query = searchTerm.toLowerCase();
    return nome.includes(query) || endereco.includes(query);
  });

  const handleMoveProject = async (projectId: string, newStage: StageType) => {
    try {
      if (isDbConfigured) {
        await updateProjectStatus({ id: projectId, status_projeto: newStage });
      } else {
        setLocalProjectsFallback((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, status_projeto: newStage } : p))
        );
      }
      showToast(`Projeto movido para: ${newStage}`);
    } catch (err: any) {
      showToast(err.message || 'Erro ao mover projeto.', 'error');
    }
  };

  const handleDeleteProject = async (projectId: string, clientName: string) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o projeto de "${clientName}"?\nEsta ação excluirá permanentemente o projeto e todas as visitas técnicas atreladas a ele.`
      )
    ) {
      try {
        if (isDbConfigured) {
          await deleteProject(projectId);
        } else {
          setLocalProjectsFallback((prev) => prev.filter((p) => p.id !== projectId));
        }
        showToast('Projeto e visitas associadas excluídos!');
      } catch (err: any) {
        showToast(err.message || 'Erro ao excluir projeto.', 'error');
      }
    }
  };

  const totalFaturamento = listProjects.filter(p => !!p.leads).reduce((acc, p) => acc + p.valor_total, 0);
  const totalEmAndamento = listProjects.filter((p) => !!p.leads && ['Orçamento', 'Preparação', 'Instalação', 'Teste de Carga'].includes(p.status_projeto)).length;
  const totalConcluidos = listProjects.filter((p) => !!p.leads && p.status_projeto === 'Concluído').length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-7">

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
              className="w-full bg-white border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all shadow-sm font-medium"
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-default">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Portfólio Total</p>
            <h3 className="text-2xl font-black text-orange-500 mt-2 font-mono">
              R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">Valor acumulado de contratos ativos</p>
          </div>
          
          <div 
            onClick={() => setActiveTab('andamento')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
              activeTab === 'andamento' 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-900 border-gray-100'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'andamento' ? 'text-orange-100' : 'text-gray-400'}`}>Obras em Andamento</p>
            <h3 className="text-2xl font-black mt-2">{totalEmAndamento}</h3>
            <p className={`text-[10px] mt-1 ${activeTab === 'andamento' ? 'text-orange-100' : 'text-gray-400'}`}>Preparação, instalação e teste (Clique para ver)</p>
          </div>

          <div 
            onClick={() => setActiveTab('concluidos')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
              activeTab === 'concluidos' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/10' 
                : 'bg-white text-gray-900 border-gray-100'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'concluidos' ? 'text-emerald-100' : 'text-gray-400'}`}>Instalações Concluídas</p>
            <h3 className="text-2xl font-black mt-2">{totalConcluidos}</h3>
            <p className={`text-[10px] mt-1 ${activeTab === 'concluidos' ? 'text-emerald-100' : 'text-gray-400'}`}>Pisos entregues e certificados (Clique para ver)</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('andamento')}
            className={`px-6 py-3 font-black text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'andamento'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Obras em Andamento (Kanban)
          </button>
          <button
            onClick={() => setActiveTab('concluidos')}
            className={`px-6 py-3 font-black text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'concluidos'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Instalações Concluídas ({totalConcluidos})
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-400 font-medium">Carregando projetos...</span>
          </div>
        ) : activeTab === 'andamento' ? (
          /* Kanban Board (Sem a coluna "Concluído") */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
            {KANBAN_STAGES.slice(0, 4).map((stage) => {
              const stageProjects = filteredProjects.filter((p) => p.status_projeto === stage);
              const colors = STAGE_COLORS[stage];

              return (
                <div key={stage} className="bg-white border border-gray-100 rounded-2xl min-w-[240px] flex flex-col shadow-sm overflow-hidden">
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
                  <div className="flex flex-col gap-3 p-3 min-h-[350px]">
                    {stageProjects.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 text-xs italic">
                        Sem obras
                      </div>
                    ) : (
                      stageProjects.map((project) => {
                        const clienteNome = project.leads?.nome || 'Sem Nome';
                        const currentIdx = KANBAN_STAGES.indexOf(stage);

                        return (
                          <div
                            key={project.id}
                            className="bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-white p-4 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-all group relative"
                          >
                            {/* Botão de Exclusão */}
                            <button
                              onClick={() => handleDeleteProject(project.id, clienteNome)}
                              title="Excluir Projeto"
                              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 pr-6">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                                  {clienteNome.charAt(0)}
                                </div>
                                <h5 className="font-black text-gray-900 text-sm group-hover:text-orange-600 transition-colors leading-tight truncate">
                                  {clienteNome}
                                </h5>
                              </div>
                              <p className="text-[10px] text-gray-400 leading-snug pl-8 pr-2 break-words line-clamp-2">{project.endereco}</p>
                              
                              {/* Tipo de serviço */}
                              {project.leads?.tipo_servico && (
                                <div className="pl-8 pt-1">
                                  <span className="inline-block text-[8px] font-bold bg-orange-50 border border-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">
                                    {project.leads.tipo_servico}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                              <span className="text-xs font-black text-orange-500 font-mono">
                                R$ {project.valor_total.toLocaleString('pt-BR')}
                              </span>
                              
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedProjectForHistory(project)}
                                  title="Ver Histórico da Obra"
                                  className="w-6 h-6 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-400 hover:text-orange-500 cursor-pointer flex items-center justify-center transition-colors text-xs"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </button>
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
                                <button
                                  type="button"
                                  onClick={() => handleMoveProject(project.id, KANBAN_STAGES[currentIdx + 1])}
                                  title={currentIdx === 3 ? "Concluir Obra" : "Avançar etapa"}
                                  className={`w-6 h-6 border rounded-lg text-white cursor-pointer flex items-center justify-center transition-colors text-xs font-bold shadow-sm ${
                                    currentIdx === 3
                                      ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-400 shadow-emerald-500/20'
                                      : 'bg-orange-500 hover:bg-orange-600 border-orange-400 shadow-orange-500/20'
                                  }`}
                                >
                                  {currentIdx === 3 ? '✓' : '→'}
                                </button>
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
        ) : (
          /* Aba 2: Instalações Concluídas */
          <div className="bg-white border border-gray-150 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div>
                <h2 className="text-xl font-black text-gray-900">Histórico de Obras Concluídas</h2>
                <p className="text-xs text-gray-400">Clique em qualquer obra concluída para visualizar o relatório histórico e financeiro completo.</p>
              </div>
              <span className="text-xs font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">
                {filteredProjects.filter(p => p.status_projeto === 'Concluído').length} Concluídas
              </span>
            </div>

            {filteredProjects.filter(p => p.status_projeto === 'Concluído').length === 0 ? (
              <div className="text-center py-16 text-gray-400 italic text-sm">
                Nenhum projeto concluído encontrado. Finalize uma obra no Kanban para listá-la aqui.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects
                  .filter((p) => p.status_projeto === 'Concluído')
                  .map((project) => {
                    const clienteNome = project.leads?.nome || 'Sem Nome';
                    return (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProjectForHistory(project)}
                        className="bg-gray-50 hover:bg-white border border-gray-100 hover:border-emerald-300 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 relative group flex flex-col justify-between"
                      >
                        {/* Botão de Exclusão */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Evita abrir o histórico
                            handleDeleteProject(project.id, clienteNome);
                          }}
                          title="Excluir Obra"
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2.5 pr-8">
                            <div className="w-7 h-7 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                              ✓
                            </div>
                            <div>
                              <h4 className="font-black text-gray-900 group-hover:text-emerald-600 transition-colors leading-tight">
                                {clienteNome}
                              </h4>
                              {project.leads?.tipo_servico && (
                                <span className="inline-block text-[8px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase mt-0.5">
                                  {project.leads.tipo_servico}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-400 leading-relaxed pr-2">{project.endereco}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Valor Contratado</span>
                            <span className="text-sm font-black text-emerald-600 font-mono">
                              R$ {project.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveProject(project.id, 'Teste de Carga');
                              }}
                              title="Retornar para Teste de Carga"
                              className="px-2.5 py-1.5 bg-white border border-gray-200 hover:border-orange-300 text-gray-500 hover:text-orange-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                            >
                              ← Reabrir
                            </button>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors self-end">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Modal de Histórico da Obra */}
        {selectedProjectForHistory && (
          <ModalHistoricoObra
            isOpen={!!selectedProjectForHistory}
            onClose={() => setSelectedProjectForHistory(null)}
            project={selectedProjectForHistory}
            isDbConfigured={isDbConfigured}
          />
        )}

      </div>
    </div>
  );
}

/* Componente Modal de Histórico da Obra */
interface ModalHistoricoObraProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  isDbConfigured: boolean;
}

function ModalHistoricoObra({ isOpen, onClose, project, isDbConfigured }: ModalHistoricoObraProps) {
  const [visits, setVisits] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');

    if (!isDbConfigured) {
      // Mock fallback local
      const mockVisits = MOCK_FALLBACK_VISITAS.filter(v => v.project_id === project.id);
      setVisits(mockVisits as Visita[]);
      setLoading(false);
      return;
    }

    // Carregar via visitasService
    import('@/services/visitasService').then(({ visitasService }) => {
      visitasService.getVisitasByProjectId(project.id)
        .then((data) => {
          setVisits(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('Erro ao carregar histórico de visitas técnicas.');
          setLoading(false);
        });
    });
  }, [isOpen, project.id, isDbConfigured]);

  if (!isOpen) return null;

  const totalGastoVisitas = visits.reduce((acc, v) => acc + (v.valor_gasto || 0), 0);
  const margemBruta = project.valor_total - totalGastoVisitas;
  const porcentagemMargem = project.valor_total > 0 ? Math.round((margemBruta / project.valor_total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />

      <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0">
          <div>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Histórico Completo da Obra
            </span>
            <h3 className="text-xl font-black text-gray-900 mt-1.5">{project.leads?.nome || 'Cliente Desconhecido'}</h3>
            <p className="text-xs text-gray-400 leading-snug mt-0.5">{project.endereco}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 transition-colors p-1.5 rounded-xl hover:bg-gray-50 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Card Detalhado do Contrato / Financeiro */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 border border-gray-100 p-4.5 rounded-2xl">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Valor do Contrato</span>
              <p className="text-base font-black text-emerald-600 font-mono">
                R$ {project.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-1 border-l border-gray-200 pl-4">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Despesas de Campo</span>
              <p className="text-base font-black text-rose-500 font-mono">
                R$ {totalGastoVisitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-1 border-l border-gray-200 pl-4">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Saldo / Margem</span>
              <p className={`text-base font-black font-mono ${margemBruta >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                R$ {margemBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                <span className="text-[10px] font-bold block">({porcentagemMargem}%)</span>
              </p>
            </div>
          </div>

          {/* Dados do Cliente e Obra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-100 p-4.5 rounded-2xl">
            <div className="space-y-2 text-xs">
              <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Detalhes de Contato</p>
              {project.leads?.email && <p className="text-gray-700"><strong>E-mail:</strong> {project.leads.email}</p>}
              <p className="text-gray-700"><strong>WhatsApp:</strong> {project.leads?.telefone || 'Não cadastrado'}</p>
              <p className="text-gray-700"><strong>Cidade:</strong> {project.leads?.cidade || 'Não informada'}</p>
            </div>
            <div className="space-y-2 text-xs border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4">
              <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Especificações</p>
              {project.leads?.tipo_servico && <p className="text-gray-700"><strong>Serviço:</strong> <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{project.leads.tipo_servico}</span></p>}
              {project.leads?.area_m2 && <p className="text-gray-700"><strong>Área Contratada:</strong> {project.leads.area_m2} m²</p>}
              {project.leads?.cep && <p className="text-gray-700"><strong>CEP Obra:</strong> {project.leads.cep}</p>}
            </div>
          </div>

          {/* Cronograma / Linha do Tempo */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">Linha do Tempo das Visitas Técnicas</h4>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl text-center">
                {error}
              </div>
            ) : visits.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl text-gray-300 text-xs italic">
                Nenhuma visita técnica registrada para esta obra ainda.
              </div>
            ) : (
              <div className="relative border-l-2 border-emerald-100 pl-5 ml-3 space-y-7">
                {visits.map((v) => {
                  const dataParts = (v.data_visita || '').split('-');
                  const [yr, mo, dy] = dataParts.length === 3 ? dataParts : ['', '', ''];
                  const dataFormatada = yr && mo && dy ? `${dy}/${mo}/${yr}` : '—';
                  const hora = v.horario ? v.horario.substring(0, 5) : '—';
                  const tecnicoNome = v.responsaveis_tecnicos?.nome || 'Técnico Não Definido';

                  return (
                    <div key={v.id} className="relative group">
                      
                      {/* Ponto da Linha do Tempo */}
                      <span className={`absolute -left-[27px] top-0 w-3 h-3 rounded-full border-2 border-white ring-4 ring-white shadow-sm flex items-center justify-center ${
                        v.status_visita === 'Realizada' ? 'bg-emerald-500' :
                        v.status_visita === 'Cancelada' ? 'bg-rose-500' :
                        'bg-amber-400'
                      }`} />

                      {/* Conteúdo */}
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-2 group-hover:bg-white group-hover:border-emerald-200 transition-all duration-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-mono font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-lg shadow-sm">
                              {dataFormatada} às {hora} hs
                            </span>
                            <span className="text-xs text-gray-400 font-bold ml-2">por {tecnicoNome}</span>
                          </div>
                          
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            v.status_visita === 'Realizada' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            v.status_visita === 'Cancelada' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                            'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            {v.status_visita}
                          </span>
                        </div>

                        {/* Observações */}
                        {v.observacoes && (
                          <p className="text-xs text-gray-600 italic bg-white border border-gray-50 p-2.5 rounded-xl">
                            &ldquo;{v.observacoes}&rdquo;
                          </p>
                        )}

                        {/* Materiais Utilizados */}
                        {v.material_usado && v.material_usado.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Materiais Empregados:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {v.material_usado.map((mat, i) => (
                                <span key={i} className="text-[9px] font-bold bg-emerald-50/50 border border-emerald-100/50 text-emerald-800 px-2 py-0.5 rounded-full">
                                  {mat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Valor Gasto na Visita */}
                        {v.valor_gasto > 0 && (
                          <div className="flex justify-end pt-1">
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50/50 border border-rose-100/50 px-2 py-0.5 rounded-lg font-mono">
                              Custo Extra: R$ {v.valor_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-black text-sm rounded-xl transition-all cursor-pointer shadow-md"
          >
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
}
