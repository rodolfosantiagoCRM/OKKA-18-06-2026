'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao sair:', error);
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBFA] text-[#0B0F19] flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E25B3C] to-amber-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xs">O</span>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-gray-900">OKKA</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#E25B3C] ml-1.5 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">CRM</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 font-bold px-2.5 py-1 bg-gray-100 border border-gray-200/80 rounded-full">
              Sessão Ativa
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-gray-600 hover:text-[#E25B3C] hover:bg-orange-50 hover:border-orange-250 transition-all border border-gray-200 bg-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
