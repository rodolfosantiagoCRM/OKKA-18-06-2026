'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getMinhasPermissoesAbas, type PermissoesAbas } from '@/app/actions/usuarios';

const getStaticPermissions = (roleName: string | null): PermissoesAbas => {
  const r = roleName || 'admin';
  if (r === 'tecnico' || r === 'instalador') {
    return {
      role: r,
      dashboard: false,
      leads: false,
      visitas: true,
      projetos: false,
      equipe: false,
      eficiencia: false,
    };
  }
  return {
    role: r,
    dashboard: true,
    leads: r === 'admin' || r === 'mestre',
    visitas: true,
    projetos: r === 'admin' || r === 'mestre' || r === 'vendedor',
    equipe: r === 'admin' || r === 'mestre',
    eficiencia: r === 'admin' || r === 'mestre',
  };
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'tecnico' | 'instalador' | 'mestre' | 'vendedor' | null>(null);
  const [userName, setUserName] = useState<string>('Usuário OKKA');
  const [userRoleLabel, setUserRoleLabel] = useState<string>('Painel Operacional');
  const [permissions, setPermissions] = useState<PermissoesAbas>(() => getStaticPermissions(null));

  const loadPermissions = async (userRole: string) => {
    try {
      const perms = await getMinhasPermissoesAbas(userRole);
      setPermissions(perms);
    } catch (e) {
      console.error('Erro ao carregar permissões:', e);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao sair:', error);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
      } else {
        document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure`;
      }
    });

    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const metadataRole = session.user.user_metadata?.role;
        const metadataName = session.user.user_metadata?.name || session.user.user_metadata?.nome_completo;
        if (metadataName) setUserName(metadataName);
        
        if (metadataRole) {
          setRole(metadataRole as any);
          setPermissions(getStaticPermissions(metadataRole));
          loadPermissions(metadataRole);
          setUserRoleLabel(
            metadataRole === 'admin' || metadataRole === 'mestre'
              ? 'Conta Mestra'
              : metadataRole === 'vendedor'
              ? 'Vendedor'
              : metadataRole === 'instalador'
              ? 'Instalador Técnico'
              : 'Técnico Operacional'
          );
        } else {
          // Consultar a tabela 'perfis'
          let userRole = '';
          const { data: perfil } = await supabase
            .from('perfis')
            .select('role, nome_completo')
            .eq('id', session.user.id)
            .single();

          if (perfil) {
            userRole = perfil.role;
            if (perfil.nome_completo) setUserName(perfil.nome_completo);
          } else {
            // Fallback para 'perfis_usuarios'
            const { data: perfilUsuario } = await supabase
              .from('perfis_usuarios')
              .select('role, nome_completo')
              .eq('id', session.user.id)
              .single();

            if (perfilUsuario) {
              userRole = perfilUsuario.role;
              if (perfilUsuario.nome_completo) setUserName(perfilUsuario.nome_completo);
            }
          }

          if (userRole) {
            setRole(userRole as any);
            setPermissions(getStaticPermissions(userRole));
            loadPermissions(userRole);
            setUserRoleLabel(
              userRole === 'admin' || userRole === 'mestre'
                ? 'Conta Mestra'
                : userRole === 'vendedor'
                ? 'Vendedor'
                : userRole === 'instalador'
                ? 'Instalador Técnico'
                : 'Técnico Operacional'
            );
          }
        }
      }
    }
    checkRole();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Redirecionamento de segurança para páginas não permitidas
  useEffect(() => {
    if (role) {
      const activePerms = permissions;
      const isRouteAllowed = 
        (pathname === '/dashboard' && activePerms.dashboard) ||
        (pathname === '/leads' && activePerms.leads) ||
        (pathname === '/visitas' && activePerms.visitas) ||
        (pathname === '/projetos' && activePerms.projetos) ||
        (pathname === '/responsaveis-tecnicos' && activePerms.equipe) ||
        (pathname === '/dashboard/eficiencia' && activePerms.eficiencia) ||
        pathname.startsWith('/dashboard/mestre') || 
        pathname.startsWith('/dashboard/vendedor') || 
        pathname.startsWith('/dashboard/instalador') ||
        pathname === '/dashboard';

      if (!isRouteAllowed) {
        let fallbackRoute = '/visitas';
        if (activePerms.dashboard) fallbackRoute = '/dashboard';
        else if (activePerms.visitas) fallbackRoute = '/visitas';
        else if (activePerms.leads) fallbackRoute = '/leads';
        else if (activePerms.projetos) fallbackRoute = '/projetos';
        
        router.push(fallbackRoute);
      }
    }
  }, [pathname, role, permissions, router]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
          },
        },
      })
  );

  const navItems = [
    ...(permissions.dashboard
      ? [
          {
            href: '/dashboard',
            label: 'Dashboard',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            ),
          },
        ]
      : []),
    ...(permissions.leads
      ? [
          {
            href: '/leads',
            label: 'Gestão de Leads',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
          },
        ]
      : []),
    ...(permissions.visitas
      ? [
          {
            href: '/visitas',
            label: 'Gestão de Visitas Técnicas',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
        ]
      : []),
    ...(permissions.projetos
      ? [
          {
            href: '/projetos',
            label: 'Projetos (Kanban)',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            ),
          },
        ]
      : []),
    ...(permissions.equipe
      ? [
          {
            href: '/responsaveis-tecnicos',
            label: 'Equipe & Acessos',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ),
          },
        ]
      : []),
    ...(permissions.eficiencia
      ? [
          {
            href: '/dashboard/eficiencia',
            label: 'Eficiência Técnica',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#FCFBFA] text-[#0B0F19] flex flex-col md:flex-row font-sans">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-gray-200/80 shadow-sm flex flex-col justify-between shrink-0">
          <div className="p-6 space-y-8">
            {/* Logo */}
            <a href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E25B3C] to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/30">
                <span className="text-white font-black text-sm tracking-tight">O</span>
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-gray-900">OKKA</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#E25B3C] ml-1.5 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">CRM</span>
              </div>
            </a>

            {/* Navigation */}
            <nav className="flex flex-col space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">Menu</p>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all duration-200 ${
                      isActive
                        ? 'bg-[#E25B3C] text-white shadow-md shadow-orange-500/25'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Footer do perfil */}
          <div className="p-5 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E25B3C] to-amber-500 flex items-center justify-center font-black text-sm text-white shadow-sm shadow-orange-500/20">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 truncate">{userName}</p>
                <p className="text-[10px] text-gray-400 font-medium truncate">{userRoleLabel}</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sair do Sistema"
                className="shrink-0 p-1.5 text-gray-400 hover:text-[#E25B3C] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#FCFBFA]">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}
