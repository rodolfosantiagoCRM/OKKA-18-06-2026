import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Obter o access token do cookie sincronizado pelo cliente
  const token = request.cookies.get('sb-access-token')?.value;

  if (!token) {
    // Redireciona para o login se não houver token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 2. Obter informações do usuário de forma segura através do Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      // Token inválido ou expirado
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('sb-access-token');
      return response;
    }

    // 3. Buscar perfil na tabela 'perfis_usuarios' para obter a role e o empresa_id
    let role = user.user_metadata?.role || '';
    let empresaId = user.user_metadata?.empresa_id || '';

    const { data: perfilUsuario, error: errPerfilUsuario } = await supabase
      .from('perfis_usuarios')
      .select('role, empresa_id')
      .eq('id', user.id)
      .single();

    if (!errPerfilUsuario && perfilUsuario) {
      if (perfilUsuario.role) role = perfilUsuario.role;
      if (perfilUsuario.empresa_id) empresaId = perfilUsuario.empresa_id;
    }

    const normalizedRole = (role || 'instalador').toLowerCase();

    // 3.1. Bypass total para Super Admin (nunca é bloqueado)
    if (normalizedRole === 'super_admin') {
      if (pathname.startsWith('/superadmin')) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }

    // 3.2. Verificar status da assinatura para outras contas
    if (empresaId) {
      const { data: empresa, error: errEmpresa } = await supabase
        .from('empresas')
        .select('status_assinatura')
        .eq('id', empresaId)
        .single();

      if (!errEmpresa && empresa) {
        const status = empresa.status_assinatura;
        const isBlocked = status === 'inadimplente' || status === 'cancelada';

        if (isBlocked) {
          if (normalizedRole === 'vendedor' || normalizedRole === 'instalador' || normalizedRole === 'tecnico') {
            console.log(`[Proxy] Empresa inadimplente/bloqueada. Redirecionando funcionário ${user.email} para /acesso-suspenso`);
            return NextResponse.redirect(new URL('/acesso-suspenso', request.url));
          }

          if (normalizedRole === 'mestre' || normalizedRole === 'admin') {
            const allowedPath = '/dashboard/mestre/configuracoes/assinatura';
            if (!pathname.startsWith(allowedPath)) {
              console.log(`[Proxy] Empresa inadimplente/bloqueada. Redirecionando mestre ${user.email} para tela de assinatura`);
              return NextResponse.redirect(new URL(`${allowedPath}?pendente=true`, request.url));
            }
          }
        }
      }
    }

    // 3.5. Proteção rígida da rota /superadmin
    if (pathname.startsWith('/superadmin')) {
      if (normalizedRole !== 'super_admin') {
        console.warn(`[Proxy] Acesso negado a /superadmin para o usuário ${user.email} (Role: ${normalizedRole})`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    let mappedRole: 'mestre' | 'vendedor' | 'instalador' = 'instalador';

    if (normalizedRole === 'mestre' || normalizedRole === 'admin') {
      mappedRole = 'mestre';
    } else if (normalizedRole === 'vendedor') {
      mappedRole = 'vendedor';
    } else if (normalizedRole === 'tecnico' || normalizedRole === 'instalador') {
      mappedRole = 'instalador';
    }

    // 4. Roteamento Inteligente e Restrições de Acesso
    
    // Super Admin sempre vai para /superadmin
    if (normalizedRole === 'super_admin') {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }

    // Instalador e Técnico Operacional só acessam Visitas Técnicas (não possuem nenhuma página de dashboard)
    if (normalizedRole === 'instalador' || normalizedRole === 'tecnico') {
      if (pathname === '/dashboard' || pathname === '/dashboard/' || pathname.startsWith('/dashboard/')) {
        return NextResponse.redirect(new URL('/visitas', request.url));
      }
    }

    // Se tentar acessar a raiz do dashboard (/dashboard), redireciona para a rota correta
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      return NextResponse.redirect(new URL(`/dashboard/${mappedRole}`, request.url));
    }

    // Restrição para Instaladores: não acessam painéis de mestre ou vendedor
    if (mappedRole === 'instalador') {
      if (pathname.startsWith('/dashboard/mestre') || pathname.startsWith('/dashboard/vendedor')) {
        return NextResponse.redirect(new URL('/visitas', request.url));
      }
    }

    // Restrição para Vendedores: não acessam painel mestre nem instalador
    if (mappedRole === 'vendedor') {
      if (pathname.startsWith('/dashboard/mestre') || pathname.startsWith('/dashboard/instalador')) {
        return NextResponse.redirect(new URL('/dashboard/vendedor', request.url));
      }
    }

    // Mestre possui acesso livre a todas as rotas internas

  } catch (err) {
    console.error('Erro no proxy de autenticação:', err);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('sb-access-token');
    return response;
  }

  return NextResponse.next();
}

// Configura o interceptador do Next.js 16 para as rotas protegidas do dashboard e do superadmin
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/superadmin/:path*',
    '/superadmin',
  ],
};
