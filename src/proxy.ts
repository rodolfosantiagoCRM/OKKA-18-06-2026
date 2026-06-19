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
    // Para fins de desenvolvimento e facilidade de teste local (quando não há tela de login ativa),
    // se não houver token, permitimos o acesso para que você consiga usar as páginas do CRM.
    return NextResponse.next();
  }

  try {
    // 2. Obter informações do usuário de forma segura através do Supabase
    // Passando o token nos headers globais para herdar políticas RLS do usuário autenticado
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
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('sb-access-token');
      return response;
    }

    // 3. Buscar perfil atualizado na tabela perfis_usuarios
    const { data: perfil, error: dbError } = await supabase
      .from('perfis_usuarios')
      .select('role, status_acesso')
      .eq('id', user.id)
      .single();

    // Validar status de acesso
    const status_acesso = perfil ? perfil.status_acesso : (user.user_metadata?.status_acesso ?? true);

    if (status_acesso === false) {
      // Usuário bloqueado - apagar cookie e redirecionar
      const response = NextResponse.redirect(new URL('/acesso-revogado', request.url));
      response.cookies.delete('sb-access-token');
      return response;
    }

    // Determinar a role do usuário
    const role = perfil?.role || user.user_metadata?.role || 'instalador';

    // 4. Se for Técnico ou Instalador, restringe o acesso apenas à rota de Visitas Técnicas
    if (role === 'tecnico' || role === 'instalador') {
      const isAllowedRoute = pathname.startsWith('/visitas') || pathname === '/dashboard/visitas-tecnicas';
      
      if (!isAllowedRoute) {
        // Redireciona o Instalador/Técnico de volta para a aba de visitas
        const targetUrl = pathname.startsWith('/dashboard') ? '/dashboard/visitas-tecnicas' : '/visitas';
        return NextResponse.redirect(new URL(targetUrl, request.url));
      }
    }
  } catch (err) {
    console.error('Erro no proxy de autenticação:', err);
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('sb-access-token');
    return response;
  }

  return NextResponse.next();
}

// Interceptar todas as rotas do CRM (exclui landing page '/' e arquivos estáticos)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/visitas/:path*',
    '/leads/:path*',
    '/projetos/:path*',
    '/responsaveis-tecnicos/:path*',
  ],
};
