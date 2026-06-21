'use client';

import React, { useState, useEffect } from 'react';
import { 
  getSaaSEmpresas, 
  criarEmpresaECliente, 
  atualizarSenhaUsuario, 
  alterarStatusAssinatura,
  atualizarEmpresa,
  alternarBloqueioEmpresa
} from '@/actions/superadmin';
import { supabase } from '@/lib/supabase';

interface EmpresaMetric {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  status_assinatura: 'ativa' | 'inadimplente' | 'cancelada';
  assinatura_mp_id: string | null;
  criado_em: string;
  mestre: {
    id: string;
    nome: string;
    email: string;
  } | null;
  metricas: {
    leads: number;
    projetos: number;
  };
}

export default function SuperAdminDashboard() {
  const [empresas, setEmpresas] = useState<EmpresaMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados dos Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados de Senha (olho)
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Estados de Operação
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaMetric | null>(null);
  
  // Form de Criação de Empresa
  const [newCompanyForm, setNewCompanyForm] = useState({
    nome_fantasia: '',
    cnpj: '',
    nome_mestre: '',
    email: '',
    password: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Form de Reset de Senha
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Form de Edição de Empresa
  const [editCompanyForm, setEditCompanyForm] = useState({
    nome_fantasia: '',
    cnpj: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  // Form de Alteração de Status
  const [statusLoading, setStatusLoading] = useState(false);

  // Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar Dados
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await getSaaSEmpresas();
      if (res.success && res.data) {
        setEmpresas(res.data as EmpresaMetric[]);
      } else {
        setError(res.error || 'Erro ao carregar dados do SaaS.');
        // Dados mockados de fallback se a migração não tiver sido rodada ou der erro
        setEmpresas(getMockData());
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro de rede ou banco de dados. Exibindo dados de demonstração.');
      setEmpresas(getMockData());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      window.location.href = '/';
    }
  };

  // Cadastrar Empresa
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await criarEmpresaECliente(newCompanyForm);
      if (res.success) {
        const passwordBackup = newCompanyForm.password || 'OkkaMestre2026!';
        setSuccessMsg(`Empresa "${newCompanyForm.nome_fantasia}" cadastrada com sucesso! Senha temporária do Mestre: ${passwordBackup}`);
        setIsCreateModalOpen(false);
        setNewCompanyForm({
          nome_fantasia: '',
          cnpj: '',
          nome_mestre: '',
          email: '',
          password: ''
        });
        loadData();
      } else {
        setError(res.error || 'Erro ao cadastrar empresa.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao cadastrar empresa.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Alterar Senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa || !selectedEmpresa.mestre) return;
    setPasswordLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await atualizarSenhaUsuario(selectedEmpresa.mestre.id, newPassword);
      if (res.success) {
        const passwordBackup = newPassword;
        setSuccessMsg(`Senha do usuário ${selectedEmpresa.mestre.email} redefinida com sucesso! Nova senha configurada: ${passwordBackup}`);
        setIsPasswordModalOpen(false);
        setNewPassword('');
      } else {
        setError(res.error || 'Erro ao redefinir senha.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Editar Empresa
  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa) return;
    setEditLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await atualizarEmpresa(selectedEmpresa.id, editCompanyForm);
      if (res.success) {
        setSuccessMsg(`Dados da empresa "${editCompanyForm.nome_fantasia}" atualizados com sucesso!`);
        setIsEditModalOpen(false);
        loadData();
      } else {
        setError(res.error || 'Erro ao atualizar dados da empresa.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setEditLoading(false);
    }
  };

  // Alterar Status da Assinatura
  const handleChangeStatus = async (status: 'ativa' | 'inadimplente' | 'cancelada') => {
    if (!selectedEmpresa) return;
    setStatusLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await alterarStatusAssinatura(selectedEmpresa.id, status);
      if (res.success) {
        setSuccessMsg(`Assinatura da empresa "${selectedEmpresa.nome_fantasia}" alterada para "${status}"!`);
        setIsStatusModalOpen(false);
        loadData();
      } else {
        setError(res.error || 'Erro ao alterar status da assinatura.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Mock data para fallback/visualização inicial
  function getMockData(): EmpresaMetric[] {
    return [
      {
        id: '1',
        nome_fantasia: 'Okka Construtora & Calefação',
        cnpj: '12.345.678/0001-90',
        status_assinatura: 'ativa',
        assinatura_mp_id: 'sub_mp_123456',
        criado_em: '2026-01-10T12:00:00Z',
        mestre: {
          id: 'u1',
          nome: 'Roberto Santiago',
          email: 'roberto@okka.com.br'
        },
        metricas: {
          leads: 42,
          projetos: 15
        }
      },
      {
        id: '2',
        nome_fantasia: 'Sollux Soluções Térmicas',
        cnpj: '98.765.432/0001-10',
        status_assinatura: 'ativa',
        assinatura_mp_id: 'sub_mp_789101',
        criado_em: '2026-03-15T15:30:00Z',
        mestre: {
          id: 'u2',
          nome: 'Clara Mendes',
          email: 'clara@sollux.com'
        },
        metricas: {
          leads: 28,
          projetos: 8
        }
      },
      {
        id: '3',
        nome_fantasia: 'WarmPiso Aquecedores',
        cnpj: '45.678.901/0001-22',
        status_assinatura: 'inadimplente',
        assinatura_mp_id: 'sub_mp_112131',
        criado_em: '2026-04-01T09:00:00Z',
        mestre: {
          id: 'u3',
          nome: 'Felipe Dantas',
          email: 'felipe@warmpiso.com'
        },
        metricas: {
          leads: 15,
          projetos: 4
        }
      },
      {
        id: '4',
        nome_fantasia: 'EcoHeat Brasil',
        cnpj: '33.222.111/0001-44',
        status_assinatura: 'cancelada',
        assinatura_mp_id: 'sub_mp_415161',
        criado_em: '2026-02-20T10:15:00Z',
        mestre: {
          id: 'u4',
          nome: 'Mariana Lima',
          email: 'mariana@ecoheat.com.br'
        },
        metricas: {
          leads: 64,
          projetos: 22
        }
      }
    ];
  }

  // Filtrar empresas
  const filteredEmpresas = empresas.filter(emp => 
    emp.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cnpj.includes(searchTerm) ||
    emp.mestre?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.mestre?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos de Métricas
  const totalClientes = empresas.length;
  const clientesAtivos = empresas.filter(emp => emp.status_assinatura === 'ativa').length;
  const clientesInadimplentes = empresas.filter(emp => emp.status_assinatura === 'inadimplente').length;
  
  // Assumindo mensalidade padrão de R$ 2.490,00
  const valorMensalidade = 2490;
  const MRR = clientesAtivos * valorMensalidade;

  // Novas assinaturas no mês corrente (Junho 2026)
  const novasAssinaturasMes = empresas.filter(emp => {
    const dataCriacao = new Date(emp.criado_em);
    return dataCriacao.getMonth() === 5 && dataCriacao.getFullYear() === 2026; // Junho é índice 5
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10 selection:bg-violet-500 selection:text-white">
      {/* Background Neon Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Container Principal */}
      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md shadow-violet-500/20">
                SaaS Owner
              </span>
              <span className="text-slate-500 text-sm">v2.4.0</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight mt-1 bg-gradient-to-r from-slate-100 via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Hubly Pro <span className="text-violet-500">Super Admin</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Gestão administrativa, controle de faturamento e monitoramento multi-tenant.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-violet-500/35 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Nova Empresa
            </button>
            
            <button
              onClick={handleSignOut}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
        </header>

        {/* Mensagens de Feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-medium">{successMsg}</div>
          </div>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card MRR */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full group-hover:bg-violet-500/10 transition-colors" />
            <div className="text-xs font-bold text-violet-400 uppercase tracking-widest">Receita Estimada (MRR)</div>
            <div className="text-3xl font-black mt-2 tracking-tight">
              R$ {MRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Clientes ativos × R$ {valorMensalidade.toLocaleString('pt-BR')}/mês</p>
          </div>

          {/* Card Clientes Ativos */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Clientes Ativos</div>
            <div className="text-3xl font-black mt-2 tracking-tight">{clientesAtivos}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{totalClientes} empresas cadastradas no total</p>
          </div>

          {/* Card Clientes Inadimplentes */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors" />
            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">Clientes Inadimplentes</div>
            <div className="text-3xl font-black mt-2 tracking-tight">{clientesInadimplentes}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Acesso temporariamente bloqueado</p>
          </div>

          {/* Card Novas Assinaturas no Mês */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-fuchsia-500/40 hover:shadow-lg hover:shadow-fuchsia-500/5 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-bl-full group-hover:bg-fuchsia-500/10 transition-colors" />
            <div className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest">Assinaturas no Mês</div>
            <div className="text-3xl font-black mt-2 tracking-tight">+{novasAssinaturasMes}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Novos contratos gerados em Junho/2026</p>
          </div>

        </section>

        {/* Tabela de Gestão de Clientes */}
        <section className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Empresas Contratantes</h2>
              <p className="text-slate-400 text-xs mt-0.5">Monitore os dados cadastrais, responsável pela conta e faturamento por empresa.</p>
            </div>
            
            <div className="relative max-w-xs w-full shrink-0">
              <input
                type="text"
                placeholder="Buscar por empresa, CNPJ, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-violet-500 text-slate-100 rounded-xl py-2 px-10 text-xs outline-none transition-all placeholder:text-slate-500"
              />
              <svg className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-5">Empresa</th>
                  <th className="py-4 px-5">CNPJ</th>
                  <th className="py-4 px-5">Responsável (Mestre)</th>
                  <th className="py-4 px-5">Uso da Instalação</th>
                  <th className="py-4 px-5">Status do Pagamento</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 font-medium">
                      Carregando informações das empresas...
                    </td>
                  </tr>
                ) : filteredEmpresas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 font-medium">
                      Nenhuma empresa encontrada com os critérios de busca.
                    </td>
                  </tr>
                ) : (
                  filteredEmpresas.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-5 font-semibold text-slate-200">
                        {emp.nome_fantasia}
                      </td>
                      <td className="py-4 px-5 text-slate-400 font-mono">
                        {emp.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                      </td>
                      <td className="py-4 px-5">
                        {emp.mestre ? (
                          <div>
                            <div className="text-slate-300 font-medium">{emp.mestre.nome}</div>
                            <div className="text-slate-500 text-[11px]">{emp.mestre.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Sem responsável vinculado</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-400">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-slate-200 font-semibold">{emp.metricas.leads}</span> leads
                          </div>
                          <div className="w-1 h-1 rounded-full bg-slate-800" />
                          <div>
                            <span className="text-slate-200 font-semibold">{emp.metricas.projetos}</span> projetos
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          emp.status_assinatura === 'ativa'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            emp.status_assinatura === 'ativa'
                              ? 'bg-emerald-400'
                              : 'bg-rose-500'
                          }`} />
                          {emp.status_assinatura === 'ativa' ? 'Ativo' : 'Não Pago / Bloqueado'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={async () => {
                            const isCurrentlyBlocked = emp.status_assinatura === 'inadimplente' || emp.status_assinatura === 'cancelada';
                            const newStatus = isCurrentlyBlocked ? 'ativa' : 'inadimplente';
                            try {
                              const res = await alternarBloqueioEmpresa(emp.id, newStatus);
                              if (res.success) {
                                setSuccessMsg(`Acesso da empresa "${emp.nome_fantasia}" ${isCurrentlyBlocked ? 'liberado' : 'bloqueado'} com sucesso!`);
                                loadData();
                              } else {
                                setError(res.error || 'Erro ao alterar status de acesso.');
                              }
                            } catch (err: any) {
                              setError(err.message || 'Erro de conexão.');
                            }
                          }}
                          className={`py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            emp.status_assinatura === 'inadimplente' || emp.status_assinatura === 'cancelada'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                              : 'bg-slate-900 border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400'
                          }`}
                        >
                          {emp.status_assinatura === 'inadimplente' || emp.status_assinatura === 'cancelada' ? 'Desbloquear Acesso' : 'Bloquear Acesso'}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedEmpresa(emp);
                            setEditCompanyForm({
                              nome_fantasia: emp.nome_fantasia,
                              cnpj: emp.cnpj
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => {
                            setSelectedEmpresa(emp);
                            setIsStatusModalOpen(true);
                          }}
                          className="bg-slate-900 border border-slate-800 hover:border-violet-500/40 text-slate-300 hover:text-violet-400 py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Faturamento
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedEmpresa(emp);
                            setIsPasswordModalOpen(true);
                          }}
                          disabled={!emp.mestre}
                          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-400 py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Resetar Senha
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* =========================================================================
          MODAL: CADASTRAR NOVA EMPRESA E CLIENTE MESTRE
          ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-bl-full pointer-events-none" />
            
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Cadastrar Nova Empresa</h3>
                <p className="text-slate-400 text-xs mt-0.5">Gera a empresa e a respectiva conta master ("mestre") do tenant.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
              {/* Nome Fantasia */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nome Fantasia da Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Construtora Alfa Ltda"
                  value={newCompanyForm.nome_fantasia}
                  onChange={(e) => setNewCompanyForm({...newCompanyForm, nome_fantasia: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-4 text-xs outline-none text-slate-200 placeholder:text-slate-650"
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CNPJ</label>
                <input
                  type="text"
                  required
                  placeholder="Apenas números ou formato CNPJ"
                  value={newCompanyForm.cnpj}
                  onChange={(e) => setNewCompanyForm({...newCompanyForm, cnpj: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-4 text-xs outline-none text-slate-200 placeholder:text-slate-650"
                />
              </div>

              <div className="h-px bg-slate-850 my-2" />

              {/* Nome do Usuário Responsável */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nome do Usuário Mestre</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Oliveira"
                  value={newCompanyForm.nome_mestre}
                  onChange={(e) => setNewCompanyForm({...newCompanyForm, nome_mestre: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-4 text-xs outline-none text-slate-200 placeholder:text-slate-650"
                />
              </div>

              {/* E-mail do Responsável */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">E-mail do Usuário Mestre</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: adm@empresa.com"
                  value={newCompanyForm.email}
                  onChange={(e) => setNewCompanyForm({...newCompanyForm, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-4 text-xs outline-none text-slate-200 placeholder:text-slate-650"
                />
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Senha Provisória</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    placeholder="Padrão: OkkaMestre2026! (Opcional)"
                    value={newCompanyForm.password}
                    onChange={(e) => setNewCompanyForm({...newCompanyForm, password: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 pl-4 pr-10 text-xs outline-none text-slate-200 placeholder:text-slate-650"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                  >
                    {showCreatePassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-transparent hover:bg-slate-850 text-slate-400 hover:text-slate-100 py-2 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2 px-5 rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {createLoading ? 'Salvando...' : 'Criar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RESETAR SENHA DO USUÁRIO
          ========================================================================= */}
      {isPasswordModalOpen && selectedEmpresa && selectedEmpresa.mestre && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden animate-slide-up">
            
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Forçar Nova Senha</h3>
                <p className="text-slate-400 text-xs mt-0.5">Altera as credenciais de acesso do usuário no Supabase Auth.</p>
              </div>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setNewPassword('');
                }}
                className="text-slate-400 hover:text-slate-100 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Usuário Selecionado</div>
                <div className="text-xs font-semibold text-slate-300">{selectedEmpresa.mestre.nome}</div>
                <div className="text-xs text-slate-500 font-mono">{selectedEmpresa.mestre.email}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Minimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 pl-4 pr-10 text-xs outline-none text-slate-200 placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                  >
                    {showResetPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setNewPassword('');
                  }}
                  className="bg-transparent hover:bg-slate-850 text-slate-400 hover:text-slate-100 py-2 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-5 rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {passwordLoading ? 'Alterando...' : 'Confirmar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: GERENCIAR STATUS DE ASSINATURA (FATURAMENTO)
          ========================================================================= */}
      {isStatusModalOpen && selectedEmpresa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden animate-slide-up">
            
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Faturamento & Assinatura</h3>
                <p className="text-slate-400 text-xs mt-0.5">Configure manualmente o status de adimplência do tenant.</p>
              </div>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Empresa Selecionada</div>
                <div className="text-xs font-semibold text-slate-300">{selectedEmpresa.nome_fantasia}</div>
                <div className="text-xs text-slate-500 font-mono">ID Mercado Pago: {selectedEmpresa.assinatura_mp_id || 'Não vinculado'}</div>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Alterar Status da Assinatura</div>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleChangeStatus('ativa')}
                    disabled={statusLoading}
                    className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-wide text-center transition-all cursor-pointer ${
                      selectedEmpresa.status_assinatura === 'ativa'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-md shadow-emerald-500/5'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    Ativa
                  </button>

                  <button
                    onClick={() => handleChangeStatus('inadimplente')}
                    disabled={statusLoading}
                    className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-wide text-center transition-all cursor-pointer ${
                      selectedEmpresa.status_assinatura === 'inadimplente'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-md shadow-amber-500/5'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    Inadimplente
                  </button>

                  <button
                    onClick={() => handleChangeStatus('cancelada')}
                    disabled={statusLoading}
                    className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-wide text-center transition-all cursor-pointer ${
                      selectedEmpresa.status_assinatura === 'cancelada'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-md shadow-rose-500/5'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    Cancelada
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-850" />

              <div className="flex items-center justify-end">
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white py-2 px-5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDITAR DADOS DA EMPRESA
          ========================================================================= */}
      {isEditModalOpen && selectedEmpresa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-bl-full pointer-events-none" />
            
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Editar Dados da Empresa</h3>
                <p className="text-slate-400 text-xs mt-0.5">Atualiza o nome fantasia e o CNPJ da empresa.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditCompany} className="p-6 space-y-4">
              {/* Nome Fantasia */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nome Fantasia da Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Construtora Alfa Ltda"
                  value={editCompanyForm.nome_fantasia}
                  onChange={(e) => setEditCompanyForm({...editCompanyForm, nome_fantasia: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-4 text-xs outline-none text-slate-200 placeholder:text-slate-655"
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CNPJ</label>
                <input
                  type="text"
                  required
                  placeholder="Apenas números ou formato CNPJ"
                  value={editCompanyForm.cnpj}
                  onChange={(e) => setEditCompanyForm({...editCompanyForm, cnpj: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-4 text-xs outline-none text-slate-200 placeholder:text-slate-655"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-transparent hover:bg-slate-850 text-slate-400 hover:text-slate-100 py-2 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2 px-5 rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
