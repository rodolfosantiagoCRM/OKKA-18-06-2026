'use client';

import React, { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';
import { Lead } from '@/types/database.types';
import ModalCadastroLead from '@/components/crm/modal-cadastro-lead';
import { downloadCSV } from '@/lib/csvHelper';

const MOCK_FALLBACK_LEADS: Lead[] = [
  { id: 'l1', nome: 'Roberto Mendonça', email: 'roberto@email.com', telefone: '(41) 99999-1111', cidade: 'Curitiba', area_m2: 80, status: 'Qualificado', criado_em: '2026-06-08T14:30:00Z', cep: '80240-031' },
  { id: 'l2', nome: 'Clarice Lispector', email: 'clarice@email.com', telefone: '(41) 99999-2222', cidade: 'Curitiba', area_m2: 45, status: 'Novo', criado_em: '2026-06-11T09:15:00Z', cep: '80240-032' },
  { id: 'l3', nome: 'Julio Cortázar', email: 'julio@email.com', telefone: '(41) 99999-3333', cidade: 'Curitiba', area_m2: 110, status: 'Em Contato', criado_em: '2026-06-14T11:00:00Z', cep: '80240-033' },
  { id: 'l4', nome: 'Gabriel García Márquez', email: 'gabriel@email.com', telefone: '(41) 99999-4444', cidade: 'Curitiba', area_m2: 60, status: 'Novo', criado_em: '2026-06-15T16:20:00Z', cep: '80240-034' },
  { id: 'l5', nome: 'Jorge Luis Borges', email: 'borges@email.com', telefone: '(11) 98888-5555', cidade: 'São Paulo', area_m2: 150, status: 'Perdido', criado_em: '2026-06-05T10:00:00Z', cep: '01310-200' },
  { id: 'l6', nome: 'Machado de Assis', email: 'machado@email.com', telefone: '(21) 97777-6666', cidade: 'Rio de Janeiro', area_m2: 95, status: 'Novo', criado_em: '2026-06-16T18:45:00Z', cep: '22041-011' },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Novo:          { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  'Em Contato':  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  Qualificado:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Perdido:       { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-400' },
};

export default function LeadsDashboard() {
  const {
    leads: dbLeads,
    createLead,
    updateLeadStatus,
    isCreating: isCreatingLead,
    updateLead,
    isUpdatingLead,
    deleteLead
  } = useLeads();
  const { createProject, isCreating: isCreatingProject } = useProjects();

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

  // Novos estados para gerenciamento de CRM
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

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
    setProjectAddress(lead.endereco_obra || `${lead.cidade} - PR, Brasil`);
    setProjectValue('15000');
    setIsModalOpen(true);
  };

  const handleCloseQualifyModal = () => {
    setSelectedLead(null);
    setProjectAddress('');
    setProjectValue('');
    setIsModalOpen(false);
  };

  const handleOpenEditModal = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsAddLeadModalOpen(true);
  };

  const handleCloseAddLeadModal = () => {
    setIsAddLeadModalOpen(false);
    setLeadToEdit(null);
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
        await updateLeadStatus({ id: selectedLead.id, status: 'Qualificado' });
      } else {
        setLocalLeadsFallback((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, status: 'Qualificado' } : l))
        );
      }
      handleCloseQualifyModal();
    } catch (err) {
      console.error('Falha ao qualificar lead:', err);
      alert(err instanceof Error ? err.message : 'Erro ao qualificar lead.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSaveLead = async (leadData: {
    nome: string;
    email: string | null;
    telefone: string;
    cidade: string;
    area_m2: number | null;
    endereco_obra?: string | null;
    valor_estimado?: number | null;
    materiais_previstos?: string[] | null;
    observacoes?: string | null;
    status: Lead['status'];
    cep?: string | null;
    numero?: string | null;
    tipo_servico?: string | null;
  }) => {
    try {
      if (leadToEdit) {
        if (isDbConfigured) {
          await updateLead({ id: leadToEdit.id, updates: leadData });

          // Se o status mudou para 'Qualificado' e antes não era 'Qualificado', cria o projeto correspondente
          if (leadData.status === 'Qualificado' && leadToEdit.status !== 'Qualificado') {
            await createProject({
              lead_id: leadToEdit.id,
              endereco: leadData.endereco_obra || `${leadData.cidade} - PR, Brasil`,
              valor_total: leadData.valor_estimado || 0,
              status_projeto: 'Orçamento',
            });
          }
        } else {
          setLocalLeadsFallback((prev) =>
            prev.map((l) => (l.id === leadToEdit.id ? { ...l, ...leadData } : l))
          );
        }
      } else {
        if (isDbConfigured) {
          const newLead = await createLead(leadData);

          if (leadData.status === 'Qualificado') {
            await createProject({
              lead_id: newLead.id,
              endereco: leadData.endereco_obra || `${leadData.cidade} - PR, Brasil`,
              valor_total: leadData.valor_estimado || 0,
              status_projeto: 'Orçamento',
            });
          }
        } else {
          const newId = `l-local-${Date.now()}`;
          const newRecord: Lead = {
            id: newId,
            nome: leadData.nome,
            email: leadData.email,
            telefone: leadData.telefone,
            cidade: leadData.cidade,
            area_m2: leadData.area_m2,
            status: leadData.status,
            criado_em: new Date().toISOString(),
            endereco_obra: leadData.endereco_obra,
            valor_estimado: leadData.valor_estimado,
            materiais_previstos: leadData.materiais_previstos,
            observacoes: leadData.observacoes,
            cep: leadData.cep,
            numero: leadData.numero,
            tipo_servico: leadData.tipo_servico,
          };
          setLocalLeadsFallback((prev) => [newRecord, ...prev]);
        }
      }
    } catch (err) {
      console.error('Erro ao cadastrar/atualizar lead no dashboard:', err);
      throw err;
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este lead de forma permanente?')) return;
    try {
      if (isDbConfigured) {
        await deleteLead(id);
      } else {
        setLocalLeadsFallback((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error('Erro ao excluir lead:', err);
      alert(err instanceof Error ? err.message : 'Erro ao excluir o lead.');
    }
  };

  const handleDownloadBackup = () => {
    const headers = [
      'ID',
      'Nome',
      'E-mail',
      'Telefone',
      'Cidade',
      'CEP',
      'Número',
      'Endereço Obra',
      'Área (m²)',
      'Tipo de Serviço',
      'Valor Estimado',
      'Materiais Previstos',
      'Status',
      'Criado Em'
    ];
    const rows = listLeads.map(l => [
      l.id,
      l.nome,
      l.email,
      l.telefone,
      l.cidade,
      l.cep,
      l.numero,
      l.endereco_obra,
      l.area_m2,
      l.tipo_servico,
      l.valor_estimado,
      l.materiais_previstos,
      l.status,
      l.criado_em
    ]);
    downloadCSV(`backup_leads_${Date.now()}.csv`, headers, rows);
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
          <div className="flex items-center gap-3 self-start md:self-end">
            {leadsNovos > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold text-blue-700">{leadsNovos} novos</span>
              </div>
            )}
            <button
              onClick={handleDownloadBackup}
              title="Baixar Backup de Leads (CSV)"
              className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-orange-600 font-bold text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Backup Leads
            </button>
            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Cadastrar Lead
            </button>
          </div>
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
                    const isExpanded = expandedLeadId === lead.id;
                    return (
                      <React.Fragment key={lead.id}>
                        <tr
                          onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer select-none"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm animate-fade-in">
                                {lead.nome.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{lead.nome}</span>
                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 mt-0.5 group-hover:text-orange-500 transition-colors">
                                  {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                                  <svg className={`w-2.5 h-2.5 transition-transform ${isExpanded ? 'rotate-180 text-orange-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </span>
                              </div>
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
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(lead);
                                }}
                                className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                                title="Editar Lead"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLead(lead.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Excluir Lead"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>

                              {lead.status !== 'Qualificado' && lead.status !== 'Perdido' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenQualifyModal(lead);
                                  }}
                                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm shadow-orange-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  Qualificar
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300 italic font-medium py-1">Concluído</span>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {isExpanded && (
                          <tr className="bg-orange-50/10">
                            <td colSpan={6} className="px-6 py-5 border-t border-b border-orange-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-700">
                                {/* Coluna 1: Endereço & Localização */}
                                <div className="space-y-2 border-r border-gray-100 pr-4">
                                  <div className="flex items-center gap-1.5 font-bold text-gray-400 uppercase tracking-wider text-[9px]">
                                    <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Local da Obra
                                  </div>
                                  <div className="pl-5.5 space-y-1">
                                    <p className="font-semibold text-gray-950">{lead.endereco_obra || 'Endereço da obra não informado'}</p>
                                    <p className="text-gray-500">Cidade: {lead.cidade}</p>
                                    {lead.tipo_servico && (
                                      <div className="mt-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 border border-orange-200 text-orange-700">
                                          Serviço: {lead.tipo_servico}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Coluna 2: Estimativas do Projeto */}
                                <div className="space-y-2 border-r border-gray-100 pr-4">
                                  <div className="flex items-center gap-1.5 font-bold text-gray-400 uppercase tracking-wider text-[9px]">
                                    <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Orçamento & Área
                                  </div>
                                  <div className="pl-5.5 space-y-1">
                                    <p className="text-gray-900 font-mono font-black text-sm">
                                      R$ {lead.valor_estimado ? lead.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                                    </p>
                                    <p className="text-gray-500 font-semibold">
                                      Área Aquecida: {lead.area_m2 ? `${lead.area_m2} m²` : 'Não informada'}
                                    </p>
                                  </div>
                                </div>

                                {/* Coluna 3: Materiais Previstos */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between font-bold text-gray-400 uppercase tracking-wider text-[9px]">
                                    <div className="flex items-center gap-1.5">
                                      <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                      </svg>
                                      Materiais Planejados
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditModal(lead);
                                      }}
                                      className="text-[9px] font-bold text-orange-650 hover:text-orange-700 bg-orange-50/80 px-2 py-0.5 rounded border border-orange-100 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      Editar
                                    </button>
                                  </div>
                                  <div className="pl-5.5 flex flex-wrap gap-1.5">
                                    {!lead.materiais_previstos || lead.materiais_previstos.length === 0 ? (
                                      <span className="text-gray-400 italic">Nenhum material planejado</span>
                                    ) : (
                                      lead.materiais_previstos.map((mat, i) => (
                                        <span key={i} className="inline-block bg-orange-100 border border-orange-200 text-orange-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                          {mat}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Linha de Observações */}
                                {lead.observacoes && (
                                  <div className="col-span-1 md:col-span-3 pt-3 border-t border-gray-100/50 mt-1 space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-gray-400 uppercase tracking-wider text-[9px]">
                                      <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                      Observações / Requisitos
                                    </div>
                                    <p className="pl-5.5 text-gray-600 leading-relaxed font-semibold italic">
                                      &ldquo;{lead.observacoes}&rdquo;
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
                  disabled={loadingAction || isCreatingProject}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-black text-sm transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2"
                >
                  {(loadingAction || isCreatingProject) ? (
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

      {/* Modal de Cadastro Completo de Lead */}
      {isAddLeadModalOpen && (
        <ModalCadastroLead
          isOpen={isAddLeadModalOpen}
          onClose={handleCloseAddLeadModal}
          onSave={handleSaveLead}
          isSaving={leadToEdit ? isUpdatingLead : isCreatingLead}
          leadToEdit={leadToEdit}
        />
      )}
    </div>
  );
}
