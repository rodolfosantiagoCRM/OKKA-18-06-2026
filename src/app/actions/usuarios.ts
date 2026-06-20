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

  if (profile.role !== 'admin' && profile.role !== 'mestre') {
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
    role?: 'admin' | 'instalador' | 'tecnico' | 'mestre' | 'vendedor';
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

/**
 * Atualiza todas as informações do perfil do usuário e suas credenciais de autenticação no Supabase Auth.
 */
export async function atualizarUsuarioCompleto(
  targetUserId: string,
  dados: {
    nome_completo?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'instalador' | 'tecnico' | 'mestre' | 'vendedor';
    status_acesso?: boolean;
    telefone?: string;
  }
): Promise<{ success: boolean; data?: PerfilUsuario; error?: string }> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'Chave SUPABASE_SERVICE_ROLE_KEY ausente nas variáveis de ambiente. Defina-a em seu arquivo .env para permitir a edição de usuários.'
      };
    }

    const supabaseAdmin = createServerClient();
    
    // 1. Validar se o requisitante é admin/mestre ativo
    await checkAdminPermission(supabaseAdmin);

    // 2. Montar atualizações no Supabase Auth Admin
    const authUpdates: any = {};
    if (dados.email && dados.email.trim()) {
      authUpdates.email = dados.email.trim().toLowerCase();
    }
    if (dados.password && dados.password.trim()) {
      authUpdates.password = dados.password.trim();
    }
    
    const userMetadata: any = {};
    if (dados.nome_completo && dados.nome_completo.trim()) {
      userMetadata.name = dados.nome_completo.trim();
      userMetadata.nome_completo = dados.nome_completo.trim();
    }
    if (dados.role) {
      userMetadata.role = dados.role;
    }
    if (dados.status_acesso !== undefined) {
      userMetadata.status_acesso = dados.status_acesso;
    }
    if (dados.telefone !== undefined) {
      userMetadata.telefone = dados.telefone.trim();
    }

    if (Object.keys(userMetadata).length > 0) {
      authUpdates.user_metadata = userMetadata;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, authUpdates);
      if (authUpdateError) {
        console.error('Erro ao atualizar usuário no Supabase Auth Admin:', authUpdateError);
        return { success: false, error: authUpdateError.message || 'Erro ao sincronizar com Supabase Auth.' };
      }
    }

    // 3. Atualizar na tabela pública 'perfis_usuarios'
    const dbUpdates: any = {};
    if (dados.nome_completo && dados.nome_completo.trim()) {
      dbUpdates.nome_completo = dados.nome_completo.trim();
    }
    if (dados.email && dados.email.trim()) {
      dbUpdates.email = dados.email.trim().toLowerCase();
    }
    if (dados.role) {
      dbUpdates.role = dados.role;
    }
    if (dados.status_acesso !== undefined) {
      dbUpdates.status_acesso = dados.status_acesso;
    }

    let updatedProfile: any = null;
    if (Object.keys(dbUpdates).length > 0) {
      const { data, error: dbError } = await supabaseAdmin
        .from('perfis_usuarios')
        .update(dbUpdates)
        .eq('id', targetUserId)
        .select()
        .single();

      if (dbError) {
        console.error('Erro ao atualizar perfis_usuarios:', dbError);
        return { success: false, error: dbError.message || 'Erro ao atualizar tabela de perfis.' };
      }
      updatedProfile = data;
    } else {
      // Buscar perfil atualizado para retornar
      const { data, error: dbError } = await supabaseAdmin
        .from('perfis_usuarios')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (dbError) {
        return { success: false, error: dbError.message || 'Erro ao buscar perfil atualizado.' };
      }
      updatedProfile = data;
    }

    // 4. Se for técnico/instalador, e houver telefone, atualizar também a tabela 'responsaveis_tecnicos'
    if (dados.telefone !== undefined || (dados.nome_completo && (dados.role === 'tecnico' || dados.role === 'instalador'))) {
      const { data: rtExists } = await supabaseAdmin
        .from('responsaveis_tecnicos')
        .select('id')
        .eq('id', targetUserId)
        .maybeSingle();

      if (rtExists) {
        const rtUpdates: any = {};
        if (dados.nome_completo) rtUpdates.nome = dados.nome_completo.trim();
        if (dados.telefone) rtUpdates.telefone = dados.telefone.trim();
        if (dados.email) rtUpdates.email = dados.email.trim().toLowerCase();

        if (Object.keys(rtUpdates).length > 0) {
          const { error: rtError } = await supabaseAdmin
            .from('responsaveis_tecnicos')
            .update(rtUpdates)
            .eq('id', targetUserId);
          if (rtError) console.error('Erro ao atualizar responsaveis_tecnicos:', rtError);
        }
      }
    }

    // 5. Atualizar na tabela legado 'perfis' se ela existir no banco
    try {
      const { data: perfisExists } = await supabaseAdmin
        .from('perfis')
        .select('id')
        .eq('id', targetUserId)
        .maybeSingle();

      if (perfisExists) {
        const pUpdates: any = {};
        if (dados.nome_completo) {
          pUpdates.nome = dados.nome_completo.trim();
          pUpdates.nome_completo = dados.nome_completo.trim();
        }
        if (dados.telefone) pUpdates.telefone = dados.telefone.trim();
        if (dados.role) pUpdates.role = dados.role;
        if (dados.email) pUpdates.email = dados.email.trim().toLowerCase();
        
        if (Object.keys(pUpdates).length > 0) {
          await supabaseAdmin
            .from('perfis')
            .update(pUpdates)
            .eq('id', targetUserId);
        }
      }
    } catch (e) {
      // Tabela legada perfis pode não existir, ignorar falha silenciosamente
    }

    return { success: true, data: updatedProfile as PerfilUsuario };
  } catch (err: any) {
    console.error('Erro ao atualizar usuário completo:', err);
    return { success: false, error: err.message || 'Erro inesperado ao atualizar o usuário.' };
  }
}

/**
 * Cria um novo usuário no Supabase Auth e o vincula ao perfil correspondente.
 */
export async function criarUsuarioCompleto(dados: {
  nome_completo: string;
  email: string;
  password?: string;
  role: 'admin' | 'instalador' | 'tecnico' | 'mestre' | 'vendedor';
  status_acesso?: boolean;
  telefone?: string;
}): Promise<{ success: boolean; data?: PerfilUsuario; error?: string }> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'Chave SUPABASE_SERVICE_ROLE_KEY ausente nas variáveis de ambiente. Defina-a em seu arquivo .env para permitir a criação de usuários.'
      };
    }

    const supabaseAdmin = createServerClient();
    
    // 1. Validar se o requisitante é admin/mestre ativo
    await checkAdminPermission(supabaseAdmin);

    // 2. Validações dos dados de entrada
    if (!dados.nome_completo.trim()) {
      return { success: false, error: 'O nome completo é obrigatório.' };
    }
    if (!dados.email.trim()) {
      return { success: false, error: 'O e-mail é obrigatório.' };
    }

    const emailFormatado = dados.email.trim().toLowerCase();
    const nomeFormatado = dados.nome_completo.trim();
    const telefoneFormatado = dados.telefone?.trim() || '';
    const senhaDefinida = dados.password?.trim() || 'OkkaTeam2026!';
    const statusAcesso = dados.status_acesso ?? true;

    // 3. Criar usuário no auth.users do Supabase Auth
    const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: emailFormatado,
      password: senhaDefinida,
      email_confirm: true,
      user_metadata: {
        name: nomeFormatado,
        nome_completo: nomeFormatado,
        role: dados.role,
        telefone: telefoneFormatado,
        status_acesso: statusAcesso,
      },
    });

    if (createAuthError) {
      console.error('Erro ao criar usuário no Supabase Auth Admin:', createAuthError);
      if (createAuthError.message.includes('already exists') || createAuthError.status === 422) {
        return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
      }
      return { success: false, error: createAuthError.message || 'Erro ao criar conta de acesso.' };
    }

    if (!authUser.user) {
      return { success: false, error: 'Falha ao gerar o ID de usuário do Supabase.' };
    }

    const novoId = authUser.user.id;

    // 4. Inserir na tabela 'perfis_usuarios'
    const roleDb: string = dados.role;

    // Esperar um pouco ou consultar se o trigger já inseriu para evitar conflito de chave única
    const { data: perfilExistent } = await supabaseAdmin
      .from('perfis_usuarios')
      .select('id')
      .eq('id', novoId)
      .maybeSingle();

    let perfilResult: any = null;

    if (perfilExistent) {
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('perfis_usuarios')
        .update({
          nome_completo: nomeFormatado,
          role: roleDb,
          status_acesso: statusAcesso,
        })
        .eq('id', novoId)
        .select()
        .single();

      if (updateErr) {
        console.warn('Erro ao atualizar perfil criado por trigger. Tentando com role fallback...', updateErr.message);
        const { data: updatedFb } = await supabaseAdmin
          .from('perfis_usuarios')
          .update({
            nome_completo: nomeFormatado,
            role: roleDb === 'admin' ? 'admin' : 'tecnico',
            status_acesso: statusAcesso,
          })
          .eq('id', novoId)
          .select()
          .single();
        perfilResult = updatedFb;
      } else {
        perfilResult = updated;
      }
    } else {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('perfis_usuarios')
        .insert({
          id: novoId,
          nome_completo: nomeFormatado,
          email: emailFormatado,
          role: roleDb,
          status_acesso: statusAcesso,
        })
        .select()
        .single();

      if (insertErr) {
        console.warn('Erro ao inserir perfil de usuário diretamente. Tentando com role fallback...', insertErr.message);
        const { data: insertedFb, error: fbErr } = await supabaseAdmin
          .from('perfis_usuarios')
          .insert({
            id: novoId,
            nome_completo: nomeFormatado,
            email: emailFormatado,
            role: roleDb === 'admin' ? 'admin' : 'tecnico',
            status_acesso: statusAcesso,
          })
          .select()
          .single();
        
        if (fbErr) {
          // Rollback
          await supabaseAdmin.auth.admin.deleteUser(novoId);
          return { success: false, error: 'Falha ao salvar perfil do usuário no banco de dados: ' + fbErr.message };
        }
        perfilResult = insertedFb;
      } else {
        perfilResult = inserted;
      }
    }

    // 5. Se for técnico/instalador, e houver telefone, inserir também na tabela 'responsaveis_tecnicos'
    if (dados.role === 'tecnico' || dados.role === 'instalador') {
      const { error: rtError } = await supabaseAdmin
        .from('responsaveis_tecnicos')
        .insert({
          id: novoId,
          nome: nomeFormatado,
          telefone: telefoneFormatado,
          email: emailFormatado,
        });

      if (rtError) {
        console.error('Erro ao inserir em responsaveis_tecnicos:', rtError);
      }
    }

    // 6. Inserir/Atualizar na tabela legado 'perfis' se ela existir no banco
    try {
      await supabaseAdmin
        .from('perfis')
        .upsert({
          id: novoId,
          nome: nomeFormatado,
          nome_completo: nomeFormatado,
          telefone: telefoneFormatado,
          role: dados.role,
          email: emailFormatado,
        });
    } catch (e) {
      // Ignorar falha se a tabela 'perfis' não existir
    }

    return {
      success: true,
      data: {
        ...perfilResult,
        role: dados.role,
      } as PerfilUsuario
    };
  } catch (err: any) {
    console.error('Erro ao criar usuário completo:', err);
    return { success: false, error: err.message || 'Erro inesperado ao criar usuário.' };
  }
}

export interface PermissoesAbas {
  role: string;
  dashboard: boolean;
  leads: boolean;
  visitas: boolean;
  projetos: boolean;
  equipe: boolean;
  eficiencia: boolean;
  configuracoes?: boolean;
  updated_at?: string;
}

/**
 * Obtém todas as permissões de abas por nível de acesso.
 */
export async function getPermissoesAbas(): Promise<PermissoesAbas[]> {
  try {
    const supabase = createServerClient();
    
    // Verificar se o requisitante tem permissão de administrador
    await checkAdminPermission(supabase);

    const { data, error } = await supabase
      .from('permissoes_abas')
      .select('*')
      .order('role', { ascending: true });

    if (error) {
      console.error('Erro ao obter permissões de abas:', error);
      throw new Error(error.message || 'Erro ao obter permissões de abas.');
    }

    return data as PermissoesAbas[];
  } catch (err) {
    console.error('Erro no getPermissoesAbas:', err);
    throw err;
  }
}

/**
 * Atualiza as permissões de abas para um papel específico.
 */
export async function atualizarPermissoesAbas(
  role: string,
  abas: {
    dashboard: boolean;
    leads: boolean;
    visitas: boolean;
    projetos: boolean;
    equipe: boolean;
    eficiencia: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    
    // Verificar se o requisitante tem permissão de administrador
    await checkAdminPermission(supabase);

    const { error } = await supabase
      .from('permissoes_abas')
      .update({
        dashboard: abas.dashboard,
        leads: abas.leads,
        visitas: abas.visitas,
        projetos: abas.projetos,
        equipe: abas.equipe,
        eficiencia: abas.eficiencia,
        updated_at: new Date().toISOString()
      })
      .eq('role', role);

    if (error) {
      console.error('Erro ao atualizar permissões de abas:', error);
      return { success: false, error: error.message || 'Erro ao atualizar permissões de abas.' };
    }

    return { success: true };
  } catch (err) {
    console.error('Erro no atualizarPermissoesAbas:', err);
    return { success: false, error: (err as Error).message || 'Erro inesperado ao atualizar permissões.' };
  }
}

/**
 * Obtém as permissões de abas para o papel do usuário atual.
 */
export async function getMinhasPermissoesAbas(roleName: string): Promise<PermissoesAbas> {
  const defaultPerms: PermissoesAbas = {
    role: roleName,
    dashboard: roleName !== 'instalador',
    leads: roleName === 'admin' || roleName === 'mestre',
    visitas: true,
    projetos: roleName === 'admin' || roleName === 'mestre' || roleName === 'tecnico' || roleName === 'vendedor',
    equipe: roleName === 'admin' || roleName === 'mestre',
    eficiencia: roleName === 'admin' || roleName === 'mestre',
  };

  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return defaultPerms;
    }

    const { data, error } = await supabase
      .from('permissoes_abas')
      .select('*')
      .eq('role', roleName)
      .single();

    if (error || !data) {
      console.warn('Erro ou tabela de permissões não migrada. Usando padrão estático:', error?.message);
      return defaultPerms;
    }

    return data as PermissoesAbas;
  } catch (err) {
    console.warn('Erro ao ler permissões. Usando padrão estático:', err);
    return defaultPerms;
  }
}
