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
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Token inválido ou expirado
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 3. Obter a role do usuário a partir dos metadados inseridos no registro
    const role = user.user_metadata?.role || 'tecnico';

    // 4. Se for Técnico, restringe o acesso apenas à rota de Visitas Técnicas
    if (role === 'tecnico') {
      const isAllowedRoute = pathname.startsWith('/visitas') || pathname === '/dashboard/visitas-tecnicas';
      
      if (!isAllowedRoute) {
        // Redireciona o Técnico para a rota de Visitas
        return NextResponse.redirect(new URL('/visitas', request.url));
      }
    }
  } catch (err) {
    console.error('Erro no proxy de autenticação:', err);
    return NextResponse.redirect(new URL('/', request.url));
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
