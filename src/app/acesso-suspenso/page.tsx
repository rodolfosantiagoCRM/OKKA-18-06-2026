'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';

export default function AcessoSuspensoPage() {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
      window.location.href = '/';
    } catch (err) {
      console.error('Erro ao deslogar:', err);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 w-[350px] h-[350px] bg-rose-600/10 rounded-full blur-[100px] -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-amber-600/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6">
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-lg shadow-rose-500/5">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 15v2m0-8v6m0 5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight text-white">Acesso Suspenso</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            O acesso da sua empresa ao **OKKA CRM** está temporariamente suspenso devido a pendências de assinatura.
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            Por favor, contate o administrador do seu sistema (Gestor da Conta Mestra) para regularizar a situação junto ao faturamento do SaaS.
          </p>
        </div>

        <div className="h-px bg-slate-800/80" />

        {/* Action Button */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-slate-800 hover:bg-slate-750 hover:text-white text-slate-300 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer border border-slate-700/60"
          >
            Fazer Logout / Trocar de Conta
          </button>
        </div>
      </div>
    </div>
  );
}
