'use client';

import React, { useState, useEffect } from 'react';
import { criarMembroEquipe, MembroEquipe } from '@/app/actions/equipe';
import { supabase } from '@/lib/supabase';

// Mock Data Inicial com 3 colaboradores fictícios tipados
const MOCK_EQUIPE: MembroEquipe[] = [
  {
    id: 'mock-1',
    nome_completo: 'Roberto Mendonça',
    email: 'roberto.mendonca@hublypro.com.br',
    telefone: '(41) 99999-1111',
    role: 'vendedor',
    status_acesso: true,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    nome_completo: 'Clarice Lispector',
    email: 'clarice.lispector@hublypro.com.br',
    telefone: '(41) 99999-2222',
    role: 'instalador',
    status_acesso: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    nome_completo: 'Julio Cortázar',
    email: 'julio.cortazar@hublypro.com.br',
    telefone: '(41) 99999-3333',
    role: 'vendedor',
    status_acesso: false, // Bloqueado
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

export default function GestaoEquipePage() {
  const [equipe, setEquipe] = useState<MembroEquipe[]>(MOCK_EQUIPE);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRealData, setLoadingRealData] = useState(true);
  const [currentMestreId, setCurrentMestreId] = useState<string | null>(null);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Campos do Formulário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [emailCorporativo, setEmailCorporativo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nivelAcesso, setNivelAcesso] = useState<'vendedor' | 'instalador'>('vendedor');

  // Sistema de Toast Alert Premium
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Carregar dados (tentativa de buscar do banco e mesclar com mock)
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingRealData(true);
        // Pegar sessão para identificar ID do gerente
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentMestreId(session.user.id);
        }

        // Tentar obter dados do banco real
        const { data: perfis, error } = await supabase
          .from('perfis_usuarios')
          .select('*')
          .in('role', ['vendedor', 'instalador']);

        if (!error && perfis && perfis.length > 0) {
          const dbMembros = perfis.map((p: any) => ({
            id: p.id,
            nome_completo: p.nome_completo || p.nome || 'Sem Nome',
            email: p.email || '',
            telefone: p.telefone || '(00) 00000-0000',
            role: (p.role === 'tecnico' ? 'vendedor' : p.role) as 'vendedor' | 'instalador',
            status_acesso: p.status_acesso ?? true,
            created_at: p.created_at,
          }));

          // Mesclar DB com Mock para manter dados visualizáveis
          setEquipe([...dbMembros, ...MOCK_EQUIPE]);
        }
      } catch (err) {
        console.warn('Usando dados de mock devido à inicialização do banco.', err);
      } finally {
        setLoadingRealData(false);
      }
    }
    loadData();
  }, []);

  // Máscara de Telefone (WhatsApp) (XX) XXXXX-XXXX em tempo real
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '').slice(0, 11);
    
    if (digits.length === 0) {
      setWhatsapp('');
    } else if (digits.length <= 2) {
      setWhatsapp(`(${digits}`);
    } else if (digits.length <= 6) {
      setWhatsapp(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else if (digits.length <= 10) {
      setWhatsapp(`(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`);
    } else {
      setWhatsapp(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
    }
  };

  // Abrir / Fechar Modal
  const openModal = () => {
    setNomeCompleto('');
    setEmailCorporativo('');
    setWhatsapp('');
    setNivelAcesso('vendedor');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (!nomeCompleto.trim()) throw new Error('O nome completo é obrigatório.');
      if (!emailCorporativo.trim()) throw new Error('O e-mail corporativo é obrigatório.');
      if (!whatsapp.trim() || whatsapp.length < 14) throw new Error('Por favor, informe um número de WhatsApp válido.');

      // Chamar a Server Action Segura
      const novoMembro = await criarMembroEquipe({
        nome_completo: nomeCompleto,
        email: emailCorporativo,
        telefone: whatsapp,
        role: nivelAcesso,
      });

      // Atualizar estado local com o novo funcionário adicionado
      setEquipe((prev) => [novoMembro, ...prev]);

      // Fechar modal
      setIsModalOpen(false);

      // Toast de Sucesso Premium
      showToast(
        'success',
        'A conta foi criada e o link de acesso foi enviado para o e-mail/WhatsApp do funcionário.'
      );
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Houve uma falha ao provisionar a conta da equipe.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtro de Busca
  const filteredEquipe = equipe.filter(
    (membro) =>
      membro.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membro.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membro.telefone.includes(searchTerm)
  );

  // Estatísticas Dinâmicas
  const stats = {
    total: equipe.length,
    vendedores: equipe.filter((m) => m.role === 'vendedor').length,
    instaladores: equipe.filter((m) => m.role === 'instalador').length,
    bloqueados: equipe.filter((m) => !m.status_acesso).length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans selection:bg-[#0a4ee4] selection:text-white bg-[#FCFBFA] text-[#0B0F19] min-h-screen relative">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <span className="text-[10px] font-bold text-[#0a4ee4] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Conta Mestra (Hubly Pro)
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">
            Gestão de Equipe
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Provisione com segurança novas contas para seus vendedores e instaladores sem desconectar sua sessão ativa.
          </p>
        </div>

        <button
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#0a4ee4] to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/10 active:scale-[0.98] cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Adicionar Membro
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Colaboradores */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0a4ee4]/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Equipe</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{stats.total}</span>
            <span className="text-xs text-gray-400 font-medium">colaboradores</span>
          </div>
        </div>

        {/* Vendedores */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendedores</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-blue-600">{stats.vendedores}</span>
            <span className="text-xs text-gray-400 font-medium">contas de vendas</span>
          </div>
        </div>

        {/* Instaladores */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Instaladores</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600">{stats.instaladores}</span>
            <span className="text-xs text-gray-400 font-medium">técnicos operacionais</span>
          </div>
        </div>

        {/* Bloqueados */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acessos Revogados</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black ${stats.bloqueados > 0 ? 'text-rose-600' : 'text-gray-950'}`}>{stats.bloqueados}</span>
            <span className="text-xs text-gray-400 font-medium">bloqueados</span>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white border border-gray-200/80 rounded-3xl shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-gray-150 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#0a4ee4] focus:bg-white text-gray-900 transition-all font-semibold"
            />
          </div>
          <div className="text-xs text-gray-400 font-medium">
            Exibindo <span className="font-bold text-gray-600">{filteredEquipe.length}</span> de <span className="font-bold text-gray-600">{equipe.length}</span> membros
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loadingRealData && equipe.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-[#0a4ee4] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Sincronizando equipe...</p>
            </div>
          ) : filteredEquipe.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-base font-bold text-gray-700">Nenhum membro encontrado</h3>
              <p className="text-gray-400 text-xs mt-1">Refine o termo digitado ou adicione novos membros.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-150">
                  <th className="py-4 px-6">Nome / Cadastro</th>
                  <th className="py-4 px-6">E-mail Corporativo</th>
                  <th className="py-4 px-6">WhatsApp</th>
                  <th className="py-4 px-6">Nível de Acesso (Role)</th>
                  <th className="py-4 px-6">Status de Acesso</th>
                  <th className="py-4 px-6 text-right">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-medium">
                {filteredEquipe.map((membro) => {
                  return (
                    <tr key={membro.id} className="hover:bg-gray-50/50 transition-all group">
                      {/* Nome e Data */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-sm text-white bg-gradient-to-br ${
                            membro.role === 'vendedor'
                              ? 'from-blue-500 to-indigo-600 shadow-blue-500/10'
                              : 'from-emerald-500 to-teal-600 shadow-emerald-500/10'
                          }`}>
                            {membro.nome_completo.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-gray-900 font-bold">{membro.nome_completo}</p>
                            <p className="text-gray-400 text-[10px] font-semibold">
                              Cadastrado em {new Date(membro.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="py-4.5 px-6 text-gray-600 font-semibold">
                        {membro.email}
                      </td>

                      {/* WhatsApp */}
                      <td className="py-4.5 px-6 text-gray-600 font-semibold font-mono">
                        {membro.telefone}
                      </td>

                      {/* Nível de Acesso Badge */}
                      <td className="py-4.5 px-6">
                        {membro.role === 'vendedor' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700">
                            Vendedor
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            Instalador
                          </span>
                        )}
                      </td>

                      {/* Status de Acesso */}
                      <td className="py-4.5 px-6">
                        {membro.status_acesso ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Bloqueado
                          </span>
                        )}
                      </td>

                      {/* ID Auditoria */}
                      <td className="py-4.5 px-6 text-right">
                        <span className="text-[10px] text-gray-350 font-bold uppercase tracking-tight font-mono select-all">
                          {membro.id.substring(0, 8)}...
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal / Dialog de Criação Personalizado com Backdrop Blur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <div 
            onClick={closeModal} 
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 transform transition-all scale-100 duration-300">
            {/* Top Indicator bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0a4ee4] to-amber-500" />

            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-gray-900">Convidar Novo Funcionário</h3>
                <p className="text-xs text-gray-500 mt-1">Insira os dados corporativos para enviar o link de provisionamento de conta.</p>
              </div>
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="text-gray-300 hover:text-gray-600 disabled:opacity-50 transition-colors p-1.5 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                
                {/* Alerta de erro */}
                {formError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                    <svg className="w-4.5 h-4.5 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formError}</span>
                  </div>
                )}

                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <label htmlFor="nome_completo" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="nome_completo"
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo Silva"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      disabled={isSaving}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* E-mail Corporativo */}
                <div className="space-y-1.5">
                  <label htmlFor="email_corporativo" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email_corporativo"
                      type="email"
                      required
                      placeholder="Ex: nome.colaborador@hublypro.com.br"
                      value={emailCorporativo}
                      onChange={(e) => setEmailCorporativo(e.target.value)}
                      disabled={isSaving}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* WhatsApp + Nível de Acesso em Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WhatsApp com Máscara */}
                  <div className="space-y-1.5">
                    <label htmlFor="whatsapp" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Número do WhatsApp
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        id="whatsapp"
                        type="text"
                        required
                        placeholder="(41) 99999-9999"
                        value={whatsapp}
                        onChange={handleWhatsappChange}
                        disabled={isSaving}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none transition-all text-sm font-semibold font-mono"
                      />
                    </div>
                  </div>

                  {/* Select Nível de Acesso */}
                  <div className="space-y-1.5">
                    <label htmlFor="nivel_acesso" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Nível de Acesso
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <select
                        id="nivel_acesso"
                        value={nivelAcesso}
                        onChange={(e) => setNivelAcesso(e.target.value as any)}
                        disabled={isSaving}
                        className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl pl-10 pr-10 py-2.5 text-gray-800 outline-none transition-all text-sm font-bold cursor-pointer appearance-none"
                      >
                        <option value="vendedor">Vendedor (Vendas)</option>
                        <option value="instalador">Instalador (Técnico)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-4.5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5.5 py-2.5 bg-gradient-to-r from-[#0a4ee4] to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      Provisionar Membro
                    </>
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
