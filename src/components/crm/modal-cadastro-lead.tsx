'use client';

import React, { useState } from 'react';
import { Lead } from '@/types/database.types';

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
  }) => Promise<void>;
  isSaving: boolean;
}

const MATERIAL_OPTIONS = [
  'Cabo Calefator 15W/m',
  'Cabo Calefator 20W/m',
  'Termostato Wifi Black',
  'Termostato Wifi White',
  'Termostato Digital Programável',
  'Isolamento Térmico (Refletivo)',
  'Sensor de Piso NTC',
  'Malha Metálica de Fixação',
  'Fita de Fixação Adesiva',
];

export default function ModalCadastroLead({
  isOpen,
  onClose,
  onSave,
  isSaving,
}: ModalCadastroLeadProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('Curitiba');
  const [areaM2, setAreaM2] = useState('');
  const [status, setStatus] = useState<Lead['status']>('Novo');

  // Novos campos adicionados para o cadastro completo
  const [enderecoObra, setEnderecoObra] = useState('');
  const [valorEstimado, setValorEstimado] = useState('15000');
  const [materiaisPrevistos, setMateriaisPrevistos] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleToggleMaterial = (material: string) => {
    setMateriaisPrevistos((prev) =>
      prev.includes(material)
        ? prev.filter((m) => m !== material)
        : [...prev, material]
    );
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
        cidade: cidade.trim(),
        area_m2: areaM2 ? parseFloat(areaM2) : null,
        endereco_obra: enderecoObra.trim() || null,
        valor_estimado: valorEstimado ? parseFloat(valorEstimado) : null,
        materiais_previstos: materiaisPrevistos,
        observacoes: observacoes.trim() || null,
        status,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar lead.';
      setErrorMessage(msg);
    }
  };

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
              Novo Registro
            </span>
            <h3 className="text-xl font-black text-gray-900 mt-1.5">Cadastrar Novo Lead</h3>
            <p className="text-xs text-gray-500 mt-0.5">Preencha o perfil completo do lead, incluindo dados pessoais, obra e orçamento previsto.</p>
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
                <div className="space-y-1.5">
                  <label htmlFor="endereco_obra" className={labelClass}>Endereço Completo da Obra</label>
                  <input
                    type="text"
                    id="endereco_obra"
                    placeholder="Ex: Rua das Palmeiras, 405 - Condomínio Royal"
                    value={enderecoObra}
                    onChange={(e) => setEnderecoObra(e.target.value)}
                    className={inputClass}
                  />
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
              </div>
            </div>

            {/* Seção 3: Planejamento de Materiais e Orçamento */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">3. Materiais Previstos & Observações</h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={labelClass}>Materiais Necessários (Previsão)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {MATERIAL_OPTIONS.map((material) => {
                      const selected = materiaisPrevistos.includes(material);
                      return (
                        <button
                          key={material}
                          type="button"
                          onClick={() => handleToggleMaterial(material)}
                          className={`flex items-center gap-2.5 px-3 py-2 border rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                            selected
                              ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            selected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {selected && (
                              <svg className="w-3.5 h-3.5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="truncate">{material}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                  Confirmar Cadastro
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
