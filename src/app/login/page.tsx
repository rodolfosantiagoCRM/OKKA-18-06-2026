'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Define o cookie para sincronizar com o Middleware/Proxy do Next.js
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;

        // 1. Descobrir a role do usuário (consultando perfis e perfis_usuarios como fallback)
        const userId = data.session.user.id;
        let userRole = data.session.user.user_metadata?.role || '';

        if (!userRole) {
          // Consulta a tabela 'perfis'
          const { data: perfil, error: errPerfil } = await supabase
            .from('perfis')
            .select('role')
            .eq('id', userId)
            .single();

          if (!errPerfil && perfil?.role) {
            userRole = perfil.role;
          } else {
            // Fallback para 'perfis_usuarios'
            const { data: perfilUsuario, error: errPerfilUsuario } = await supabase
              .from('perfis_usuarios')
              .select('role')
              .eq('id', userId)
              .single();

            if (!errPerfilUsuario && perfilUsuario?.role) {
              userRole = perfilUsuario.role;
            }
          }
        }

        // 2. Roteamento baseado em funções
        let targetRoute = '/dashboard/instalador';
        const normalizedRole = userRole.toLowerCase();

        if (normalizedRole === 'super_admin') {
          targetRoute = '/superadmin';
        } else if (normalizedRole === 'mestre' || normalizedRole === 'admin') {
          targetRoute = '/dashboard/mestre';
        } else if (normalizedRole === 'vendedor' || normalizedRole === 'tecnico') {
          targetRoute = '/dashboard/vendedor';
        } else if (normalizedRole === 'instalador') {
          targetRoute = '/dashboard/instalador';
        }

        router.push(targetRoute);
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      // Tratar o erro {} do Supabase (objeto sem .message ou com mensagem vazia/inválida)
      const rawMsg = err?.message;
      const isEmptyMsg = !rawMsg || rawMsg === '{}' || rawMsg === 'undefined';
      const displayMsg = isEmptyMsg
        ? 'Credenciais inválidas. Verifique o e-mail e a senha e tente novamente.'
        : rawMsg;
      setErrorMsg(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBFA] text-[#0B0F19] flex items-center justify-center p-6 selection:bg-[#0a4ee4] selection:text-white font-sans relative overflow-hidden">
      {/* Gradients de Fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,78,228,0.04)_0%,transparent_65%)] pointer-events-none" />
      
      <div className="max-w-md w-full bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
        {/* Indicador de marca superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0a4ee4] to-amber-500" />
        
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo-hubly.png" alt="HUBLY PRO Logo" className="h-14 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Central HUBLY PRO</h1>
          <p className="text-xs text-gray-500 mt-1">Painel de Identificação — CRM Hubly Pro</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">E-mail corporativo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@hublypro.com.br"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0a4ee4] focus:ring-1 focus:ring-[#0a4ee4]/30 transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Senha de acesso</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0a4ee4] focus:ring-1 focus:ring-[#0a4ee4]/30 transition-all font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#0a4ee4] to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Validando credenciais...</span>
              </>
            ) : (
              <span>Entrar no CRM</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
