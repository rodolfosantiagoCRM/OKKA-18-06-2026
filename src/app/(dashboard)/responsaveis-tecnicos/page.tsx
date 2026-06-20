'use client';

import React, { useState, useEffect } from 'react';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { updatePerfilUsuario } from '@/app/actions/usuarios';
import { ResponsavelTecnico } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

const MOCK_FALLBACK_TECNICOS: ResponsavelTecnico[] = [
  { id: 't1', nome: 'Carlos Eduardo Silva', telefone: '(41) 98888-1234', email: 'carlos.silva@hublypro.com.br', created_at: '2026-06-18T10:00:00Z' },
  { id: 't2', nome: 'Fernanda Lima Souza', telefone: '(41) 97777-5678', email: 'fernanda.lima@hublypro.com.br', created_at: '2026-06-19T08:00:00Z' },
  { id: 't3', nome: 'Rodrigo Medeiros', telefone: '(11) 99111-2233', email: 'rodrigo.medeiros@hublypro.com.br', created_at: '2026-06-17T15:30:00Z' },
];

const AVATAR_COLORS = [
  'from-orange-400 to-amber-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-purple-400 to-violet-500',
  'from-rose-400 to-pink-500',
];

export default function ResponsaveisTecnicosPage() {
  const {
    responsaveis: dbResponsaveis,
    isLoading,
    createResponsavel,
    isCreating,
    deleteResponsavel,
    isDeleting,
  } = useResponsaveis();

  // Estados dos Campos do Formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status de Acesso Mapeados por ID do Técnico
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});

  // Feedbacks
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de Credenciais Criadas (Para cópia rápida)
  const [newCredentials, setNewCredentials] = useState<{ email: string; senha: string; nome: string } | null>(null);

  const [localFallback, setLocalFallback] = useState<ResponsavelTecnico[]>(MOCK_FALLBACK_TECNICOS);
  const isDbConfigured = 
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
  
  const listResponsaveis = (isDbConfigured && dbResponsaveis.length > 0) ? dbResponsaveis : localFallback;

  const [searchTerm, setSearchTerm] = useState('');
  const filteredResponsaveis = listResponsaveis.filter(
    (t) =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.telefone.includes(searchTerm)
  );

  // Carregar status_acesso da tabela perfis_usuarios
  useEffect(() => {
    async function loadStatuses() {
      if (!isDbConfigured) return;
      try {
        const { data, error } = await supabase
          .from('perfis_usuarios')
          .select('id, status_acesso');
        
        if (!error && data) {
          const mapped: Record<string, boolean> = {};
          data.forEach((item) => {
            mapped[item.id] = item.status_acesso;
          });
          setStatuses(mapped);
        }
      } catch (err) {
        console.error('Erro ao buscar status de acesso:', err);
      }
    }
    loadStatuses();
  }, [dbResponsaveis, isDbConfigured]);

  // Gerador de Senha Forte Automático
  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let newPassword = '';
    // Garante requisitos de complexidade
    newPassword += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    newPassword += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    newPassword += '0123456789'[Math.floor(Math.random() * 10)];
    newPassword += '!@#$%&*'[Math.floor(Math.random() * 7)];
    
    for (let i = 4; i < 10; i++) {
      newPassword += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Embaralha os caracteres
    const shuffled = newPassword.split('').sort(() => 0.5 - Math.random()).join('');
    setSenha(shuffled);
    setShowPassword(true);
  };

  // Máscara de Telefone (WhatsApp) (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '').slice(0, 11);
    
    if (digits.length === 0) {
      setTelefone('');
    } else if (digits.length <= 2) {
      setTelefone(`(${digits}`);
    } else if (digits.length <= 6) {
      setTelefone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else if (digits.length <= 10) {
      setTelefone(`(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`);
    } else {
      setTelefone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
    }
  };

  // Cadastrar Técnico e Acesso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!nome.trim() || !telefone.trim() || !email.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const senhaFinal = senha.trim() || 'OkkaTeam2026!';

    try {
      if (isDbConfigured) {
        // Enviar os dados incluindo a senha personalizada para a Server Action
        await createResponsavel({ 
          nome: nome.trim(), 
          telefone: telefone.trim(), 
          email: email.trim(), 
          senha: senhaFinal 
        } as any);
      } else {
        // Mock local
        const newTecnico: ResponsavelTecnico = {
          id: `local-${Date.now()}`,
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          created_at: new Date().toISOString(),
        };
        setLocalFallback((prev) => [newTecnico, ...prev]);
      }

      // Abre modal de confirmação com dados para cópia
      setNewCredentials({
        nome: nome.trim(),
        email: email.trim(),
        senha: senhaFinal,
      });

      setSuccessMsg('Responsável técnico e acesso cadastrados com sucesso!');
      setNome('');
      setTelefone('');
      setEmail('');
      setSenha('');
      setShowPassword(false);
    } catch (err: unknown) {
      console.error('Erro ao cadastrar:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao salvar responsável técnico.');
    }
  };

  // Alternar Status de Acesso (Ativo / Bloqueado)
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!isDbConfigured) {
      setStatuses((prev) => ({ ...prev, [id]: !currentStatus }));
      setSuccessMsg('Status de acesso alterado localmente!');
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }

    try {
      const newStatus = !currentStatus;
      
      // Atualização otimista
      setStatuses((prev) => ({ ...prev, [id]: newStatus }));

      // Chamar Server Action de atualização de perfil (IAM)
      await updatePerfilUsuario(id, { status_acesso: newStatus });

      setSuccessMsg(`Acesso do técnico ${newStatus ? 'liberado' : 'bloqueado'} com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      // Reverter estado se der erro
      setStatuses((prev) => ({ ...prev, [id]: currentStatus }));
      setErrorMsg(err.message || 'Falha ao alterar status de acesso.');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  // Excluir Técnico e Revogar Acesso
  const handleDelete = async (id: string, tecnicoNome: string) => {
    if (window.confirm(`Deseja realmente excluir o técnico ${tecnicoNome}? Isso removerá permanentemente seu cadastro e revogará seu acesso ao CRM.`)) {
      try {
        if (isDbConfigured) {
          await deleteResponsavel(id);
        } else {
          setLocalFallback((prev) => prev.filter((t) => t.id !== id));
        }
        setSuccessMsg('Técnico e acesso removidos com sucesso!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err: unknown) {
        console.error('Erro ao excluir:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Falha ao excluir técnico.');
        setTimeout(() => setErrorMsg(''), 5000);
      }
    }
  };

  // Copiar Credenciais Individuais
  const handleCopyCredentials = (tecnico: ResponsavelTecnico) => {
    const loginLink = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://okka.com.br/login';
    const text = `Acesso OKKA CRM (Técnico Operacional):\nOlá ${tecnico.nome},\nSeu acesso foi configurado!\nLink: ${loginLink}\nE-mail: ${tecnico.email}\nSenha padrão: OkkaTeam2026!`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(tecnico.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Copiar do modal de credenciais recém criadas
  const handleCopyNewCredentials = () => {
    if (!newCredentials) return;
    const loginLink = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://okka.com.br/login';
    const text = `Acesso OKKA CRM (Técnico Operacional):\nOlá ${newCredentials.nome},\nSeu acesso foi configurado!\nLink: ${loginLink}\nE-mail: ${newCredentials.email}\nSenha: ${newCredentials.senha}`;
    
    navigator.clipboard.writeText(text);
    showToastAlert('Credenciais copiadas para a área de transferência!');
  };

  // Toast temporário secundário
  const [toastAlert, setToastAlert] = useState<string | null>(null);
  const showToastAlert = (msg: string) => {
    setToastAlert(msg);
    setTimeout(() => setToastAlert(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#FCFBFA] text-[#0B0F19] p-6 md:p-10 font-sans relative selection:bg-[#E25B3C] selection:text-white">
      
      {/* Toast Alert Secundário */}
      {toastAlert && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-900 border border-gray-800 text-white shadow-2xl transition-all duration-300">
          <span className="text-sm font-semibold">{toastAlert}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-7">

        {/* Header */}
        <div>
          <span className="text-[10px] font-bold text-[#E25B3C] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            CRM Operacional - Conta Mestra
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">Equipe & Acessos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre os instaladores técnicos, configure ou revogue seus acessos ao CRM e gerencie credenciais.
          </p>
        </div>

        {/* Stats Rápidos */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-white border border-gray-200/80 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#E25B3C]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">{listResponsaveis.length}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Técnicos Credenciados</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">Canal de Restrição de RLS Ativo (Vê apenas suas visitas)</span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-transparent border-t-white animate-spin" />
              <span className="text-xs font-bold text-orange-700">Sincronizando...</span>
            </div>
          )}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* Formulário de Cadastro Centralizado */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200/80 rounded-3xl shadow-sm overflow-hidden sticky top-6">
              <div className="h-1.5 bg-gradient-to-r from-[#E25B3C] to-amber-500" />
              
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#E25B3C]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  Cadastrar Técnico & Acesso
                </h2>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Cria a conta do profissional e seu login ao mesmo tempo.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="nome" className="text-xs font-bold uppercase tracking-wider text-gray-400">Nome Completo</label>
                  <input
                    type="text"
                    id="nome"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João da Silva"
                    disabled={isCreating}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#E25B3C] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="telefone" className="text-xs font-bold uppercase tracking-wider text-gray-400">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    id="telefone"
                    required
                    value={telefone}
                    onChange={handlePhoneChange}
                    placeholder="Ex: (41) 99999-9999"
                    disabled={isCreating}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#E25B3C] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-400">E-mail Profissional</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: joao@email.com"
                    disabled={isCreating}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#E25B3C] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                </div>

                {/* Senha e Gerador */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="senha" className="text-xs font-bold uppercase tracking-wider text-gray-400">Senha de Acesso</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-[#E25B3C] hover:text-orange-600 font-bold uppercase tracking-wider"
                    >
                      Gerar Senha
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Deixe em branco para usar padrão"
                      disabled={isCreating}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#E25B3C] focus:ring-2 focus:ring-orange-100 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{successMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2.5 bg-gradient-to-r from-[#E25B3C] to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Provisionando...
                    </>
                  ) : (
                    <>
                      Criar Credencial
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Listagem de Técnicos e Gestão de Status */}
          <div className="lg:col-span-2 space-y-5">

            {/* Barra de Busca */}
            <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#E25B3C] focus:ring-2 focus:ring-orange-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold"
                />
              </div>
            </div>

            {/* Tabela de Técnicos */}
            {filteredResponsaveis.length === 0 ? (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-14 text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm font-bold">Nenhum técnico cadastrado.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <th className="py-4 px-6">Técnico</th>
                        <th className="py-4 px-6">WhatsApp / E-mail</th>
                        <th className="py-4 px-6">Cadastro</th>
                        <th className="py-4 px-6">Status de Acesso</th>
                        <th className="py-4 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm font-medium">
                      {filteredResponsaveis.map((tecnico, idx) => {
                        const avatarGradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const initials = tecnico.nome
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase();
                        
                        const isLocalUser = tecnico.id.startsWith('local-');
                        const statusAcesso = statuses[tecnico.id] ?? true;

                        return (
                          <tr key={tecnico.id} className="hover:bg-gray-50/50 transition-colors group">
                            {/* Técnico */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0`}>
                                  {initials}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 group-hover:text-[#E25B3C] transition-colors">
                                    {tecnico.nome}
                                  </p>
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-0.5 inline-block">
                                    Técnico Credenciado
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Contatos */}
                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <p className="text-xs text-gray-700 font-bold flex items-center gap-1.5">
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {tecnico.telefone}
                                </p>
                                <p className="text-[11px] text-gray-400 font-semibold truncate flex items-center gap-1.5" title={tecnico.email}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {tecnico.email}
                                </p>
                              </div>
                            </td>

                            {/* Data */}
                            <td className="py-4 px-6 text-xs text-gray-500 font-semibold">
                              {new Date(tecnico.created_at).toLocaleDateString('pt-BR')}
                            </td>

                            {/* Status Acesso Toggle Switch */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2.5">
                                <button
                                  role="switch"
                                  aria-checked={statusAcesso}
                                  disabled={isLocalUser}
                                  onClick={() => handleToggleStatus(tecnico.id, statusAcesso)}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed ${
                                    statusAcesso ? 'bg-[#E25B3C]' : 'bg-gray-250'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                      statusAcesso ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${statusAcesso ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {statusAcesso ? 'Ativo' : 'Bloqueado'}
                                </span>
                              </div>
                            </td>

                            {/* Ações */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Botão Copiar Acesso */}
                                <button
                                  onClick={() => handleCopyCredentials(tecnico)}
                                  title="Copiar Credenciais de Acesso"
                                  className="p-2 text-gray-400 hover:text-[#E25B3C] hover:bg-orange-50 rounded-xl transition-all cursor-pointer"
                                >
                                  {copiedId === tecnico.id ? (
                                    <svg className="w-4 h-4 text-emerald-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 4h6m-6 4h6m-6 4h4" />
                                    </svg>
                                  )}
                                </button>

                                {/* Botão Excluir */}
                                <button
                                  onClick={() => handleDelete(tecnico.id, tecnico.nome)}
                                  disabled={isDeleting}
                                  title="Excluir Técnico e Revogar Acesso"
                                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-40"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal / Dialog de Confirmação de Novas Credenciais */}
      {newCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setNewCredentials(null)} className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs" />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-150 transform transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#E25B3C] to-amber-500" />
            
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">Acesso Criado com Sucesso!</h3>
              <p className="text-xs text-gray-500 mt-1">Copie os dados de acesso abaixo para enviar ao técnico.</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5 font-mono text-xs select-all relative group">
                <p><strong className="text-gray-400 font-sans uppercase text-[10px] tracking-wider block">Nome do Técnico:</strong> {newCredentials.nome}</p>
                <p><strong className="text-gray-400 font-sans uppercase text-[10px] tracking-wider block">E-mail / Login:</strong> {newCredentials.email}</p>
                <p><strong className="text-gray-400 font-sans uppercase text-[10px] tracking-wider block">Senha de Acesso:</strong> {newCredentials.senha}</p>
                <p><strong className="text-gray-400 font-sans uppercase text-[10px] tracking-wider block">Link de Acesso:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://okka.com.br/login'}</p>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                ⚠️ Por questões de segurança, a senha é exibida apenas uma vez. Copie-a agora!
              </p>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-2.5 bg-gray-50">
              <button
                onClick={() => setNewCredentials(null)}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={handleCopyNewCredentials}
                className="px-4.5 py-2 bg-[#E25B3C] hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 4h6m-6 4h6m-6 4h4" />
                </svg>
                Copiar Acesso
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
