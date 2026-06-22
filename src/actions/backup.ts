'use server';

import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Auxiliar para verificar se o usuário está autenticado e possui permissão (mestre ou admin).
 * Retorna o ID da empresa do usuário logado para garantir isolamento multi-tenant.
 */
async function checkAdminAndGetEmpresa() {
  const supabase = createServerClient();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token) {
    throw new Error('Sessão ausente ou expirada. Faça login novamente.');
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Sessão inválida ou expirada.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('perfis_usuarios')
    .select('role, status_acesso, empresa_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Perfil do usuário não encontrado.');
  }

  if (profile.status_acesso === false) {
    throw new Error('Seu usuário está bloqueado.');
  }

  if (profile.role !== 'admin' && profile.role !== 'mestre' && profile.role !== 'super_admin') {
    throw new Error('Acesso negado: Apenas administradores ou mestres podem acessar backups.');
  }

  return { empresaId: profile.empresa_id };
}

/**
 * Helper para formatar linhas em formato CSV respeitando as regras de escape.
 */
function jsonToCsv(headers: string[], rows: any[][]): string {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      row
        .map(val => {
          if (val === null || val === undefined) return '""';
          if (Array.isArray(val)) {
            const arrStr = val.join('; ');
            return `"${arrStr.replace(/"/g, '""')}"`;
          }
          const str = String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
  ].join('\n');
  return '\ufeff' + csvContent; // BOM UTF-8
}

/**
 * Busca a configuração do Google Drive vinculada à empresa no banco de dados.
 * Retorna erro silencioso se a tabela 'gdrive_config' não existir.
 */
export async function getGDriveConfig() {
  try {
    const { empresaId } = await checkAdminAndGetEmpresa();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('gdrive_config')
      .select('folder_id, service_account_json')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        return { success: true, isDbConfigured: false, data: null };
      }
      throw error;
    }

    return { success: true, isDbConfigured: true, data };
  } catch (err: any) {
    console.error('Erro ao buscar configuração do Drive:', err);
    return { success: false, error: err.message || 'Erro ao carregar configurações.' };
  }
}

/**
 * Salva ou atualiza a configuração do Google Drive para a empresa.
 * Retorna flag especial se a tabela do banco de dados não existir.
 */
export async function saveGDriveConfig(folderId: string, serviceAccountJson: string) {
  try {
    const { empresaId } = await checkAdminAndGetEmpresa();
    const supabase = createServerClient();

    // Validar JSON da conta de serviço antes de salvar
    try {
      JSON.parse(serviceAccountJson);
    } catch {
      throw new Error('O arquivo JSON da Conta de Serviço é inválido. Verifique o formato.');
    }

    const { error } = await supabase
      .from('gdrive_config')
      .upsert({
        empresa_id: empresaId,
        folder_id: folderId,
        service_account_json: serviceAccountJson,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'empresa_id'
      });

    if (error) {
      if (error.code === '42P01') {
        return { success: false, error: 'not_migrated' };
      }
      throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro ao salvar configuração do Drive:', err);
    return { success: false, error: err.message || 'Erro ao salvar configurações.' };
  }
}

/**
 * Gera e retorna os dados de backup em CSV de tabelas específicas.
 */
export async function getBackupCSV(table: 'leads' | 'visitas_agendadas' | 'historico_visitas' | 'projetos_detalhado') {
  try {
    const { empresaId } = await checkAdminAndGetEmpresa();
    const supabase = createServerClient();

    if (table === 'leads') {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const headers = ['ID', 'Nome', 'E-mail', 'Telefone', 'Cidade', 'CEP', 'Número', 'Endereço Obra', 'Área (m²)', 'Tipo de Serviço', 'Valor Estimado', 'Materiais Previstos', 'Status', 'Criado Em'];
      const rows = (leads || []).map(l => [
        l.id,
        l.nome,
        l.email,
        l.telefone,
        l.cidade,
        l.cep,
        l.numero,
        l.endereco_obra,
        l.area_m2,
        l.tipo_servico,
        l.valor_estimado,
        l.materiais_previstos,
        l.status,
        l.criado_em
      ]);
      return { success: true, csv: jsonToCsv(headers, rows), filename: `backup_leads_${Date.now()}.csv` };
    }

    if (table === 'visitas_agendadas' || table === 'historico_visitas') {
      const { data: visits, error } = await supabase
        .from('visits')
        .select('*, projects(*, leads(*)), responsaveis_tecnicos(*)')
        .eq('empresa_id', empresaId)
        .order('data_visita', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;

      const filteredVisits = (visits || []).filter(v => 
        table === 'visitas_agendadas' ? v.status_visita === 'Agendada' : v.status_visita !== 'Agendada'
      );

      const headers = ['ID', 'Projeto ID', 'Cliente', 'Telefone', 'Endereço', 'Data da Visita', 'Horário', 'Status', 'Técnico Responsável', 'Materiais Planejados / Usados', 'Custo Extra', 'Observações', 'Criado Em'];
      const rows = filteredVisits.map(v => [
        v.id,
        v.project_id,
        v.projects?.leads?.nome || v.cliente || '—',
        v.projects?.leads?.telefone || '—',
        v.projects?.leads?.endereco_obra || v.projects?.endereco || v.endereco || '—',
        v.data_visita,
        v.horario,
        v.status_visita,
        v.responsaveis_tecnicos?.nome || '—',
        v.material_usado,
        v.valor_gasto,
        v.observacoes,
        v.criado_em
      ]);
      const suffix = table === 'visitas_agendadas' ? 'visitas_agendadas' : 'historico_visitas';
      return { success: true, csv: jsonToCsv(headers, rows), filename: `backup_${suffix}_${Date.now()}.csv` };
    }

    if (table === 'projetos_detalhado') {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*, leads(*)')
        .eq('empresa_id', empresaId)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const headers = ['ID', 'Lead ID', 'Cliente', 'Telefone', 'E-mail', 'Endereço da Obra', 'Cidade', 'CEP', 'Área (m²)', 'Tipo de Serviço', 'Status do Projeto', 'Valor do Contrato', 'Criado Em'];
      const rows = (projects || []).map(p => [
        p.id,
        p.lead_id,
        p.leads?.nome || '—',
        p.leads?.telefone || '—',
        p.leads?.email || '—',
        p.endereco || p.leads?.endereco_obra || '—',
        p.leads?.cidade || '—',
        p.leads?.cep || '—',
        p.leads?.area_m2 || '—',
        p.leads?.tipo_servico || '—',
        p.status_projeto,
        p.valor_total,
        p.criado_em
      ]);
      return { success: true, csv: jsonToCsv(headers, rows), filename: `backup_projetos_detalhado_${Date.now()}.csv` };
    }

    throw new Error('Tabela inválida.');
  } catch (err: any) {
    console.error('Erro ao gerar CSV de backup:', err);
    return { success: false, error: err.message || 'Erro ao gerar backup.' };
  }
}

/**
 * Autentica com a conta de serviço do Google Drive usando JWT assinado em RS256.
 * Retorna o access_token.
 */
async function getGoogleDriveAccessToken(serviceAccountJson: any) {
  const { client_email, private_key } = serviceAccountJson;
  if (!client_email || !private_key) {
    throw new Error('Campos client_email ou private_key ausentes no arquivo JSON da Conta de Serviço.');
  }

  // Corrigir quebras de linha na chave privada
  const formattedPrivateKey = private_key.replace(/\\n/g, '\n');

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const base64UrlEncode = (obj: any) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const signatureInput = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(formattedPrivateKey, 'base64url');

  const jwt = `${signatureInput}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString()
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error || 'Falha ao autenticar com o Google.');
  }

  return data.access_token;
}

/**
 * Faz upload de um arquivo para o Google Drive na pasta especificada.
 */
async function uploadFileToDrive(accessToken: string, folderId: string, filename: string, content: string) {
  const metadata = {
    name: filename,
    parents: folderId ? [folderId] : undefined,
    mimeType: 'text/csv'
  };

  const boundary = 'okka_backup_boundary_separator';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/csv; charset=UTF-8\r\n\r\n' +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(Buffer.byteLength(body))
      },
      body: body
    }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Erro ao fazer upload no Google Drive.');
  }

  return data;
}

/**
 * Envia um ou todos os backups de dados para a pasta correspondente no Google Drive.
 */
export async function uploadBackupToGDrive(
  table: 'leads' | 'visitas_agendadas' | 'historico_visitas' | 'projetos_detalhado' | 'all',
  localConfig?: { folderId: string; serviceAccountJson: string }
) {
  try {
    // 1. Obter a configuração do Google Drive (do banco de dados ou do fallback local enviado pelo cliente)
    let folderId = '';
    let serviceAccountJsonStr = '';

    if (localConfig) {
      folderId = localConfig.folderId;
      serviceAccountJsonStr = localConfig.serviceAccountJson;
    } else {
      const configRes = await getGDriveConfig();
      if (!configRes.success || !configRes.data) {
        throw new Error('Configuração do Google Drive não encontrada. Configure-a antes de iniciar o backup.');
      }
      folderId = configRes.data.folder_id;
      serviceAccountJsonStr = configRes.data.service_account_json;
    }

    if (!folderId || !serviceAccountJsonStr) {
      throw new Error('ID da pasta ou chave JSON da conta de serviço não configurada.');
    }

    const serviceAccountJson = JSON.parse(serviceAccountJsonStr);

    // 2. Autenticar no Google Drive API
    const accessToken = await getGoogleDriveAccessToken(serviceAccountJson);

    // 3. Gerar dados de backup
    const tablesToBackup: ('leads' | 'visitas_agendadas' | 'historico_visitas' | 'projetos_detalhado')[] = 
      table === 'all'
        ? ['leads', 'visitas_agendadas', 'historico_visitas', 'projetos_detalhado']
        : [table];

    const results = [];
    const nowStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');

    for (const targetTable of tablesToBackup) {
      const backupRes = await getBackupCSV(targetTable);
      if (!backupRes.success || !backupRes.csv) {
        throw new Error(`Falha ao gerar CSV para a tabela: ${targetTable}.`);
      }

      // Nome amigável do arquivo
      const prettyName = 
        targetTable === 'leads' ? 'leads' : 
        targetTable === 'visitas_agendadas' ? 'visitas_agendadas' : 
        targetTable === 'historico_visitas' ? 'historico_visitas' : 'projetos_detalhados';

      const filename = `backup_${prettyName}_${nowStr}.csv`;
      
      // Upload para o Drive
      await uploadFileToDrive(accessToken, folderId, filename, backupRes.csv);
      results.push(filename);
    }

    return { success: true, uploadedFiles: results };
  } catch (err: any) {
    console.error('Erro no upload de backup para o Drive:', err);
    return { success: false, error: err.message || 'Erro ao realizar upload para o Google Drive.' };
  }
}
