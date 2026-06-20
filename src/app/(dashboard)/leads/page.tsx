'use client';

import React, { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';
import { Lead } from '@/types/database.types';

const MOCK_FALLBACK_LEADS: Lead[] = [
  { id: 'l1', nome: 'Roberto Mendonça', email: 'roberto@email.com', telefone: '(41) 99999-1111', cidade: 'Curitiba', area_m2: 80, status: 'Qualificado', criado_em: '2026-06-08T14:30:00Z' },
  { id: 'l2', nome: 'Clarice Lispector', email: 'clarice@email.com', telefone: '(41) 99999-2222', cidade: 'Curitiba', area_m2: 45, status: 'Novo', criado_em: '2026-06-11T09:15:00Z' },
  { id: 'l3', nome: 'Julio Cortázar', email: 'julio@email.com', telefone: '(41) 99999-3333', cidade: 'Curitiba', area_m2: 110, status: 'Em Contato', criado_em: '2026-06-14T11:00:00Z' },
  { id: 'l4', nome: 'Gabriel García Márquez', email: 'gabriel@email.com', telefone: '(41) 99999-4444', cidade: 'Curitiba', area_m2: 60, status: 'Novo', criado_em: '2026-06-15T16:20:00Z' },
  { id: 'l5', nome: 'Jorge Luis Borges', email: 'borges@email.com', telefone: '(11) 98888-5555', cidade: 'São Paulo', area_m2: 150, status: 'Perdido', criado_em: '2026-06-05T10:00:00Z' },
  { id: 'l6', nome: 'Machado de Assis', email: 'machado@email.com', telefone: '(21) 97777-6666', cidade: 'Rio de Janeiro', area_m2: 95, status: 'Novo', criado_em: '2026-06-16T18:45:00Z' },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Novo:          { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  'Em Contato':  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  Qualificado:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Perdido:       { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-400' },
};

export default function LeadsDashboard() {
  const { leads: dbLeads, isLoading, createLead } = useLeads();
  const { createProject, isCreating } = useProjects();

  const [localLeadsFallback, setLocalLeadsFallback] = useState<Lead[]>(MOCK_FALLBACK_LEADS);
  const isDbConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
  const listLeads = isDbConfigured ? dbLeads : localLeadsFallback;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectAddress, setProjectAddress] = useState('');
  const [projectValue, setProjectValue] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const filteredLeads = listLeads.filter((lead) => {
    const matchesSearch =
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm);
    const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleOpenQualifyModal = (lead: Lead) => {
    setSelectedLead(lead);
    setProjectAddress(`${lead.cidade} - PR, Brasil`);
    setProjectValue('15000');
    setIsModalOpen(true);
  };

  const handleCloseQualifyModal = () => {
    setSelectedLead(null);
    setProjectAddress('');
    setProjectValue('');
    setIsModalOpen(false);
  };

  const handleQualifyLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setLoadingAction(true);
    try {
      if (isDbConfigured) {
        await createProject({
          lead_id: selectedLead.id,
          endereco: projectAddress,
          valor_total: parseFloat(projectValue) || 0,
          status_projeto: 'Orçamento',
        });
      } else {
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

  const leadsNovos = listLeads.filter((l) => l.status === 'Novo').length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-7">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Pipeline
            </span>
            <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">Gestão de Leads</h1>
            <p className="text-sm text-gray-500 mt-1">Qualificação, triagem e criação automatizada de projetos.</p>
          </div>
          {leadsNovos > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold text-blue-700">{leadsNovos} novos aguardando</span>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
            />
          </div>

          <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-xl w-full md:w-auto overflow-x-auto">
            {['Todos', 'Novo', 'Em Contato', 'Qualificado', 'Perdido'].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  statusFilter === status
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Localização</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Área (m²)</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-gray-400 text-sm italic">
                      Nenhum lead correspondente aos filtros.
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => {
                    const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG['Novo'];
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                              {lead.nome.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-900">{lead.nome}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-gray-700">{lead.telefone}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{lead.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{lead.cidade}</td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-700">
                          {lead.area_m2 ? `${lead.area_m2} m²` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {lead.status !== 'Qualificado' && lead.status !== 'Perdido' ? (
                            <button
                              onClick={() => handleOpenQualifyModal(lead)}
                              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm shadow-orange-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              Qualificar
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300 italic font-medium">Concluído</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Página <strong className="text-gray-700">{currentPage}</strong> de{' '}
                <strong className="text-gray-700">{totalPages}</strong> ({totalItems} leads)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-orange-300 text-gray-600 hover:text-orange-600 disabled:opacity-30 cursor-pointer font-semibold text-xs transition-all"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-orange-300 text-gray-600 hover:text-orange-600 disabled:opacity-30 cursor-pointer font-semibold text-xs transition-all"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Qualificação */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={handleCloseQualifyModal} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-400" />

            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-gray-900">Qualificar Lead</h3>
                <p className="text-xs text-gray-400 mt-1">Cliente: <strong className="text-gray-700">{selectedLead.nome}</strong></p>
              </div>
              <button onClick={handleCloseQualifyModal} className="text-gray-300 hover:text-gray-600 transition-colors p-1 cursor-pointer rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleQualifyLead}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed bg-blue-50 border border-blue-100 p-3 rounded-xl">
                  Ao qualificar, um projeto de instalação será gerado automaticamente para gestão técnica.
                </p>
                <div className="space-y-1.5">
                  <label htmlFor="projectAddress" className="text-xs font-bold uppercase tracking-wider text-gray-500">Endereço da Obra</label>
                  <input
                    type="text"
                    id="projectAddress"
                    required
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                    placeholder="Ex: Av. Batel, 1200 - Apto 402 - Curitiba"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="projectValue" className="text-xs font-bold uppercase tracking-wider text-gray-500">Valor Estimado (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-gray-400">R$</span>
                    <input
                      type="number"
                      id="projectValue"
                      required
                      min="0"
                      value={projectValue}
                      onChange={(e) => setProjectValue(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button
                  type="button"
                  onClick={handleCloseQualifyModal}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction || isCreating}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-black text-sm transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2"
                >
                  {(loadingAction || isCreating) ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Salvando...
                    </>
                  ) : 'Gerar Projeto →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
