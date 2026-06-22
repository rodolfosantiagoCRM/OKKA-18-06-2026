'use client';

import React, { useState, useEffect } from 'react';
import { 
  getPerfisUsuarios, 
  atualizarUsuarioCompleto, 
  criarUsuarioCompleto,
  getPermissoesAbas,
  atualizarPermissoesAbas,
  type PermissoesAbas
} from '@/app/actions/usuarios';
import { deleteResponsavelTecnico } from '@/app/actions/responsaveis';
import { PerfilUsuario } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

interface Colaborador {
  id: string;
  nome_completo: string;
  email: string;
  role: 'admin' | 'instalador' | 'tecnico' | 'mestre' | 'vendedor';
  status_acesso: boolean;
  created_at: string;
  telefone?: string;
}

const MOCK_COLABORADORES: Colaborador[] = [
  {
    id: 'local-mestre',
    nome_completo: 'Gerente Mestre HUBLY PRO',
    email: 'mestre@hublypro.com.br',
    role: 'mestre',
    status_acesso: true,
    created_at: '2026-06-01T12:00:00Z',
    telefone: '(41) 99999-1111',
  },
  {
    id: 'local-vendedor',
    nome_completo: 'Juliana Mendes',
    email: 'juliana.vendas@hublypro.com.br',
    role: 'vendedor',
    status_acesso: true,
    created_at: '2026-06-10T14:30:00Z',
    telefone: '(41) 98888-2222',
  },
  {
    id: 'local-instalador',
    nome_completo: 'Carlos Eduardo Silva',
    email: 'carlos.silva@hublypro.com.br',
    role: 'instalador',
    status_acesso: true,
    created_at: '2026-06-18T10:00:00Z',
    telefone: '(41) 98888-1234',
  },
  {
    id: 'local-tecnico',
    nome_completo: 'Fernanda Lima Souza',
    email: 'fernanda.lima@hublypro.com.br',
    role: 'tecnico',
    status_acesso: true,
    created_at: '2026-06-19T08:00:00Z',
    telefone: '(41) 97777-5678',
  },
];

const AVATAR_COLORS = [
  'from-orange-400 to-amber-500 shadow-orange-500/10',
  'from-blue-400 to-indigo-500 shadow-blue-500/10',
  'from-emerald-400 to-teal-500 shadow-emerald-500/10',
  'from-purple-400 to-violet-500 shadow-purple-500/10',
  'from-rose-400 to-pink-500 shadow-rose-500/10',
];

export default function ResponsaveisTecnicosPage() {
  const [usuarios, setUsuarios] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Ações pendentes
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Usuário Logado
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estados de Cadastro
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'admin' | 'instalador' | 'tecnico' | 'mestre' | 'vendedor'>('tecnico');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Edição (Modal)
  const [editingUser, setEditingUser] = useState<Colaborador | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'instalador' | 'tecnico' | 'mestre' | 'vendedor'>('tecnico');
  const [editSenha, setEditSenha] = useState('');
  const [editShowPassword, setEditShowPassword] = useState(false);

  // Feedbacks
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ email: string; senha: string; nome: string; telefone?: string; isEdit?: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Controle de Permissões de Abas
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permsList, setPermsList] = useState<PermissoesAbas[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const [localFallback, setLocalFallback] = useState<Colaborador[]>(MOCK_COLABORADORES);
  
  const isDbConfigured = 
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Carregar dados iniciais
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Obter sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }

      if (isDbConfigured) {
        const perfis = await getPerfisUsuarios();
        
        // Buscar telefones das tabelas correspondentes
        const { data: rts } = await supabase
          .from('responsaveis_tecnicos')
          .select('id, telefone');
        
        let perfisLegado: any[] = [];
        try {
          const { data } = await supabase
            .from('perfis')
            .select('id, telefone');
          if (data) perfisLegado = data;
        } catch (e) {
          // Ignorar se a tabela legada não existir
        }

        const merged: Colaborador[] = perfis.map((p) => {
          const rt = rts?.find((r) => r.id === p.id);
          const pLegado = perfisLegado.find((pl) => pl.id === p.id);
          return {
            id: p.id,
            nome_completo: p.nome_completo,
            email: p.email,
            role: p.role,
            status_acesso: p.status_acesso,
            created_at: p.created_at,
            telefone: rt?.telefone || pLegado?.telefone || '',
          };
        });

        setUsuarios(merged);
      } else {
        // Mock fallback local
        setUsuarios(localFallback);
        if (!currentUserId) {
          setCurrentUserId('local-mestre');
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      showToast('error', err.message || 'Erro ao sincronizar equipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDbConfigured]);

  const handleOpenPermissionsModal = async () => {
    setIsPermModalOpen(true);
    setLoadingPerms(true);
    try {
      const data = await getPermissoesAbas();
      setPermsList(data);
    } catch (e) {
      console.error(e);
      showToast('error', 'Erro ao carregar permissões das abas.');
    } finally {
      setLoadingPerms(false);
    }
  };

  const handleTogglePermCheckbox = (roleKey: string, field: keyof Omit<PermissoesAbas, 'role' | 'updated_at'>) => {
    setPermsList((prev) =>
      prev.map((p) => {
        if (p.role === roleKey) {
          return {
            ...p,
            [field]: !p[field],
          };
        }
        return p;
      })
    );
  };

  const handleSavePermissions = async () => {
    setSavingPerms(true);
    try {
      for (const p of permsList) {
        const res = await atualizarPermissoesAbas(p.role, {
          dashboard: p.dashboard,
          leads: p.leads,
          visitas: p.visitas,
          projetos: p.projetos,
          equipe: p.equipe,
          eficiencia: p.eficiencia,
        });
        if (res && !res.success) {
          throw new Error(res.error || `Erro ao salvar permissões para role ${p.role}`);
        }
      }
      showToast('success', 'Permissões de abas salvas com sucesso!');
      setIsPermModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      console.error(e);
      showToast('error', e.message || 'Erro ao salvar permissões de abas.');
    } finally {
      setSavingPerms(false);
    }
  };

  const getFriendlyRoleName = (r: string) => {
    switch (r) {
      case 'admin': return 'Administrador';
      case 'mestre': return 'Mestre (Gerente)';
      case 'vendedor': return 'Vendedor';
      case 'tecnico': return 'Técnico';
      case 'instalador': return 'Instalador';
      default: return r;
    }
  };

  // Gerador de Senha Forte Automático
  const handleGeneratePassword = (isEdit = false) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let newPassword = '';
    newPassword += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    newPassword += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    newPassword += '0123456789'[Math.floor(Math.random() * 10)];
    newPassword += '!@#$%&*'[Math.floor(Math.random() * 7)];
    
    for (let i = 4; i < 12; i++) {
      newPassword += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const shuffled = newPassword.split('').sort(() => 0.5 - Math.random()).join('');
    
    if (isEdit) {
      setEditSenha(shuffled);
      setEditShowPassword(true);
    } else {
      setSenha(shuffled);
      setShowPassword(true);
    }
  };

  // Máscara de Telefone (WhatsApp) (XX) XXXXX-XXXX
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Envio de Cadastro de Novo Usuário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      showToast('error', 'Nome completo e E-mail são obrigatórios.');
      return;
    }

    const senhaFinal = senha.trim() || 'HublyTeam2026!';
    setIsCreating(true);

    try {
      if (isDbConfigured) {
        const res = await criarUsuarioCompleto({
          nome_completo: nome.trim(),
          email: email.trim(),
          password: senhaFinal,
          role: role,
          telefone: telefone.trim(),
          status_acesso: true
        });
        if (res && !res.success) {
          throw new Error(res.error || 'Falha ao criar colaborador.');
        }
        await loadData();
      } else {
        const newUser: Colaborador = {
          id: `local-${Date.now()}`,
          nome_completo: nome.trim(),
          email: email.trim(),
          role: role,
          telefone: telefone.trim(),
          status_acesso: true,
          created_at: new Date().toISOString()
        };
        setLocalFallback((prev) => [newUser, ...prev]);
        setUsuarios((prev) => [newUser, ...prev]);
      }

      setNewCredentials({
        nome: nome.trim(),
        email: email.trim(),
        senha: senhaFinal,
        telefone: telefone.trim(),
      });

      showToast('success', 'Colaborador e credenciais cadastrados com sucesso!');
      setNome('');
      setTelefone('');
      setEmail('');
      setSenha('');
      setRole('tecnico');
      setShowPassword(false);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Erro ao criar conta de acesso.');
    } finally {
      setIsCreating(false);
    }
  };

  // Iniciar Edição (Carregar dados no formulário do Modal)
  const startEdit = (user: Colaborador) => {
    setEditingUser(user);
    setEditNome(user.nome_completo);
    setEditEmail(user.email);
    setEditTelefone(user.telefone || '');
    setEditRole(user.role);
    setEditSenha('');
    setEditShowPassword(false);
  };

  // Enviar Edição do Usuário
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editNome.trim() || !editEmail.trim()) {
      showToast('error', 'Nome e e-mail são obrigatórios.');
      return;
    }

    setIsUpdating(editingUser.id);

    try {
      if (isDbConfigured) {
        const res = await atualizarUsuarioCompleto(editingUser.id, {
          nome_completo: editNome.trim(),
          email: editEmail.trim(),
          role: editRole,
          telefone: editTelefone.trim(),
          password: editSenha.trim() || undefined,
        });
        if (res && !res.success) {
          throw new Error(res.error || 'Falha ao atualizar colaborador.');
        }
        await loadData();
      } else {
        setUsuarios((prev) => 
          prev.map((u) => 
            u.id === editingUser.id 
              ? { 
                  ...u, 
                  nome_completo: editNome.trim(), 
                  email: editEmail.trim(), 
                  role: editRole, 
                  telefone: editTelefone.trim() 
                } 
              : u
          )
        );
        showToast('success', 'Colaborador atualizado localmente!');
      }

      showToast('success', `Os dados de ${editNome} foram atualizados.`);
      if (editSenha.trim()) {
        setNewCredentials({
          nome: editNome.trim(),
          email: editEmail.trim(),
          senha: editSenha.trim(),
          telefone: editTelefone.trim(),
          isEdit: true,
        });
      }
      setEditingUser(null);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Alterar Status de Acesso Rápido (Ativo / Bloqueado)
  const handleToggleStatus = async (user: Colaborador) => {
    if (user.id === currentUserId) {
      showToast('error', 'Você não pode bloquear o seu próprio acesso administrativo.');
      return;
    }

    setIsUpdating(user.id);
    const newStatus = !user.status_acesso;

    try {
      if (isDbConfigured) {
        const res = await atualizarUsuarioCompleto(user.id, {
          status_acesso: newStatus,
        });
        if (res && !res.success) {
          throw new Error(res.error || 'Falha ao alterar permissão de acesso.');
        }
        await loadData();
      } else {
        setUsuarios((prev) => 
          prev.map((u) => (u.id === user.id ? { ...u, status_acesso: newStatus } : u))
        );
      }
      showToast('success', `Acesso de ${user.nome_completo} alterado para ${newStatus ? 'Ativo' : 'Bloqueado'}.`);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Erro ao alterar permissão de acesso.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Excluir Colaborador e Revogar Acesso
  const handleDelete = async (id: string, name: string) => {
    if (id === currentUserId) {
      showToast('error', 'Você não pode excluir o seu próprio usuário.');
      return;
    }

    if (window.confirm(`Deseja realmente excluir o colaborador ${name}? Isso removerá permanentemente seu cadastro e revogará seu acesso ao CRM.`)) {
      setIsDeleting(true);
      try {
        if (isDbConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          const res = await deleteResponsavelTecnico(id, token);
          if (res && !res.success) {
            throw new Error(res.error || 'Falha ao excluir colaborador.');
          }
          await loadData();
        } else {
          setLocalFallback((prev) => prev.filter((u) => u.id !== id));
          setUsuarios((prev) => prev.filter((u) => u.id !== id));
        }
        showToast('success', 'Colaborador excluído com sucesso!');
      } catch (err: any) {
        console.error(err);
        showToast('error', err.message || 'Erro ao excluir colaborador.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Copiar Credenciais Individuais
  const handleCopyCredentials = (user: Colaborador) => {
    const loginLink = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://hublypro.com.br/login';
    const roleName = user.role.toUpperCase();
    const text = `Acesso HUBLY PRO CRM (${roleName}):\nOlá ${user.nome_completo},\nSeu acesso foi configurado!\nLink: ${loginLink}\nE-mail: ${user.email}\nSenha: HublyTeam2026!`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Copiar do modal de credenciais recém criadas
  const handleCopyNewCredentials = () => {
    if (!newCredentials) return;
    const loginLink = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://hublypro.com.br/login';
    const text = `Acesso HUBLY PRO CRM:\nOlá ${newCredentials.nome},\nSeu acesso foi configurado!\nLink: ${loginLink}\nE-mail: ${newCredentials.email}\nSenha: ${newCredentials.senha}`;
    
    navigator.clipboard.writeText(text);
    showToast('success', 'Credenciais copiadas para a área de transferência!');
  };

  // Enviar pelo WhatsApp do modal de credenciais recém criadas
  const handleWhatsAppNewCredentials = () => {
    if (!newCredentials) return;
    const loginLink = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://hublypro.com.br/login';
    const text = `Acesso HUBLY PRO CRM:\nOlá ${newCredentials.nome},\nSeu acesso foi configurado!\nLink: ${loginLink}\nE-mail: ${newCredentials.email}\nSenha: ${newCredentials.senha}`;

    const phone = newCredentials.telefone || '';
    if (!phone) {
      showToast('error', 'Telefone do colaborador não cadastrado.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 || cleanPhone.length === 11 
      ? `55${cleanPhone}` 
      : cleanPhone;

    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Enviar Credenciais Individuais via WhatsApp
  const handleSendWhatsAppCredentials = (user: Colaborador) => {
    if (!user.telefone) {
      showToast('error', 'Telefone do colaborador não cadastrado.');
      return;
    }
    const loginLink = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://hublypro.com.br/login';
    const roleName = user.role.toUpperCase();
    const text = `Acesso HUBLY PRO CRM (${roleName}):\nOlá ${user.nome_completo},\nSeu acesso foi configurado!\nLink: ${loginLink}\nE-mail: ${user.email}\nSenha: HublyTeam2026!`;

    const cleanPhone = user.telefone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 || cleanPhone.length === 11 
      ? `55${cleanPhone}` 
      : cleanPhone;

    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filtragem
  const filteredColaboradores = usuarios.filter(
    (u) =>
      u.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.telefone && u.telefone.includes(searchTerm))
  );

  // Estatísticas
  const stats = {
    total: usuarios.length,
    mestres: usuarios.filter((u) => u.role === 'mestre' || u.role === 'admin').length,
    vendedores: usuarios.filter((u) => u.role === 'vendedor').length,
    operacional: usuarios.filter((u) => u.role === 'tecnico' || u.role === 'instalador').length,
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'mestre':
        return (
          <span className="text-[9px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            Mestre (Gerente)
          </span>
        );
      case 'admin':
        return (
          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            Admin
          </span>
        );
      case 'vendedor':
        return (
          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            Vendedor
          </span>
        );
      case 'instalador':
        return (
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            Instalador
          </span>
        );
      case 'tecnico':
      default:
        return (
          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-250 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            Técnico
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBFA] text-[#0B0F19] p-6 md:p-10 font-sans relative selection:bg-[#0a4ee4] selection:text-white">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl transition-all duration-350 transform translate-y-0 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-650' : 'bg-rose-100 text-rose-650'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-7">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#0a4ee4] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Gestão Integrada - IAM & Equipes
            </span>
            <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">Equipe & Acessos</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre gerentes, vendedores e instaladores técnicos, configure permissões RLS e redefina credenciais de acesso de forma segura.
            </p>
          </div>
          {isDbConfigured && (
            <button
              onClick={handleOpenPermissionsModal}
              className="bg-white border border-gray-200 hover:border-[#0a4ee4] text-gray-700 hover:text-[#0a4ee4] font-black text-xs px-4.5 py-3 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 self-start md:self-center"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0a4ee4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Permissões de Abas
            </button>
          )}
        </div>

        {/* Stats Rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#0a4ee4] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">{loading ? '...' : stats.total}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total Equipe</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">{loading ? '...' : stats.mestres}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Administradores</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">{loading ? '...' : stats.vendedores}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Vendedores</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">{loading ? '...' : stats.operacional}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Técnicos / Instaladores</p>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* Form de Cadastro */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200/80 rounded-3xl shadow-sm overflow-hidden sticky top-6">
              <div className="h-1.5 bg-gradient-to-r from-[#0a4ee4] to-amber-500" />
              
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#0a4ee4]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  Cadastrar Colaborador
                </h2>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Cria credenciais e define o perfil de acesso no CRM.</p>
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
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="telefone" className="text-xs font-bold uppercase tracking-wider text-gray-400">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    id="telefone"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    placeholder="Ex: (41) 99999-9999"
                    disabled={isCreating}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold font-mono"
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
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-gray-400">Nível de Acesso (Role)</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    disabled={isCreating}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-805 outline-none transition-all font-bold cursor-pointer"
                  >
                    <option value="tecnico">Técnico Operacional (Visitas)</option>
                    <option value="instalador">Instalador de Campo</option>
                    <option value="vendedor">Vendedor (CRM Vendas)</option>
                    <option value="admin">Administrador (Total)</option>
                    <option value="mestre">Mestre (Gerente Geral)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="senha" className="text-xs font-bold uppercase tracking-wider text-gray-400">Senha de Acesso</label>
                    <button
                      type="button"
                      onClick={() => handleGeneratePassword(false)}
                      className="text-[10px] text-[#0a4ee4] hover:text-orange-600 font-bold uppercase tracking-wider"
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
                      placeholder="Padrão: HublyTeam2026!"
                      disabled={isCreating}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold"
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

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2.5 bg-gradient-to-r from-[#0a4ee4] to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Criar Colaborador
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Listagem */}
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
                  placeholder="Buscar por nome, e-mail, WhatsApp ou nível de acesso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold"
                />
              </div>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-20 text-center shadow-sm flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-[#0a4ee4] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-gray-450">Sincronizando banco de dados...</p>
              </div>
            ) : filteredColaboradores.length === 0 ? (
              <div className="bg-white border border-gray-200/80 rounded-3xl p-14 text-center shadow-sm">
                <p className="text-gray-400 text-sm font-bold">Nenhum colaborador encontrado.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <th className="py-4 px-6">Nome / Acesso</th>
                        <th className="py-4 px-6">Contato</th>
                        <th className="py-4 px-6">Acesso</th>
                        <th className="py-4 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm font-medium">
                      {filteredColaboradores.map((colab, idx) => {
                        const avatarGradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const initials = colab.nome_completo
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase();
                        
                        const isSelf = colab.id === currentUserId;
                        const isUpdatingThis = isUpdating === colab.id;

                        return (
                          <tr key={colab.id} className="hover:bg-gray-50/50 transition-colors group">
                            {/* Nome e Role */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                                  {initials}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 group-hover:text-[#0a4ee4] transition-colors flex items-center gap-1.5">
                                    {colab.nome_completo}
                                    {isSelf && (
                                      <span className="text-[9px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-md">
                                        Você
                                      </span>
                                    )}
                                  </p>
                                  <div className="mt-0.5">{getRoleBadge(colab.role)}</div>
                                </div>
                              </div>
                            </td>

                            {/* Contato */}
                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                {colab.telefone && (
                                  <p className="text-xs text-gray-700 font-bold flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {colab.telefone}
                                  </p>
                                )}
                                <p className="text-[11px] text-gray-400 font-semibold truncate flex items-center gap-1.5" title={colab.email}>
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {colab.email}
                                </p>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2.5">
                                <button
                                  role="switch"
                                  aria-checked={colab.status_acesso}
                                  disabled={isSelf || isUpdatingThis}
                                  onClick={() => handleToggleStatus(colab)}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed ${
                                    colab.status_acesso ? 'bg-[#0a4ee4]' : 'bg-gray-250'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                      colab.status_acesso ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${colab.status_acesso ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {colab.status_acesso ? 'Ativo' : 'Bloqueado'}
                                </span>
                              </div>
                            </td>

                            {/* Ações */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Botão Editar */}
                                <button
                                  onClick={() => startEdit(colab)}
                                  disabled={isUpdatingThis}
                                  title="Editar Credenciais e Cadastro"
                                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-45"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>

                                {/* Botão Copiar */}
                                <button
                                  onClick={() => handleCopyCredentials(colab)}
                                  title="Copiar Credenciais de Login"
                                  className="p-2 text-gray-400 hover:text-[#0a4ee4] hover:bg-orange-50 rounded-xl transition-all cursor-pointer"
                                >
                                  {copiedId === colab.id ? (
                                    <svg className="w-4 h-4 text-emerald-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 4h6m-6 4h6m-6 4h4" />
                                    </svg>
                                  )}
                                </button>

                                {/* Botão WhatsApp */}
                                {colab.telefone && (
                                  <button
                                    onClick={() => handleSendWhatsAppCredentials(colab)}
                                    title="Enviar Credenciais via WhatsApp"
                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                                  >
                                    <svg className="w-4 h-4 text-emerald-600 hover:text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.46 3.426 1.265 4.887l-1.272 4.654 4.761-1.248c1.411.769 3.012 1.207 4.71 1.207 5.517 0 9.996-4.478 9.996-9.996S17.52 2 12.004 2zm5.008 14.337c-.205.577-1.011 1.103-1.602 1.173-.4.048-.922.072-1.485-.11-3.567-1.157-5.908-4.757-6.086-4.992-.178-.235-1.442-1.92-1.442-3.66 0-1.739.905-2.595 1.226-2.946.321-.351.7-.439.932-.439.234 0 .468.002.671.012.208.01.49-.078.766.592.28.681.959 2.333 1.042 2.499.083.165.138.358.028.577-.11.22-.165.358-.33.55-.165.193-.346.43-.495.577-.165.165-.337.345-.145.676.193.33.856 1.411 1.834 2.285.836.745 1.542.977 1.872 1.143.33.165.522.138.718-.087.195-.226.837-.977 1.06-1.312.22-.335.439-.28.742-.165.303.116 1.925.909 2.256 1.074.33.165.55.247.629.385.08.138.08.799-.125 1.376z"/>
                                    </svg>
                                  </button>
                                )}

                                {/* Botão Excluir */}
                                <button
                                  onClick={() => handleDelete(colab.id, colab.nome_completo)}
                                  disabled={isSelf || isDeleting}
                                  title={isSelf ? "Você não pode se excluir" : "Excluir Colaborador e Revogar Acesso"}
                                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
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

      {/* Modal / Dialog de Edição ("Editar Colaborador") */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setEditingUser(null)} className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs" />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-150 transform transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0a4ee4] to-amber-500" />
            
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">Editar Credenciais</h3>
              <p className="text-xs text-gray-500 mt-1">
                Altere informações cadastrais ou redefina a senha de {editingUser.nome_completo}.
              </p>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label htmlFor="edit_nome" className="text-xs font-bold uppercase tracking-wider text-gray-400">Nome Completo</label>
                  <input
                    type="text"
                    id="edit_nome"
                    required
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-805 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit_telefone" className="text-xs font-bold uppercase tracking-wider text-gray-400">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    id="edit_telefone"
                    value={editTelefone}
                    onChange={(e) => setEditTelefone(formatPhone(e.target.value))}
                    placeholder="Ex: (41) 99999-9999"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-805 placeholder-gray-400 outline-none transition-all font-semibold font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit_email" className="text-xs font-bold uppercase tracking-wider text-gray-400">E-mail</label>
                  <input
                    type="email"
                    id="edit_email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-805 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit_role" className="text-xs font-bold uppercase tracking-wider text-gray-400">Nível de Acesso (Role)</label>
                  <select
                    id="edit_role"
                    value={editRole}
                    disabled={editingUser.id === currentUserId}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-805 outline-none transition-all font-bold cursor-pointer disabled:opacity-50"
                  >
                    <option value="tecnico">Técnico Operacional (Visitas)</option>
                    <option value="instalador">Instalador de Campo</option>
                    <option value="vendedor">Vendedor (CRM Vendas)</option>
                    <option value="admin">Administrador (Total)</option>
                    <option value="mestre">Mestre (Gerente Geral)</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <label htmlFor="edit_senha" className="text-xs font-bold uppercase tracking-wider text-gray-400">Nova Senha</label>
                      <span className="block text-[9px] text-gray-400 mt-0.5">Preencha apenas para alterar</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGeneratePassword(true)}
                      className="text-[10px] text-[#0a4ee4] hover:text-orange-600 font-bold uppercase tracking-wider"
                    >
                      Gerar Senha
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={editShowPassword ? 'text' : 'password'}
                      id="edit_senha"
                      value={editSenha}
                      onChange={(e) => setEditSenha(e.target.value)}
                      placeholder="Deixe em branco para manter a atual"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#0a4ee4] focus:ring-2 focus:ring-orange-100 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-805 placeholder-gray-400 outline-none transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setEditShowPassword(!editShowPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {editShowPassword ? (
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
              </div>

              <div className="p-5 border-t border-gray-100 flex justify-end gap-2.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-305 text-gray-600 hover:text-gray-800 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating !== null}
                  className="px-4.5 py-2 bg-[#0a4ee4] hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  {isUpdating !== null ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Dialog de Confirmação de Novas Credenciais */}
      {newCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setNewCredentials(null)} className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs" />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-150 transform transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0a4ee4] to-amber-500" />
            
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">
                {newCredentials.isEdit ? 'Acesso Atualizado com Sucesso!' : 'Acesso Criado com Sucesso!'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {newCredentials.isEdit ? 'Copie a nova senha abaixo para enviar ao colaborador.' : 'Copie os dados de acesso abaixo para enviar ao colaborador.'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5 font-mono text-xs select-all relative group">
                <p><strong className="text-gray-400 font-sans uppercase text-[10px] tracking-wider block">Nome do Colaborador:</strong> {newCredentials.nome}</p>
                <p><strong className="text-gray-400 font-sans uppercase text-[10px] tracking-wider block">E-mail / Login:</strong> {newCredentials.email}</p>
                <p><strong className="text-gray-400 font-sans uppercase text-[10px] tracking-wider block">Senha de Acesso:</strong> {newCredentials.senha}</p>
                <p><strong className="text-gray-400 font-sans uppercase text-[10px] tracking-wider block">Link de Acesso:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://hublypro.com.br/login'}</p>
              </div>
              <p className="text-[10px] text-gray-450 leading-relaxed font-semibold">
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
              {newCredentials.telefone && (
                <button
                  onClick={handleWhatsAppNewCredentials}
                  className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.46 3.426 1.265 4.887l-1.272 4.654 4.761-1.248c1.411.769 3.012 1.207 4.71 1.207 5.517 0 9.996-4.478 9.996-9.996S17.52 2 12.004 2zm5.008 14.337c-.205.577-1.011 1.103-1.602 1.173-.4.048-.922.072-1.485-.11-3.567-1.157-5.908-4.757-6.086-4.992-.178-.235-1.442-1.92-1.442-3.66 0-1.739.905-2.595 1.226-2.946.321-.351.7-.439.932-.439.234 0 .468.002.671.012.208.01.49-.078.766.592.28.681.959 2.333 1.042 2.499.083.165.138.358.028.577-.11.22-.165.358-.33.55-.165.193-.346.43-.495.577-.165.165-.337.345-.145.676.193.33.856 1.411 1.834 2.285.836.745 1.542.977 1.872 1.143.33.165.522.138.718-.087.195-.226.837-.977 1.06-1.312.22-.335.439-.28.742-.165.303.116 1.925.909 2.256 1.074.33.165.55.247.629.385.08.138.08.799-.125 1.376z"/>
                  </svg>
                  Enviar via WhatsApp
                </button>
              )}
              <button
                onClick={handleCopyNewCredentials}
                className="px-4.5 py-2 bg-[#0a4ee4] hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
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

      {/* Modal de Permissões de Abas */}
      {isPermModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div onClick={() => setIsPermModalOpen(false)} className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs" />
          <div className="relative bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-150 transform transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0a4ee4] to-amber-500" />
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-900">Configurar Permissões de Abas</h3>
                <p className="text-xs text-gray-500 mt-1">Marque quais abas do menu cada nível de acesso terá direito de visualizar.</p>
              </div>
              <button 
                onClick={() => setIsPermModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-x-auto max-h-[60vh]">
              {loadingPerms ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#0a4ee4] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-gray-400">Carregando tabela de permissões...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-black uppercase tracking-widest text-gray-450">
                      <th className="py-3 px-4">Nível de Acesso</th>
                      <th className="py-3 px-4 text-center">Dashboard</th>
                      <th className="py-3 px-4 text-center">Leads</th>
                      <th className="py-3 px-4 text-center">Visitas</th>
                      <th className="py-3 px-4 text-center">Projetos</th>
                      <th className="py-3 px-4 text-center">Equipe</th>
                      <th className="py-3 px-4 text-center">Eficiência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
                    {permsList.map((p) => (
                      <tr key={p.role} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {getFriendlyRoleName(p.role)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={p.dashboard}
                            onChange={() => handleTogglePermCheckbox(p.role, 'dashboard')}
                            className="w-4 h-4 rounded-sm border-gray-300 text-orange-500 focus:ring-orange-500/20"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={p.leads}
                            onChange={() => handleTogglePermCheckbox(p.role, 'leads')}
                            className="w-4 h-4 rounded-sm border-gray-300 text-orange-500 focus:ring-orange-500/20"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={p.visitas}
                            onChange={() => handleTogglePermCheckbox(p.role, 'visitas')}
                            className="w-4 h-4 rounded-sm border-gray-300 text-orange-500 focus:ring-orange-500/20"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={p.projetos}
                            onChange={() => handleTogglePermCheckbox(p.role, 'projetos')}
                            className="w-4 h-4 rounded-sm border-gray-300 text-orange-500 focus:ring-orange-500/20"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={p.equipe}
                            onChange={() => handleTogglePermCheckbox(p.role, 'equipe')}
                            className="w-4 h-4 rounded-sm border-gray-300 text-orange-500 focus:ring-orange-500/20"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={p.eficiencia}
                            onChange={() => handleTogglePermCheckbox(p.role, 'eficiencia')}
                            className="w-4 h-4 rounded-sm border-gray-300 text-orange-500 focus:ring-orange-500/20"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-2.5 bg-gray-50">
              <button
                type="button"
                disabled={savingPerms}
                onClick={() => setIsPermModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingPerms || loadingPerms}
                onClick={handleSavePermissions}
                className="px-4.5 py-2 bg-[#0a4ee4] hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
              >
                {savingPerms ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Salvar Permissões
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
