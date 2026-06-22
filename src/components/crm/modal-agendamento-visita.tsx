'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { Project } from '@/types/database.types';
import { useDropzone } from 'react-dropzone';
import {
  getMateriaisPredefinidos,
  criarMaterialPredefinido,
  atualizarMaterialPredefinido,
  deletarMaterialPredefinido,
  type MaterialPredefinido
} from '@/app/actions/materiais';

interface ModalAgendamentoVisitaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    visita: {
      data_visita: string;
      horario: string;
      status_visita: 'Agendada';
      observacoes: string;
      tecnico_id?: string | null;
      pdf_proposta?: File | null;
    },
    newClientData?: {
      nome: string;
      email: string | null;
      telefone: string;
      cidade: string;
      cep: string | null;
      endereco_rua: string;
      numero: string;
      complemento: string;
      bairro: string;
      tipo_servico: string;
      materiais_previstos: string[];
      observacoes_projeto: string;
    } | null,
    project_id?: string
  ) => Promise<void>;
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

  // Filtra apenas projetos que possuem um lead válido e ativo
  const activeProjects = useMemo(() => {
    return projects.filter((p) => !!p.leads);
  }, [projects]);

  // Tab State
  const [tab, setTab] = useState<'existente' | 'novo'>('novo');

  // Campos de Agendamento Existente
  const [projectId, setProjectId] = useState('');
  
  // Campos de Novo Cliente
  const [nomeClienteNovo, setNomeClienteNovo] = useState('');
  const [telefoneClienteNovo, setTelefoneClienteNovo] = useState('');
  const [emailClienteNovo, setEmailClienteNovo] = useState('');
  const [cidadeClienteNovo, setCidadeClienteNovo] = useState('Curitiba');
  
  // Detalhes da Obra do Novo Cliente
  const [cepClienteNovo, setCepClienteNovo] = useState('');
  const [enderecoRuaClienteNovo, setEnderecoRuaClienteNovo] = useState('');
  const [numeroClienteNovo, setNumeroClienteNovo] = useState('');
  const [complementoClienteNovo, setComplementoClienteNovo] = useState('');
  const [bairroClienteNovo, setBairroClienteNovo] = useState('');
  const [tipoServicoClienteNovo, setTipoServicoClienteNovo] = useState('Aquecimento de piso');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Materiais do Novo Cliente
  const [materialOptions, setMaterialOptions] = useState<MaterialPredefinido[]>([]);
  const [isEditingList, setIsEditingList] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialName, setEditingMaterialName] = useState('');
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [materiaisPrevistos, setMateriaisPrevistos] = useState<string[]>([]);
  const [observacoesProjeto, setObservacoesProjeto] = useState('');

  // Campos Comuns de Visita
  const [dataVisita, setDataVisita] = useState(getTodayStr);
  const [horario, setHorario] = useState('09:00');
  const [tecnicoId, setTecnicoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [pdfProposta, setPdfProposta] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState('');
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

  // Carregar materiais
  useEffect(() => {
    async function loadMaterials() {
      setIsLoadingMaterials(true);
      try {
        const list = await getMateriaisPredefinidos();
        setMaterialOptions(list);
      } catch (e) {
        console.error('Erro ao carregar materiais:', e);
      } finally {
        setIsLoadingMaterials(false);
      }
    }
    if (isOpen && tab === 'novo') {
      loadMaterials();
    }
  }, [isOpen, tab]);

  // react-dropzone config
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (acceptedFiles, fileRejections) => {
      setPdfError('');
      if (fileRejections.length > 0) {
        setPdfError('Por favor, envie apenas arquivos PDF de até 5MB.');
        return;
      }
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.size > 5 * 1024 * 1024) {
          setPdfError('O arquivo deve ter no máximo 5MB.');
          return;
        }
        setPdfProposta(file);
      }
    }
  });

  if (!isOpen) return null;

  // CEP Lookup
  const handleCepChange = async (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    const truncatedValue = cleanValue.slice(0, 8);
    let masked = truncatedValue;
    if (truncatedValue.length > 5) {
      masked = `${truncatedValue.slice(0, 5)}-${truncatedValue.slice(5)}`;
    }
    setCepClienteNovo(masked);

    if (truncatedValue.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${truncatedValue}/json/`);
        const data = await response.json();
        if (data && !data.erro) {
          if (data.localidade) {
            setCidadeClienteNovo(data.localidade);
          }
          if (data.logradouro) {
            setEnderecoRuaClienteNovo(data.logradouro);
          } else {
            setEnderecoRuaClienteNovo('');
          }
          if (data.bairro) {
            setBairroClienteNovo(data.bairro);
          } else {
            setBairroClienteNovo('');
          }
          setNumeroClienteNovo('');
          setComplementoClienteNovo('');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleToggleMaterial = (materialName: string) => {
    setMateriaisPrevistos((prev) =>
      prev.includes(materialName)
        ? prev.filter((m) => m !== materialName)
        : [...prev, materialName]
    );
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName.trim()) return;
    setIsActionPending(true);
    try {
      const res = await criarMaterialPredefinido(newMaterialName.trim());
      if (res.success && res.data) {
        setMaterialOptions((prev) => [...prev, res.data!]);
      } else {
        const fallbackItem: MaterialPredefinido = {
          id: 'local-' + Date.now(),
          nome: newMaterialName.trim()
        };
        setMaterialOptions((prev) => [...prev, fallbackItem]);
      }
      setNewMaterialName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleUpdateMaterial = async (id: string) => {
    if (!editingMaterialName.trim()) return;
    setIsActionPending(true);
    try {
      const res = await atualizarMaterialPredefinido(id, editingMaterialName.trim());
      if (res.success || id.startsWith('local-')) {
        const oldMaterial = materialOptions.find((m) => m.id === id);
        setMaterialOptions((prev) =>
          prev.map((m) => (m.id === id ? { ...m, nome: editingMaterialName.trim() } : m))
        );
        if (oldMaterial) {
          setMateriaisPrevistos((prev) =>
            prev.map((m) => (m === oldMaterial.nome ? editingMaterialName.trim() : m))
          );
        }
        setEditingMaterialId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    setIsActionPending(true);
    try {
      const res = await deletarMaterialPredefinido(id);
      if (res.success || id.startsWith('local-')) {
        const oldMaterial = materialOptions.find((m) => m.id === id);
        if (oldMaterial) {
          setMateriaisPrevistos((prev) => prev.filter((m) => m !== oldMaterial.nome));
        }
        setMaterialOptions((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionPending(false);
    }
  };

  function cityCapitalize(val: string) {
    return val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataVisita) { setErrorMessage('Por favor, selecione a data da visita.'); return; }
    if (!horario) { setErrorMessage('Por favor, informe o horário da visita.'); return; }

    try {
      if (tab === 'existente') {
        if (!projectId) { setErrorMessage('Por favor, selecione um projeto.'); return; }
        await onSave(
          {
            data_visita: dataVisita,
            horario: horario,
            status_visita: 'Agendada',
            observacoes: observacoes,
            tecnico_id: tecnicoId || null,
            pdf_proposta: pdfProposta
          },
          null,
          projectId
        );
      } else {
        if (!nomeClienteNovo.trim()) { setErrorMessage('Por favor, informe o nome do cliente.'); return; }
        if (!telefoneClienteNovo.trim()) { setErrorMessage('Por favor, informe o telefone.'); return; }
        if (!cidadeClienteNovo.trim()) { setErrorMessage('Por favor, informe a cidade.'); return; }
        
        await onSave(
          {
            data_visita: dataVisita,
            horario: horario,
            status_visita: 'Agendada',
            observacoes: observacoes,
            tecnico_id: tecnicoId || null,
            pdf_proposta: pdfProposta
          },
          {
            nome: nomeClienteNovo.trim(),
            email: emailClienteNovo.trim() || null,
            telefone: telefoneClienteNovo.trim(),
            cidade: cityCapitalize(cidadeClienteNovo.trim()),
            cep: cepClienteNovo.trim() || null,
            endereco_rua: enderecoRuaClienteNovo.trim(),
            numero: numeroClienteNovo.trim(),
            complemento: complementoClienteNovo.trim(),
            bairro: bairroClienteNovo.trim(),
            tipo_servico: tipoServicoClienteNovo,
            materiais_previstos: materiaisPrevistos,
            observacoes_projeto: observacoesProjeto.trim(),
          },
          undefined
        );
      }
      setPdfProposta(null);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao agendar visita.';
      setErrorMessage(msg);
    }
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none transition-all text-sm";
  const selectClass = "w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl pl-9 pr-4 py-2.5 text-gray-800 outline-none transition-all text-sm cursor-pointer appearance-none";
  const selectServicoClass = "w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-gray-800 outline-none transition-all text-sm cursor-pointer appearance-none";
  const labelClass = "text-xs font-bold uppercase tracking-wider text-gray-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-400 shrink-0" />

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-xl font-black text-gray-900">Agendar Nova Visita</h3>
            <p className="text-xs text-gray-500 mt-1">Cadastre um cliente novo ou selecione um existente para agendar a visita.</p>
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

        {/* Tabs Selector */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            type="button"
            onClick={() => { setTab('novo'); setErrorMessage(''); }}
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'novo'
                ? 'border-orange-500 text-orange-600 font-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Novo Cliente (Sem Lead)
          </button>
          <button
            type="button"
            onClick={() => { setTab('existente'); setErrorMessage(''); }}
            className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'existente'
                ? 'border-orange-500 text-orange-600 font-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Cliente Cadastrado
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Erro */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorMessage}
              </div>
            )}

            {/* CONTEÚDO TAB: CLIENTE CADASTRADO */}
            {tab === 'existente' && (
              <div className="space-y-4">
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
                      Para agendar uma visita para cliente cadastrado, você precisa ter um projeto ativo. Cadastre um lead no menu <strong>Leads</strong> e mude o status para <strong>Qualificado</strong> para gerar um projeto automaticamente. Ou use a aba <strong>Novo Cliente</strong> ao lado.
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
              </div>
            )}

            {/* CONTEÚDO TAB: CADASTRO DE NOVO CLIENTE */}
            {tab === 'novo' && (
              <div className="space-y-6">
                
                {/* 1. DADOS PESSOAIS & CONTATO */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                    <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">1. Dados Pessoais & Contato</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="nome_cliente_novo" className={labelClass}>Nome do Cliente *</label>
                      <input
                        type="text"
                        id="nome_cliente_novo"
                        placeholder="Ex: Roberto Mendonça"
                        value={nomeClienteNovo}
                        onChange={(e) => setNomeClienteNovo(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="telefone_cliente_novo" className={labelClass}>Telefone / WhatsApp *</label>
                      <input
                        type="text"
                        id="telefone_cliente_novo"
                        placeholder="Ex: (41) 99999-1111"
                        value={telefoneClienteNovo}
                        onChange={(e) => setTelefoneClienteNovo(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email_cliente_novo" className={labelClass}>Email</label>
                      <input
                        type="email"
                        id="email_cliente_novo"
                        placeholder="Ex: cliente@email.com"
                        value={emailClienteNovo}
                        onChange={(e) => setEmailClienteNovo(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="cidade_cliente_novo" className={labelClass}>Cidade *</label>
                      <input
                        type="text"
                        id="cidade_cliente_novo"
                        placeholder="Ex: Curitiba"
                        value={cidadeClienteNovo}
                        onChange={(e) => setCidadeClienteNovo(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. DETALHES DA OBRA / PROJETO */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                    <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">2. Detalhes da Obra / Projeto</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="space-y-1.5 sm:col-span-3">
                      <label htmlFor="cep_cliente_novo" className={labelClass}>CEP</label>
                      <div className="relative">
                        <input
                          type="text"
                          id="cep_cliente_novo"
                          placeholder="Ex: 80240-030"
                          value={cepClienteNovo}
                          onChange={(e) => handleCepChange(e.target.value)}
                          className={inputClass}
                        />
                        {isSearchingCep && (
                          <div className="absolute right-3 top-2.5">
                            <svg className="animate-spin h-4.5 w-4.5 text-orange-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-9">
                      <label htmlFor="endereco_rua_cliente_novo" className={labelClass}>Endereço (Rua, Avenida, etc.)</label>
                      <input
                        type="text"
                        id="endereco_rua_cliente_novo"
                        placeholder="Ex: Rua das Palmeiras"
                        value={enderecoRuaClienteNovo}
                        onChange={(e) => setEnderecoRuaClienteNovo(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="space-y-1.5 sm:col-span-3">
                      <label htmlFor="numero_cliente_novo" className={labelClass}>Número</label>
                      <input
                        type="text"
                        id="numero_cliente_novo"
                        placeholder="Ex: 405"
                        value={numeroClienteNovo}
                        onChange={(e) => setNumeroClienteNovo(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-5">
                      <label htmlFor="complemento_cliente_novo" className={labelClass}>Complemento</label>
                      <input
                        type="text"
                        id="complemento_cliente_novo"
                        placeholder="Ex: Apto 102 / Bloco B"
                        value={complementoClienteNovo}
                        onChange={(e) => setComplementoClienteNovo(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-4">
                      <label htmlFor="bairro_cliente_novo" className={labelClass}>Bairro</label>
                      <input
                        type="text"
                        id="bairro_cliente_novo"
                        placeholder="Ex: Centro"
                        value={bairroClienteNovo}
                        onChange={(e) => setBairroClienteNovo(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="tipo_servico_cliente_novo" className={labelClass}>Tipo de Serviço</label>
                      <div className="relative">
                        <select
                          id="tipo_servico_cliente_novo"
                          value={tipoServicoClienteNovo}
                          onChange={(e) => setTipoServicoClienteNovo(e.target.value)}
                          className={selectServicoClass}
                        >
                          <option value="Aquecimento de piso">Aquecimento de piso</option>
                          <option value="Instalação Sistemas Solares">Instalação Sistemas Solares</option>
                          <option value="Limpeza de placas Solares">Limpeza de placas Solares</option>
                          <option value="Carregamento Veicular">Carregamento Veicular</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. MATERIAIS PREVISTOS & OBSERVAÇÕES */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">3. Materiais Previstos & Observações</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingList(!isEditingList)}
                      className="text-[10px] font-bold text-orange-655 hover:text-orange-705 bg-orange-50 hover:bg-orange-100/70 border border-orange-200/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isEditingList ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                          </svg>
                          Voltar à Seleção
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Configurar Lista
                        </>
                      )}
                    </button>
                  </div>

                  {isEditingList ? (
                    /* Configuração de Materiais */
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-2">
                        <label className="text-[10px] font-bold text-orange-855 uppercase tracking-wide">Cadastrar Novo Material Pré-definido</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ex: Termostato Smart Black 220V"
                            value={newMaterialName}
                            onChange={(e) => setNewMaterialName(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-3.5 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={handleAddMaterial}
                            disabled={isActionPending || !newMaterialName.trim()}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Incluir
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {materialOptions.length === 0 ? (
                          <p className="text-xs text-gray-400 italic text-center py-4">Nenhum material cadastrado.</p>
                        ) : (
                          materialOptions.map((mat) => {
                            const isEditing = editingMaterialId === mat.id;
                            return (
                              <div key={mat.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all shadow-sm">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingMaterialName}
                                    onChange={(e) => setEditingMaterialName(e.target.value)}
                                    className="flex-1 bg-gray-50 border border-gray-200 focus:border-orange-400 rounded-lg px-2.5 py-1 text-xs text-gray-800 outline-none"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-gray-700 truncate">{mat.nome}</span>
                                )}
                                
                                <div className="flex items-center gap-1 shrink-0">
                                  {isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateMaterial(mat.id)}
                                        disabled={isActionPending || !editingMaterialName.trim()}
                                        className="p-1.5 text-emerald-650 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                        title="Salvar Nome"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingMaterialId(null)}
                                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                        title="Cancelar"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMaterialId(mat.id);
                                          setEditingMaterialName(mat.nome);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                        title="Editar Nome"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMaterial(mat.id)}
                                        disabled={isActionPending}
                                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Excluir da Lista"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Grid de Checkboxes de Materiais */
                    <div className="space-y-2">
                      <label className={labelClass}>Selecione os Materiais Necessários (Previsão)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {isLoadingMaterials ? (
                          <p className="col-span-full text-xs text-gray-400 italic text-center py-4">Carregando materiais...</p>
                        ) : materialOptions.length === 0 ? (
                          <p className="col-span-full text-xs text-gray-400 italic text-center py-4">Nenhum material na lista. Clique em [Configurar Lista] para adicionar.</p>
                        ) : (
                          materialOptions.map((mat) => {
                            const selected = materiaisPrevistos.includes(mat.nome);
                            return (
                              <button
                                key={mat.id}
                                type="button"
                                onClick={() => handleToggleMaterial(mat.nome)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 border rounded-xl text-left text-xs font-bold transition-all duration-200 cursor-pointer ${
                                  selected
                                    ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm shadow-orange-500/5'
                                    : 'bg-white border-gray-200/80 text-gray-600 hover:border-orange-200 hover:bg-orange-50/10'
                                }`}
                              >
                                <div className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                  selected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 bg-white'
                                }`}>
                                  {selected && (
                                    <svg className="w-3 h-3 font-bold text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="truncate">{mat.nome}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Observações / Requisitos Especiais do Projeto */}
                  <div className="space-y-1.5">
                    <label htmlFor="observacoes_projeto" className={labelClass}>Observações / Requisitos Especiais</label>
                    <textarea
                      id="observacoes_projeto"
                      rows={3}
                      placeholder="Descreva particularidades do projeto (tipo de piso, acabamento, detalhes da infraestrutura elétrica, etc.)"
                      value={observacoesProjeto}
                      onChange={(e) => setObservacoesProjeto(e.target.value)}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-150 my-6 pt-6" />

            {/* SEÇÃO COMUM: DADOS DO AGENDAMENTO DA VISITA */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">Dados do Agendamento</h4>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

              {/* Campo de Anexo de Proposta Comercial em PDF */}
              <div className="space-y-2">
                <label className={labelClass}>Anexo da Proposta (PDF)</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] ${
                    isDragActive
                      ? 'border-orange-500 bg-orange-50/20 scale-[1.01]'
                      : 'border-gray-200 hover:border-orange-400 bg-gray-50/50 hover:bg-orange-50/5'
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  {pdfProposta ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500 mx-auto">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700 truncate max-w-[240px] mx-auto">
                          {pdfProposta.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          {(pdfProposta.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPdfProposta(null)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-lg text-[9px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200/80 flex items-center justify-center text-gray-400 mx-auto">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">
                          Arraste e solte o PDF da proposta aqui
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          ou clique para selecionar (Limite: 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {pdfError && (
                  <p className="text-xs text-rose-500 font-bold">{pdfError}</p>
                )}
              </div>

              {/* Observações da Visita */}
              <div className="space-y-1.5">
                <label htmlFor="modal_observacoes" className={labelClass}>
                  Instruções / Observações Iniciais da Visita
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

          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || (tab === 'existente' && !projectId) || !dataVisita || !horario}
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
