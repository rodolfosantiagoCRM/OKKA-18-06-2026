'use client';

import React, { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';
import { Lead } from '@/types/database.types';

// Dados simulados para fallback (mockup interativo se o banco estiver vazio)
const MOCK_FALLBACK_LEADS: Lead[] = [
  {
    id: 'l1',
    nome: 'Roberto Mendonça',
    email: 'roberto@email.com',
    telefone: '(41) 99999-1111',
    cidade: 'Curitiba',
    area_m2: 80,
    status: 'Qualificado',
    criado_em: '2026-06-08T14:30:00Z',
  },
  {
    id: 'l2',
    nome: 'Clarice Lispector',
    email: 'clarice@email.com',
    telefone: '(41) 99999-2222',
    cidade: 'Curitiba',
    area_m2: 45,
    status: 'Novo',
    criado_em: '2026-06-11T09:15:00Z',
  },
  {
    id: 'l3',
    nome: 'Julio Cortázar',
    email: 'julio@email.com',
    telefone: '(41) 99999-3333',
    cidade: 'Curitiba',
    area_m2: 110,
    status: 'Em Contato',
    criado_em: '2026-06-14T11:00:00Z',
  },
  {
    id: 'l4',
    nome: 'Gabriel García Márquez',
    email: 'gabriel@email.com',
    telefone: '(41) 99999-4444',
    cidade: 'Curitiba',
    area_m2: 60,
    status: 'Novo',
    criado_em: '2026-06-15T16:20:00Z',
  },
  {
    id: 'l5',
    nome: 'Jorge Luis Borges',
    email: 'borges@email.com',
    telefone: '(11) 98888-5555',
    cidade: 'São Paulo',
    area_m2: 150,
    status: 'Perdido',
    criado_em: '2026-06-05T10:00:00Z',
  },
  {
    id: 'l6',
    nome: 'Machado de Assis',
    email: 'machado@email.com',
    telefone: '(21) 97777-6666',
    cidade: 'Rio de Janeiro',
    area_m2: 95,
    status: 'Novo',
    criado_em: '2026-06-16T18:45:00Z',
  }
];

export default function LeadsDashboard() {
  const { leads: dbLeads, isLoading, createLead } = useLeads();
  const { createProject, isCreating } = useProjects();

  // Estados locais para controle de dados (mock fallback)
  const [localLeadsFallback, setLocalLeadsFallback] = useState<Lead[]>(MOCK_FALLBACK_LEADS);
  const isDbConfigured = dbLeads.length > 0;
  const listLeads = isDbConfigured ? dbLeads : localLeadsFallback;

  // Estados locais de interface (filtros, busca e paginação)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Estados do modal de qualificação
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectAddress, setProjectAddress] = useState('');
  const [projectValue, setProjectValue] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Filtragem dos dados
  const filteredLeads = listLeads.filter((lead) => {
    const matchesSearch =
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm);

    const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleOpenQualifyModal = (lead: Lead) => {
    setSelectedLead(lead);
    setProjectAddress(`${lead.cidade} - PR, Brasil`); // Sugestão base
    setProjectValue('15000'); // Sugestão padrão
    setIsModalOpen(true);
  };

  const handleCloseQualifyModal = () => {
    setSelectedLead(null);
    setProjectAddress('');
    setProjectValue('');
    setIsModalOpen(false);
  };

  // Submissão do Formulário de Qualificação e Criação de Projeto
  const handleQualifyLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setLoadingAction(true);
    try {
      if (isDbConfigured) {
        // 1. Cria o Projeto vinculado a este Lead no Supabase
        await createProject({
          lead_id: selectedLead.id,
          endereco: projectAddress,
          valor_total: parseFloat(projectValue) || 0,
          status_projeto: 'Orçamento'
        });
        
        // Em um app real, aqui faríamos um update na API de Leads para "Qualificado"
        // leadsService.updateLeadStatus(selectedLead.id, 'Qualificado')
      } else {
        // Mockup interativo local
        setLocalLeadsFallback((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, status: 'Qualificado' } : l))
        );
      }
      handleCloseQualifyModal();
    } catch (err) {
      console.error('Falha ao qualificar lead:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header da Tela */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestão de Leads</h1>
          <p className="text-sm text-slate-400 mt-1">
            Qualificação, triagem de contatos e criação automatizada de projetos.
          </p>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 p-4 border border-slate-850 rounded-xl">
          {/* Busca por Texto */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-3 top-3.5 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Volta para primeira página no filtro
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            />
          </div>

          {/* Filtro por Status (Tabs) */}
          <div className="flex gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-850 w-full md:w-auto overflow-x-auto">
            {['Todos', 'Novo', 'Em Contato', 'Qualificado', 'Perdido'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  statusFilter === status
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela Interativa de Leads */}
        <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-350">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-850 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Localização</th>
                  <th className="px-6 py-4">Área (m²)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                      Nenhum lead correspondente aos filtros foi localizado.
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-100">{lead.nome}</td>
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="text-xs text-slate-200">{lead.telefone}</div>
                        <div className="text-[10px] text-slate-500">{lead.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">{lead.cidade}</td>
                      <td className="px-6 py-4 font-mono text-slate-200">
                        {lead.area_m2 ? `${lead.area_m2} m²` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            lead.status === 'Novo'
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              : lead.status === 'Em Contato'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : lead.status === 'Qualificado'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {lead.status !== 'Qualificado' && lead.status !== 'Perdido' ? (
                          <button
                            onClick={() => handleOpenQualifyModal(lead)}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-md shadow-orange-500/10 transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            Qualificar
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Concluído</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação da Tabela */}
          {totalPages > 1 && (
            <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-t border-slate-850 text-xs">
              <span className="text-slate-500">
                Página <strong className="text-slate-350">{currentPage}</strong> de{' '}
                <strong className="text-slate-350">{totalPages}</strong> ({totalItems} leads)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded hover:border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer font-semibold"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded hover:border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer font-semibold"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Qualificação e Geração de Projeto */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={handleCloseQualifyModal} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
            
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Qualificar Lead</h3>
                <p className="text-xs text-slate-450 mt-1">Cliente: {selectedLead.nome}</p>
              </div>
              <button onClick={handleCloseQualifyModal} className="text-slate-500 hover:text-slate-350 transition-colors p-1 cursor-pointer">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleQualifyLead}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ao qualificar o lead, ele será marcado como **Qualificado** e um projeto de instalação de piso aquecido será gerado automaticamente para o técnico gerenciar.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="projectAddress" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Endereço da Obra</label>
                  <input
                    type="text"
                    id="projectAddress"
                    required
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                    placeholder="Ex: Av. Batel, 1200 - Apto 402 - Curitiba"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-650 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="projectValue" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valor Estimado do Projeto (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-500">R$</span>
                    <input
                      type="number"
                      id="projectValue"
                      required
                      min="0"
                      value={projectValue}
                      onChange={(e) => setProjectValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
                <button
                  type="button"
                  onClick={handleCloseQualifyModal}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-250 rounded-lg font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction || isCreating}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  {(loadingAction || isCreating) ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    'Gerar Projeto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
