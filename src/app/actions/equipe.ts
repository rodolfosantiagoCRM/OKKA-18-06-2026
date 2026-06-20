'use server';

import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export interface CriarMembroEquipeDados {
  nome_completo: string;
  email: string;
  telefone: string;
  role: 'vendedor' | 'instalador';
}

export interface MembroEquipe {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  role: 'vendedor' | 'instalador';
  status_acesso: boolean;
  created_at: string;
}

/**
 * Valida se o usuário autenticado que está realizando a requisição
 * possui permissões administrativas (mestre ou admin).
 */
async function validarAcessoAdmin(supabaseAdmin: ReturnType<typeof createServerClient>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token) {
    throw new Error('Não autorizado: Sessão ausente.');
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Não autorizado: Sessão inválida.');
  }

  // Obter a role do usuário a partir dos metadados ou das tabelas públicas de perfil
  let role = user.user_metadata?.role || '';

  if (!role) {
    // 1. Tentar ler da tabela 'perfis'
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .single();

    if (perfil?.role) {
      role = perfil.role;
    } else {
      // 2. Tentar ler da tabela 'perfis_usuarios'
      const { data: perfilUsuario } = await supabaseAdmin
        .from('perfis_usuarios')
        .select('role')
        .eq('id', user.id)
        .single();

      if (perfilUsuario?.role) {
        role = perfilUsuario.role;
      }
    }
  }

  const normalizedRole = (role || '').toLowerCase();
  if (normalizedRole !== 'admin' && normalizedRole !== 'mestre') {
    throw new Error('Acesso negado: Permissão restrita a administradores e mestres.');
  }

  return user;
}

/**
 * Server Action segura para criar e provisionar contas de funcionários.
 * Utiliza o cliente com a SERVICE_ROLE_KEY para chamar a API administrativa.
 */
export async function criarMembroEquipe(dados: CriarMembroEquipeDados): Promise<MembroEquipe> {
  // 1. Validações iniciais de presença de dados
  if (!dados.nome_completo.trim()) {
    throw new Error('O nome completo do funcionário é obrigatório.');
  }
  if (!dados.email.trim()) {
    throw new Error('O e-mail corporativo é obrigatório.');
  }
  if (!dados.telefone.trim()) {
    throw new Error('O número do WhatsApp é obrigatório.');
  }
  if (!dados.role || (dados.role !== 'vendedor' && dados.role !== 'instalador')) {
    throw new Error('Nível de acesso inválido. Escolha "vendedor" ou "instalador".');
  }

  const emailFormatado = dados.email.trim().toLowerCase();
  const nomeFormatado = dados.nome_completo.trim();
  const telefoneFormatado = dados.telefone.trim();
  const roleFormatada = dados.role;

  // 2. Inicializar o cliente com a service role key do servidor
  const supabaseAdmin = createServerClient();

  // 3. Validar se o requisitante tem autorização
  await validarAcessoAdmin(supabaseAdmin);

  // 4. Provisionar o usuário no Supabase Auth usando inviteUserByEmail.
  // Isso dispara o convite por e-mail para que ele defina sua senha sem
  // deslogar o gerente/administrador da sessão atual.
  const { data: authUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    emailFormatado,
    {
      data: {
        name: nomeFormatado,
        nome_completo: nomeFormatado,
        role: roleFormatada,
        telefone: telefoneFormatado,
      },
    }
  );

  if (inviteError) {
    console.error('Erro ao criar convite de usuário no Auth:', inviteError);
    if (inviteError.message.includes('already exists') || inviteError.status === 422) {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }
    throw new Error(inviteError.message || 'Erro ao criar conta de acesso.');
  }

  if (!authUser.user) {
    throw new Error('Erro ao gerar a conta de acesso para o funcionário.');
  }

  const novoId = authUser.user.id;

  // 5. Inserir dados na tabela pública de perfis.
  // Tentamos primeiro na tabela 'perfis' que é a solicitada originalmente pelo usuário.
  let resultadoSalvo: any = null;
  
  const { data: perfilData, error: perfilError } = await supabaseAdmin
    .from('perfis')
    .insert([
      {
        id: novoId,
        nome: nomeFormatado,
        nome_completo: nomeFormatado,
        telefone: telefoneFormatado,
        role: roleFormatada,
        email: emailFormatado,
      }
    ])
    .select()
    .single();

  if (perfilError) {
    console.warn('Aviso: Falha ao inserir na tabela perfis, tentando fallback para perfis_usuarios:', perfilError.message);
    
    // Fallback: Tentamos inserir na tabela 'perfis_usuarios'
    // Como 'perfis_usuarios' não possui coluna de telefone na migração IAM, omitimos.
    const { data: perfilUsuarioData, error: perfilUsuarioError } = await supabaseAdmin
      .from('perfis_usuarios')
      .insert([
        {
          id: novoId,
          nome_completo: nomeFormatado,
          email: emailFormatado,
          role: roleFormatada,
          status_acesso: true,
        }
      ])
      .select()
      .single();

    if (perfilUsuarioError) {
      console.error('Erro ao inserir também na tabela de fallback perfis_usuarios:', perfilUsuarioError);
      
      // Rollback do usuário criado no auth para evitar inconsistências
      try {
        await supabaseAdmin.auth.admin.deleteUser(novoId);
      } catch (delError) {
        console.error('Erro no rollback do usuário auth:', delError);
      }
      throw new Error(perfilUsuarioError.message || 'Falha ao salvar perfil do funcionário no banco de dados.');
    } else {
      resultadoSalvo = {
        id: novoId,
        nome_completo: perfilUsuarioData.nome_completo,
        email: perfilUsuarioData.email,
        telefone: telefoneFormatado, // Preserva o telefone informado no formulário
        role: roleFormatada, // Preserva a role real informada no formulário
        status_acesso: perfilUsuarioData.status_acesso,
        created_at: perfilUsuarioData.created_at,
      };
    }
  } else {
    resultadoSalvo = {
      id: novoId,
      nome_completo: perfilData.nome_completo || perfilData.nome || nomeFormatado,
      email: perfilData.email || emailFormatado,
      telefone: perfilData.telefone || telefoneFormatado,
      role: perfilData.role || roleFormatada,
      status_acesso: perfilData.status_acesso ?? true,
      created_at: perfilData.created_at || new Date().toISOString(),
    };
  }

  return resultadoSalvo as MembroEquipe;
}
