'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Instancia o QueryClient em estado para persistir entre renderizações locais do cliente
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutos de cache
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                OKKA
              </span>
              <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold px-2 py-0.5 border border-slate-800 rounded bg-slate-950">
                CRM
              </span>
            </div>

            <nav className="flex flex-col space-y-2">
              <a
                href="/visitas"
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  pathname === '/visitas'
                    ? 'bg-slate-950 border border-orange-500/20 text-orange-400 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-orange-400 hover:bg-slate-950'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Visitas Técnicas
              </a>

              <a
                href="/leads"
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  pathname === '/leads'
                    ? 'bg-slate-950 border border-orange-500/20 text-orange-400 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-orange-400 hover:bg-slate-950'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Gestão de Leads
              </a>

              <a
                href="/projetos"
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  pathname === '/projetos'
                    ? 'bg-slate-950 border border-orange-500/20 text-orange-400 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-orange-400 hover:bg-slate-950'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Projetos (Kanban)
              </a>
            </nav>
          </div>

          <div className="border-t border-slate-800 pt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-bold text-sm text-orange-400">
              T
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Técnico OKKA</p>
              <p className="text-[10px] text-slate-500">Logado no Painel</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}
