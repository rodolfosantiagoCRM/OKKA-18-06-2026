'use server';

import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Helper de segurança para validar se o requisitante é super_admin ativo
async function checkSuperAdminPermission(supabaseAdmin: ReturnType<typeof createServerClient>) {
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

  if (profile.role !== 'super_admin') {
    throw new Error('Acesso negado: Permissão restrita ao proprietário do SaaS.');
  }

  if (profile.status_acesso === false) {
    throw new Error('Acesso negado: Seu usuário está bloqueado.');
  }

  return user;
}

interface CriarEmpresaEClienteParams {
  nome_fantasia: string;
  cnpj: string;
  nome_mestre: string;
  email: string;
  password?: string;
}

/**
 * Cria a empresa na tabela empresas e o usuário administrador 'mestre' no auth.users, vinculando-os.
 */
export async function criarEmpresaECliente(dados: CriarEmpresaEClienteParams) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'Chave SUPABASE_SERVICE_ROLE_KEY ausente. Defina-a para gerenciar a autenticação admin.'
      };
    }

    const supabaseAdmin = createServerClient();
    await checkSuperAdminPermission(supabaseAdmin);

    if (!dados.nome_fantasia.trim()) return { success: false, error: 'O nome fantasia é obrigatório.' };
    if (!dados.cnpj.trim()) return { success: false, error: 'O CNPJ é obrigatório.' };
    if (!dados.nome_mestre.trim()) return { success: false, error: 'O nome do usuário responsável é obrigatório.' };
    if (!dados.email.trim()) return { success: false, error: 'O e-mail é obrigatório.' };

    const emailFormatado = dados.email.trim().toLowerCase();
    const cnpjFormatado = dados.cnpj.replace(/\D/g, '');
    const senhaDefinida = dados.password?.trim() || 'OkkaMestre2026!';

    // 1. Verificar se o CNPJ já está cadastrado
    const { data: cnpjExists } = await supabaseAdmin
      .from('empresas')
      .select('id')
      .eq('cnpj', cnpjFormatado)
      .maybeSingle();

    if (cnpjExists) {
      return { success: false, error: 'Este CNPJ já está cadastrado.' };
    }

    // 2. Criar a empresa no banco de dados
    const { data: novaEmpresa, error: empresaError } = await supabaseAdmin
      .from('empresas')
      .insert({
        nome_fantasia: dados.nome_fantasia.trim(),
        cnpj: cnpjFormatado,
        status_assinatura: 'ativa'
      })
      .select()
      .single();

    if (empresaError || !novaEmpresa) {
      console.error('Erro ao criar empresa:', empresaError);
      return { success: false, error: empresaError?.message || 'Erro ao criar registro da empresa.' };
    }

    // 3. Criar o usuário responsável no Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailFormatado,
      password: senhaDefinida,
      email_confirm: true,
      user_metadata: {
        name: dados.nome_mestre.trim(),
        nome_completo: dados.nome_mestre.trim(),
        role: 'mestre',
        status_acesso: true,
        empresa_id: novaEmpresa.id
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário mestre no Auth:', authError);
      // Rollback da empresa criada
      await supabaseAdmin.from('empresas').delete().eq('id', novaEmpresa.id);
      return { success: false, error: authError.message || 'Erro ao criar conta de acesso do mestre.' };
    }

    const novoUserId = authUser.user?.id;
    if (!novoUserId) {
      await supabaseAdmin.from('empresas').delete().eq('id', novaEmpresa.id);
      return { success: false, error: 'Erro ao gerar o ID de usuário no Supabase.' };
    }

    // 4. Garantir que o perfil correspondente foi criado no banco
    const { data: perfilExistente } = await supabaseAdmin
      .from('perfis_usuarios')
      .select('id')
      .eq('id', novoUserId)
      .maybeSingle();

    if (!perfilExistente) {
      const { error: profileError } = await supabaseAdmin
        .from('perfis_usuarios')
        .insert({
          id: novoUserId,
          nome_completo: dados.nome_mestre.trim(),
          email: emailFormatado,
          role: 'mestre',
          status_acesso: true,
          empresa_id: novaEmpresa.id
        });

      if (profileError) {
        console.error('Erro ao criar perfil mestre:', profileError);
        // Tenta remover o usuário do Auth para consistência
        await supabaseAdmin.auth.admin.deleteUser(novoUserId);
        await supabaseAdmin.from('empresas').delete().eq('id', novaEmpresa.id);
        return { success: false, error: 'Erro ao criar o perfil do usuário responsável.' };
      }
    } else {
      // Atualizar o perfil caso já tenha sido criado pelo trigger handle_new_user
      await supabaseAdmin
        .from('perfis_usuarios')
        .update({
          nome_completo: dados.nome_mestre.trim(),
          role: 'mestre',
          empresa_id: novaEmpresa.id,
          status_acesso: true
        })
        .eq('id', novoUserId);
    }

    return {
      success: true,
      data: {
        empresa: novaEmpresa,
        usuarioId: novoUserId
      }
    };
  } catch (err: any) {
    console.error('Erro no criarEmpresaECliente:', err);
    return { success: false, error: err.message || 'Erro inesperado ao criar empresa e cliente.' };
  }
}

/**
 * Altera a senha de qualquer usuário usando o Supabase Auth Admin.
 */
export async function atualizarSenhaUsuario(userId: string, novaSenha: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: 'Chave SUPABASE_SERVICE_ROLE_KEY ausente.' };
    }

    const supabaseAdmin = createServerClient();
    await checkSuperAdminPermission(supabaseAdmin);

    if (!novaSenha || novaSenha.trim().length < 6) {
      return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: novaSenha.trim()
    });

    if (error) {
      console.error('Erro ao alterar senha do usuário:', error);
      return { success: false, error: error.message || 'Erro ao redefinir a senha do usuário.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro no atualizarSenhaUsuario:', err);
    return { success: false, error: err.message || 'Erro inesperado ao alterar a senha.' };
  }
}

/**
 * Altera o status da assinatura de uma empresa no banco de dados.
 */
export async function alterarStatusAssinatura(empresaId: string, status: 'ativa' | 'inadimplente' | 'cancelada') {
  try {
    const supabaseAdmin = createServerClient();
    await checkSuperAdminPermission(supabaseAdmin);

    const { error } = await supabaseAdmin
      .from('empresas')
      .update({ status_assinatura: status })
      .eq('id', empresaId);

    if (error) {
      console.error('Erro ao atualizar status da assinatura:', error);
      return { success: false, error: error.message || 'Erro ao alterar o status da assinatura.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro no alterarStatusAssinatura:', err);
    return { success: false, error: err.message || 'Erro inesperado ao atualizar a assinatura.' };
  }
}

/**
 * Retorna todas as empresas cadastradas no sistema, o usuário mestre e algumas métricas básicas de uso.
 */
export async function getSaaSEmpresas() {
  try {
    const supabaseAdmin = createServerClient();
    await checkSuperAdminPermission(supabaseAdmin);

    // 1. Buscar todas as empresas
    const { data: empresas, error: empresasError } = await supabaseAdmin
      .from('empresas')
      .select('*')
      .order('criado_em', { ascending: false });

    if (empresasError) {
      throw empresasError;
    }

    // 2. Para cada empresa, buscar o usuário com a role 'mestre' e contar registros
    const empresasComMetricas = await Promise.all(
      empresas.map(async (empresa) => {
        // Obter usuário mestre
        const { data: mestre } = await supabaseAdmin
          .from('perfis_usuarios')
          .select('id, nome_completo, email')
          .eq('empresa_id', empresa.id)
          .eq('role', 'mestre')
          .limit(1)
          .maybeSingle();

        // Contar leads
        const { count: leadsCount } = await supabaseAdmin
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresa.id);

        // Contar projetos
        const { count: projectsCount } = await supabaseAdmin
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresa.id);

        return {
          ...empresa,
          mestre: mestre ? {
            id: mestre.id,
            nome: mestre.nome_completo,
            email: mestre.email
          } : null,
          metricas: {
            leads: leadsCount || 0,
            projetos: projectsCount || 0
          }
        };
      })
    );

    return { success: true, data: empresasComMetricas };
  } catch (err: any) {
    console.error('Erro no getSaaSEmpresas:', err);
    return { success: false, error: err.message || 'Erro inesperado ao listar empresas.' };
  }
}

interface AtualizarEmpresaParams {
  nome_fantasia: string;
  cnpj: string;
}

/**
 * Atualiza os dados cadastrais de uma empresa (nome fantasia e CNPJ).
 */
export async function atualizarEmpresa(empresaId: string, dados: AtualizarEmpresaParams) {
  try {
    const supabaseAdmin = createServerClient();
    await checkSuperAdminPermission(supabaseAdmin);

    if (!dados.nome_fantasia.trim()) return { success: false, error: 'O nome fantasia é obrigatório.' };
    if (!dados.cnpj.trim()) return { success: false, error: 'O CNPJ é obrigatório.' };

    const cnpjFormatado = dados.cnpj.replace(/\D/g, '');

    // Verificar se outro cadastro já possui esse CNPJ
    const { data: cnpjExists } = await supabaseAdmin
      .from('empresas')
      .select('id')
      .eq('cnpj', cnpjFormatado)
      .neq('id', empresaId)
      .maybeSingle();

    if (cnpjExists) {
      return { success: false, error: 'Este CNPJ já está cadastrado em outra empresa.' };
    }

    const { error } = await supabaseAdmin
      .from('empresas')
      .update({
        nome_fantasia: dados.nome_fantasia.trim(),
        cnpj: cnpjFormatado,
      })
      .eq('id', empresaId);

    if (error) {
      console.error('Erro ao atualizar empresa:', error);
      return { success: false, error: error.message || 'Erro ao atualizar dados da empresa.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro no atualizarEmpresa:', err);
    return { success: false, error: err.message || 'Erro inesperado ao atualizar a empresa.' };
  }
}

/**
 * Alterna manualmente o status da assinatura de uma empresa para bloqueio/desbloqueio.
 */
export async function alternarBloqueioEmpresa(
  empresaId: string,
  novoStatus: 'ativa' | 'inadimplente' | 'cancelada'
) {
  try {
    const supabaseAdmin = createServerClient();
    await checkSuperAdminPermission(supabaseAdmin);

    const { error } = await supabaseAdmin
      .from('empresas')
      .update({ status_assinatura: novoStatus })
      .eq('id', empresaId);

    if (error) {
      console.error('Erro ao alternar bloqueio da empresa:', error);
      return { success: false, error: error.message || 'Erro ao alterar status da assinatura.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro no alternarBloqueioEmpresa:', err);
    return { success: false, error: err.message || 'Erro inesperado ao alternar bloqueio.' };
  }
}

