'use client';

import React, { useState, useEffect } from 'react';
import { getPerfisUsuarios, updatePerfilUsuario } from '@/app/actions/usuarios';
import { PerfilUsuario } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  // Sistema de Toasts para feedback visual premium
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Obter usuário logado atual para segurança no front-end
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentAdminId(session.user.id);
        }

        const data = await getPerfisUsuarios();
        setUsuarios(data);
      } catch (err: any) {
        showToast('error', err.message || 'Erro ao carregar lista de usuários.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, currentStatus: boolean) => {
    if (id === currentAdminId) {
      showToast('error', 'Você não pode bloquear o seu próprio acesso administrativo.');
      return;
    }

    try {
      setUpdatingId(id);
      const newStatus = !currentStatus;
      
      // Resposta otimista no estado local
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status_acesso: newStatus } : u));
      
      await updatePerfilUsuario(id, { status_acesso: newStatus });
      
      showToast('success', `Acesso do usuário alterado para ${newStatus ? 'Liberado' : 'Bloqueado'} com sucesso!`);
    } catch (err: any) {
      // Reverter estado local em caso de falha
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status_acesso: currentStatus } : u));
      showToast('error', err.message || 'Falha ao atualizar status do usuário.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateRole = async (id: string, newRole: 'admin' | 'instalador' | 'tecnico') => {
    if (id === currentAdminId) {
      showToast('error', 'Você não pode alterar o seu próprio nível de permissão.');
      return;
    }

    const previousUser = usuarios.find(u => u.id === id);
    if (!previousUser) return;

    try {
      setUpdatingId(id);
      
      // Resposta otimista
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      
      await updatePerfilUsuario(id, { role: newRole });
      
      showToast('success', `Nível de acesso alterado para ${newRole.toUpperCase()} com sucesso!`);
    } catch (err: any) {
      // Reverter
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, role: previousUser.role } : u));
      showToast('error', err.message || 'Falha ao atualizar nível de acesso.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas calculadas dinamicamente
  const stats = {
    total: usuarios.length,
    admins: usuarios.filter((u) => u.role === 'admin').length,
    tecnicos: usuarios.filter((u) => u.role === 'tecnico' || u.role === 'instalador').length,
    bloqueados: usuarios.filter((u) => !u.status_acesso).length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans selection:bg-orange-500 selection:text-white bg-gray-50 text-gray-900 min-h-screen">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-lg transition-all duration-350 transform translate-y-0 ${
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            Gestão de Identidade e Acessos
            <span className="text-xs font-bold uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
              IAM
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Controle de níveis de permissão, bloqueios de segurança e status de acesso dos integrantes da equipe.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Usuários</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{loading ? '...' : stats.total}</span>
            <span className="text-xs text-gray-400 font-medium">contas registradas</span>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contas Mestras</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{loading ? '...' : stats.admins}</span>
            <span className="text-xs text-gray-400 font-medium">administradores</span>
          </div>
        </div>

        {/* Installers / Techs */}
        <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Equipe Operacional</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900">{loading ? '...' : stats.tecnicos}</span>
            <span className="text-xs text-gray-400 font-medium">técnicos / instaladores</span>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acessos Bloqueados</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black ${stats.bloqueados > 0 ? 'text-rose-600 animate-pulse' : 'text-gray-900'}`}>
              {loading ? '...' : stats.bloqueados}
            </span>
            <span className="text-xs text-gray-400 font-medium">usuários revogados</span>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="p-6 border-b border-gray-150 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white text-gray-900 transition-all font-semibold"
            />
          </div>
          <div className="text-xs text-gray-400 font-medium">
            Exibindo <span className="font-bold text-gray-600">{filteredUsuarios.length}</span> de <span className="font-bold text-gray-600">{usuarios.length}</span> usuários
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Sincronizando usuários...</p>
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-base font-bold text-gray-700">Nenhum usuário encontrado</h3>
              <p className="text-gray-400 text-xs mt-1">Refine seu termo de busca ou verifique os filtros.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-150">
                  <th className="py-4 px-6">Usuário</th>
                  <th className="py-4 px-6">Data de Cadastro</th>
                  <th className="py-4 px-6">Nível de Acesso (Role)</th>
                  <th className="py-4 px-6">Status de Acesso</th>
                  <th className="py-4 px-6 text-right">Identificação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-medium">
                {filteredUsuarios.map((u) => {
                  const isSelf = u.id === currentAdminId;
                  const isUserUpdating = updatingId === u.id;
                  
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/55 transition-all group">
                      {/* Name and Email */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-sm text-white bg-gradient-to-br ${
                            u.role === 'admin' 
                              ? 'from-orange-500 to-amber-600 shadow-orange-500/10' 
                              : u.role === 'instalador'
                              ? 'from-emerald-500 to-teal-600 shadow-emerald-500/10'
                              : 'from-blue-500 to-indigo-600 shadow-blue-500/10'
                          }`}>
                            {u.nome_completo.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-gray-900 font-bold flex items-center gap-1.5">
                              {u.nome_completo}
                              {isSelf && (
                                <span className="text-[9px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-md">
                                  Você
                                </span>
                              )}
                            </p>
                            <p className="text-gray-400 text-xs font-semibold">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-4.5 px-6 text-gray-500 font-semibold text-xs">
                        {new Date(u.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Access Level Dropdown */}
                      <td className="py-4.5 px-6 max-w-[200px]">
                        <select
                          value={u.role}
                          disabled={isSelf || isUserUpdating}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                          className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 block w-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <option value="admin">Conta Mestra (Admin)</option>
                          <option value="instalador">Instalador (Operacional)</option>
                          <option value="tecnico">Técnico (Total)</option>
                        </select>
                      </td>

                      {/* Access Status Toggle Switch */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            role="switch"
                            aria-checked={u.status_acesso}
                            disabled={isSelf || isUserUpdating}
                            onClick={() => handleUpdateStatus(u.id, u.status_acesso)}
                            className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.status_acesso ? 'bg-orange-500' : 'bg-gray-250'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                u.status_acesso ? 'translate-x-5.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          
                          <span className={`text-xs font-bold uppercase tracking-wider ${u.status_acesso ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {u.status_acesso ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </div>
                      </td>

                      {/* Right Indicator / Audit */}
                      <td className="py-4.5 px-6 text-right">
                        <span className="text-[10px] text-gray-350 font-bold uppercase tracking-tight font-mono select-all">
                          {u.id.substring(0, 8)}...
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
    </div>
  );
}
