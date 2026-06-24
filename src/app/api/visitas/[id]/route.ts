import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * DELETE /api/visitas/[id]
 * Exclui uma visita técnica validando autenticação e tenant do usuário logado.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID da visita não informado.' }, { status: 400 });
  }

  // 1. Validar e extrair o token do cookie
  const token = request.cookies.get('sb-access-token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Não autorizado: Sessão ausente.' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[API visitas DELETE] Variáveis de ambiente não configuradas.');
    return NextResponse.json(
      { success: false, error: 'Configuração do servidor incompleta.' },
      { status: 500 }
    );
  }

  // Usar client admin (com service_role) para poder consultar outros perfis e ignorar temporariamente RLS para validação
  const supabase = createClient(supabaseUrl, serviceKey);

  // 2. Autenticar usuário de forma segura no Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Não autorizado: Sessão inválida.' }, { status: 401 });
  }

  // 3. Buscar perfil na tabela perfis_usuarios para obter a role e o empresa_id
  const { data: perfil, error: perfilError } = await supabase
    .from('perfis_usuarios')
    .select('role, empresa_id, status_acesso')
    .eq('id', user.id)
    .single();

  if (perfilError || !perfil) {
    return NextResponse.json({ success: false, error: 'Erro ao validar permissões do usuário.' }, { status: 403 });
  }

  if (perfil.status_acesso === false) {
    return NextResponse.json({ success: false, error: 'Acesso negado: Usuário bloqueado.' }, { status: 403 });
  }

  const normalizedRole = (perfil.role || '').toLowerCase();
  const isSuperAdmin = normalizedRole === 'super_admin';

  // 4. Validar propriedade do registro (Multi-tenant check)
  const { data: visita, error: queryError } = await supabase
    .from('visits')
    .select('empresa_id')
    .eq('id', id)
    .single();

  if (queryError || !visita) {
    return NextResponse.json({ success: false, error: 'Visita não encontrada.' }, { status: 404 });
  }

  // Se não for super admin e a visita pertencer a outro tenant, bloqueia
  if (!isSuperAdmin && visita.empresa_id !== perfil.empresa_id) {
    return NextResponse.json({ success: false, error: 'Acesso negado: Organização incompatível.' }, { status: 403 });
  }

  // 5. Excluir a visita de forma segura
  const { error: deleteError } = await supabase
    .from('visits')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('[API visitas DELETE] Erro ao excluir visita:', deleteError);
    return NextResponse.json(
      { success: false, error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
