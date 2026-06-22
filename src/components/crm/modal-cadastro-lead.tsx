'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/database.types';
import {
  getMateriaisPredefinidos,
  criarMaterialPredefinido,
  atualizarMaterialPredefinido,
  deletarMaterialPredefinido,
  type MaterialPredefinido
} from '@/app/actions/materiais';

interface ModalCadastroLeadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: {
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
  }) => Promise<void>;
  isSaving: boolean;
  leadToEdit?: Lead | null;
}

function parseEndereco(enderecoCompleto: string) {
  if (!enderecoCompleto) {
    return { rua: '', numero: '', complemento: '', bairro: '' };
  }

  let rua = '';
  let numero = '';
  let complemento = '';
  let bairro = '';

  const isProbablyNumber = (str: string) => {
    const clean = str.trim().toLowerCase();
    return /\d/.test(clean) || ['s/n', 'sn', 'sem número', 'sem numero', 'casa', 'lote'].some(v => clean.includes(v));
  };

  if (enderecoCompleto.includes(' - ')) {
    const partes = enderecoCompleto.split(/\s*-\s*/);
    const ruaENumero = partes[0] || '';
    
    if (partes.length === 2) {
      bairro = partes[1] || '';
    } else if (partes.length >= 3) {
      complemento = partes[1] || '';
      bairro = partes.slice(2).join(' - ') || '';
    }

    if (ruaENumero.includes(',')) {
      const idx = ruaENumero.lastIndexOf(',');
      rua = ruaENumero.substring(0, idx).trim();
      numero = ruaENumero.substring(idx + 1).trim();
    } else {
      rua = ruaENumero;
    }
  } else {
    const partes = enderecoCompleto.split(/\s*,\s*/);
    if (partes.length === 1) {
      rua = partes[0];
    } else if (partes.length === 2) {
      rua = partes[0];
      if (isProbablyNumber(partes[1])) {
        numero = partes[1];
      } else {
        bairro = partes[1];
      }
    } else if (partes.length === 3) {
      rua = partes[0];
      numero = partes[1];
      bairro = partes[2];
    } else {
      rua = partes[0];
      numero = partes[1];
      bairro = partes[2];
      complemento = partes.slice(3).join(', ');
    }
  }

  return { rua, numero, complemento, bairro };
}

function formatEndereco(rua: string, numero: string, complemento: string, bairro: string) {
  let parts: string[] = [];
  if (rua.trim()) {
    let ruaStr = rua.trim();
    if (numero.trim()) {
      ruaStr += `, ${numero.trim()}`;
    }
    parts.push(ruaStr);
  }
  if (complemento.trim()) {
    parts.push(complemento.trim());
  }
  if (bairro.trim()) {
    parts.push(bairro.trim());
  }
  return parts.join(' - ');
}

export default function ModalCadastroLead({
  isOpen,
  onClose,
  onSave,
  isSaving,
  leadToEdit,
}: ModalCadastroLeadProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('Curitiba');
  const [areaM2, setAreaM2] = useState('');
  const [status, setStatus] = useState<Lead['status']>('Novo');

  // Novos campos adicionados para o cadastro completo
  const [enderecoObra, setEnderecoObra] = useState('');
  const [numeroObra, setNumeroObra] = useState('');
  const [complementoObra, setComplementoObra] = useState('');
  const [bairroObra, setBairroObra] = useState('');
  const [valorEstimado, setValorEstimado] = useState('15000');
  const [materiaisPrevistos, setMateriaisPrevistos] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [cep, setCep] = useState('');
  const [tipoServico, setTipoServico] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Estados de Materiais Dinâmicos
  const [materialOptions, setMaterialOptions] = useState<MaterialPredefinido[]>([]);
  const [isEditingList, setIsEditingList] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialName, setEditingMaterialName] = useState('');
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  // Resetar estados baseado em leadToEdit
  useEffect(() => {
    if (isOpen) {
      if (leadToEdit) {
        setNome(leadToEdit.nome || '');
        setEmail(leadToEdit.email || '');
        setTelefone(leadToEdit.telefone || '');
        setCidade(leadToEdit.cidade || 'Curitiba');
        setAreaM2(leadToEdit.area_m2 ? String(leadToEdit.area_m2) : '');
        setStatus(leadToEdit.status || 'Novo');
        const parsed = parseEndereco(leadToEdit.endereco_obra || '');
        setEnderecoObra(parsed.rua);
        setNumeroObra(parsed.numero);
        setComplementoObra(parsed.complemento);
        setBairroObra(parsed.bairro);
        setValorEstimado(leadToEdit.valor_estimado ? String(leadToEdit.valor_estimado) : '');
        setMateriaisPrevistos(leadToEdit.materiais_previstos || []);
        setObservacoes(leadToEdit.observacoes || '');
        setCep(leadToEdit.cep || '');
        setTipoServico(leadToEdit.tipo_servico || '');
      } else {
        setNome('');
        setEmail('');
        setTelefone('');
        setCidade('Curitiba');
        setAreaM2('');
        setStatus('Novo');
        setEnderecoObra('');
        setNumeroObra('');
        setComplementoObra('');
        setBairroObra('');
        setValorEstimado('15000');
        setMateriaisPrevistos([]);
        setObservacoes('');
        setCep('');
        setTipoServico('');
      }
      setErrorMessage('');
    }
  }, [isOpen, leadToEdit]);

  const handleCepChange = async (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    const truncatedValue = cleanValue.slice(0, 8);
    let masked = truncatedValue;
    if (truncatedValue.length > 5) {
      masked = `${truncatedValue.slice(0, 5)}-${truncatedValue.slice(5)}`;
    }
    setCep(masked);

    if (truncatedValue.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${truncatedValue}/json/`);
        const data = await response.json();
        if (data && !data.erro) {
          if (data.localidade) {
            setCidade(data.localidade);
          }
          if (data.logradouro) {
            setEnderecoObra(data.logradouro);
          } else {
            setEnderecoObra('');
          }
          if (data.bairro) {
            setBairroObra(data.bairro);
          } else {
            setBairroObra('');
          }
          setNumeroObra('');
          setComplementoObra('');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  // Carregar materiais na abertura do modal
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
    if (isOpen) {
      loadMaterials();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        // Fallback local caso tabela não esteja migrada
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
        // Atualiza a seleção do lead caso o material editado já estivesse selecionado
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { setErrorMessage('Por favor, informe o nome.'); return; }
    if (!telefone.trim()) { setErrorMessage('Por favor, informe o telefone.'); return; }
    if (!cidade.trim()) { setErrorMessage('Por favor, informe a cidade.'); return; }

    try {
      await onSave({
        nome: nome.trim(),
        email: email.trim() || null,
        telefone: telefone.trim(),
        cidade: cityCapitalize(cidade.trim()),
        area_m2: areaM2 ? parseFloat(areaM2) : null,
        endereco_obra: formatEndereco(enderecoObra, numeroObra, complementoObra, bairroObra) || null,
        numero: numeroObra.trim() || null,
        tipo_servico: tipoServico || null,
        valor_estimado: valorEstimado ? parseFloat(valorEstimado) : null,
        materiais_previstos: materiaisPrevistos,
        observacoes: observacoes.trim() || null,
        status,
        cep: cep.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar lead.';
      setErrorMessage(msg);
    }
  };

  function cityCapitalize(val: string) {
    return val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none transition-all text-sm";
  const selectClass = "w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-gray-800 outline-none transition-all text-sm cursor-pointer appearance-none";
  const labelClass = "text-xs font-bold uppercase tracking-wider text-gray-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-400 shrink-0" />

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0">
          <div>
            <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {leadToEdit ? 'Editar Registro' : 'Novo Registro'}
            </span>
            <h3 className="text-xl font-black text-gray-900 mt-1.5">{leadToEdit ? 'Editar Lead' : 'Cadastrar Novo Lead'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {leadToEdit
                ? 'Edite o perfil do lead, incluindo dados de contato, obra e materiais planejados.'
                : 'Preencha o perfil completo do lead, incluindo dados pessoais, obra e orçamento previsto.'}
            </p>
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

            {/* Seção 1: Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">1. Dados Pessoais & Contato</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="nome" className={labelClass}>Nome do Cliente *</label>
                  <input
                    type="text"
                    id="nome"
                    required
                    placeholder="Ex: Roberto Mendonça"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="telefone" className={labelClass}>Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    id="telefone"
                    required
                    placeholder="Ex: (41) 99999-1111"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className={labelClass}>Email</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Ex: cliente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cidade" className={labelClass}>Cidade *</label>
                  <input
                    type="text"
                    id="cidade"
                    required
                    placeholder="Ex: Curitiba"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Dados da Obra */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">2. Detalhes da Obra / Projeto</h4>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="space-y-1.5 sm:col-span-3">
                    <label htmlFor="cep" className={labelClass}>CEP</label>
                    <div className="relative">
                      <input
                        type="text"
                        id="cep"
                        placeholder="Ex: 80240-030"
                        value={cep}
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
                    <label htmlFor="endereco_rua" className={labelClass}>Endereço (Rua, Avenida, etc.)</label>
                    <input
                      type="text"
                      id="endereco_rua"
                      placeholder="Ex: Rua das Palmeiras"
                      value={enderecoObra}
                      onChange={(e) => setEnderecoObra(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="space-y-1.5 sm:col-span-3">
                    <label htmlFor="endereco_numero" className={labelClass}>Número</label>
                    <input
                      type="text"
                      id="endereco_numero"
                      placeholder="Ex: 405"
                      value={numeroObra}
                      onChange={(e) => setNumeroObra(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-5">
                    <label htmlFor="endereco_complemento" className={labelClass}>Complemento</label>
                    <input
                      type="text"
                      id="endereco_complemento"
                      placeholder="Ex: Apto 102 / Bloco B"
                      value={complementoObra}
                      onChange={(e) => setComplementoObra(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-4">
                    <label htmlFor="endereco_bairro" className={labelClass}>Bairro</label>
                    <input
                      type="text"
                      id="endereco_bairro"
                      placeholder="Ex: Centro"
                      value={bairroObra}
                      onChange={(e) => setBairroObra(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="area_m2" className={labelClass}>Área Estimada (m²)</label>
                    <input
                      type="number"
                      id="area_m2"
                      placeholder="Ex: 80"
                      value={areaM2}
                      onChange={(e) => setAreaM2(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="valor_estimado" className={labelClass}>Valor Estimado (R$)</label>
                    <input
                      type="number"
                      id="valor_estimado"
                      placeholder="Ex: 15000"
                      value={valorEstimado}
                      onChange={(e) => setValorEstimado(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="status" className={labelClass}>Status Inicial</label>
                    <div className="relative">
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Lead['status'])}
                        className={selectClass}
                      >
                        <option value="Novo">Novo (Aguardando)</option>
                        <option value="Em Contato">Em Contato</option>
                        <option value="Qualificado">Qualificado (Gera Obra)</option>
                        <option value="Perdido">Perdido</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="tipo_servico" className={labelClass}>Tipo de Serviço</label>
                    <div className="relative">
                      <select
                        id="tipo_servico"
                        value={tipoServico}
                        onChange={(e) => setTipoServico(e.target.value)}
                        className={selectClass}
                      >
                        <option value="" disabled>Selecione um serviço</option>
                        <option value="Instalação Sistemas Solares">Instalação Sistemas Solares</option>
                        <option value="Limpeza de placas Solares">Limpeza de placas Solares</option>
                        <option value="Aquecimento de piso">Aquecimento de piso</option>
                        <option value="Carregamento Veicular">Carregamento Veicular</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Planejamento de Materiais e Orçamento */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">3. Materiais Previstos & Observações</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingList(!isEditingList)}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/70 border border-orange-200/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
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

              <div className="space-y-4">
                {isEditingList ? (
                  // MODO EDICAO DA LISTA
                  <div className="space-y-4">
                    {/* Form Adicionar */}
                    <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-2">
                      <label className="text-[10px] font-bold text-orange-800 uppercase tracking-wide">Cadastrar Novo Material Pré-definido</label>
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

                    {/* Lista Editável */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {materialOptions.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-4">Nenhum material na lista de pré-definidos.</p>
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
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
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
                  // MODO SELECAO NORMAL DE MATERIAIS
                  <div className="space-y-2">
                    <label className={labelClass}>Selecione os Materiais Necessários (Previsão)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {isLoadingMaterials ? (
                        <p className="col-span-full text-xs text-gray-400 italic text-center py-4">Carregando materiais...</p>
                      ) : materialOptions.length === 0 ? (
                        <p className="col-span-full text-xs text-gray-400 italic text-center py-4">Nenhum material pré-definido. Clique em [Configurar Lista] para adicionar.</p>
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

                {/* Campo de Observações */}
                <div className="space-y-1.5">
                  <label htmlFor="observacoes" className={labelClass}>Observações / Requisitos Especiais</label>
                  <textarea
                    id="observacoes"
                    rows={3}
                    placeholder="Descreva particularidades do projeto (tipo de piso, acabamento, detalhes da infraestrutura elétrica, etc.)"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !nome || !telefone || !cidade}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {leadToEdit ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
