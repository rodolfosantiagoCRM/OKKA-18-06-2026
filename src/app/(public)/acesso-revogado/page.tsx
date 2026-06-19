'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AcessoRevogadoPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // 1. Terminar a sessão no cliente Supabase
      await supabase.auth.signOut();
      
      // 2. Limpar o cookie de sessão explicitamente
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
      
      // 3. Redirecionar para a home
      router.push('/');
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 selection:bg-orange-500 selection:text-white font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 shadow-xl shadow-gray-200/50 text-center relative overflow-hidden">
        {/* Linha decorativa superior */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
        
        {/* Ícone de Alerta */}
        <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mb-6 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-2">
          Acesso Revogado
        </h1>
        
        <p className="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-4">
          Conta Desativada ou Bloqueada
        </p>

        <p className="text-gray-650 text-sm leading-relaxed mb-8">
          Seu perfil de acesso foi temporariamente bloqueado ou desativado pelo administrador do CRM Hubly Pro. 
          Entre em contato com a Conta Mestra da OKKA para restabelecer suas permissões de acesso.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-md shadow-orange-500/20 active:scale-[0.98] cursor-pointer"
          >
            Voltar para o Login
          </button>
          
          <p className="text-[10px] text-gray-400 font-medium">
            Protocolo de Segurança Ativa OKKA
          </p>
        </div>
      </div>
    </div>
  );
}
