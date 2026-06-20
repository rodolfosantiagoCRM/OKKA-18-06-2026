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

    // 3. Buscar perfil na tabela 'perfis' ou 'perfis_usuarios'
    let role = user.user_metadata?.role || '';

    if (!role) {
      const { data: perfil, error: errPerfil } = await supabase
        .from('perfis')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!errPerfil && perfil?.role) {
        role = perfil.role;
      } else {
        const { data: perfilUsuario, error: errPerfilUsuario } = await supabase
          .from('perfis_usuarios')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!errPerfilUsuario && perfilUsuario?.role) {
          role = perfilUsuario.role;
        }
      }
    }

    // Mapear role para compatibilidade com novos e antigos termos
    const normalizedRole = (role || 'instalador').toLowerCase();
    let mappedRole: 'mestre' | 'vendedor' | 'instalador' = 'instalador';

    if (normalizedRole === 'mestre' || normalizedRole === 'admin') {
      mappedRole = 'mestre';
    } else if (normalizedRole === 'vendedor' || normalizedRole === 'tecnico') {
      mappedRole = 'vendedor';
    }

    // 4. Roteamento Inteligente e Restrições de Acesso
    
    // Se tentar acessar a raiz do dashboard (/dashboard), redireciona para a rota correta
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      return NextResponse.redirect(new URL(`/dashboard/${mappedRole}`, request.url));
    }

    // Restrição para Instaladores: não acessam painéis de mestre ou vendedor
    if (mappedRole === 'instalador') {
      if (pathname.startsWith('/dashboard/mestre') || pathname.startsWith('/dashboard/vendedor')) {
        return NextResponse.redirect(new URL('/dashboard/instalador', request.url));
      }
    }

    // Restrição para Vendedores: não acessam painel mestre
    if (mappedRole === 'vendedor') {
      if (pathname.startsWith('/dashboard/mestre')) {
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

// Configura o interceptador do Next.js 16 para as rotas protegidas do dashboard
export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
