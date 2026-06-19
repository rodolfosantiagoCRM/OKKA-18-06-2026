'use server';

import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { PerfilUsuario } from '@/types/database.types';

// Helper de segurança para validar se o requisitante é admin ativo
async function checkAdminPermission(supabaseAdmin: ReturnType<typeof createServerClient>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token) {
    throw new Error('Não autorizado: Sessão ausente.');
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Não autorizado: Sessão inválida.');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('perfis_usuarios')
    .select('role, status_acesso')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Erro ao validar permissões do usuário.');
  }

  if (profile.role !== 'admin') {
    throw new Error('Acesso negado: Permissão restrita a administradores.');
  }

  if (profile.status_acesso === false) {
    throw new Error('Acesso negado: Seu usuário está bloqueado.');
  }

  return user; // Retorna o usuário logado para auditoria/verificação
}

/**
 * Obtém todos os perfis cadastrados no sistema.
 */
export async function getPerfisUsuarios(): Promise<PerfilUsuario[]> {
  const supabase = createServerClient();
  await checkAdminPermission(supabase);

  const { data, error } = await supabase
    .from('perfis_usuarios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar perfis:', error);
    throw new Error('Erro ao listar perfis de usuários.');
  }

  return data as PerfilUsuario[];
}

/**
 * Atualiza o status de acesso ou a role de um perfil e sincroniza com o Supabase Auth.
 */
export async function updatePerfilUsuario(
  targetUserId: string,
  updates: {
    role?: 'admin' | 'instalador' | 'tecnico';
    status_acesso?: boolean;
  }
): Promise<PerfilUsuario> {
  const supabase = createServerClient();
  const currentUser = await checkAdminPermission(supabase);

  // Impedir que o administrador edite a si próprio (evita auto-bloqueio)
  if (targetUserId === currentUser.id) {
    throw new Error('Ação inválida: Você não pode alterar sua própria permissão ou bloquear a si mesmo.');
  }

  // 1. Atualizar no banco de dados (tabela perfis_usuarios)
  const { data: updatedProfile, error: updateError } = await supabase
    .from('perfis_usuarios')
    .update({
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.status_acesso !== undefined && { status_acesso: updates.status_acesso }),
    })
    .eq('id', targetUserId)
    .select()
    .single();

  if (updateError || !updatedProfile) {
    console.error('Erro ao atualizar perfis_usuarios:', updateError);
    throw new Error('Falha ao atualizar o perfil do usuário.');
  }

  // 2. Sincronizar com os metadados do Supabase Auth para manter consistência nos JWT tokens
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: {
      role: updatedProfile.role,
      status_acesso: updatedProfile.status_acesso,
    },
  });

  if (authUpdateError) {
    console.warn('Aviso: Perfil atualizado no banco de dados, mas falhou ao sincronizar os metadados do Supabase Auth:', authUpdateError.message);
  }

  return updatedProfile as PerfilUsuario;
}
