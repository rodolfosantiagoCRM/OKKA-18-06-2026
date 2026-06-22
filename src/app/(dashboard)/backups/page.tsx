'use client';

import React, { useState, useEffect } from 'react';
import { 
  getGDriveConfig, 
  saveGDriveConfig, 
  getBackupCSV, 
  uploadBackupToGDrive 
} from '@/actions/backup';

export default function BackupsPage() {
  // Configs do Google Drive
  const [folderId, setFolderId] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [isDbConfigured, setIsDbConfigured] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Estados de Carregamento e Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Carregar Configurações do Google Drive
  useEffect(() => {
    async function loadConfig() {
      const res = await getGDriveConfig();
      if (res.success) {
        if (res.isDbConfigured && res.data) {
          setFolderId(res.data.folder_id || '');
          setServiceAccountJson(res.data.service_account_json || '');
          setIsDbConfigured(true);
        } else {
          // Fallback para localStorage se não estiver no banco de dados
          const localFolder = localStorage.getItem('okka_gdrive_folder_id') || '';
          const localJson = localStorage.getItem('okka_gdrive_service_account_json') || '';
          setFolderId(localFolder);
          setServiceAccountJson(localJson);
          setIsDbConfigured(false);
        }
      } else {
        // Fallback completo se der erro na action (por exemplo, permissão ou banco)
        const localFolder = localStorage.getItem('okka_gdrive_folder_id') || '';
        const localJson = localStorage.getItem('okka_gdrive_service_account_json') || '';
        setFolderId(localFolder);
        setServiceAccountJson(localJson);
        setIsDbConfigured(false);
      }
      setConfigLoaded(true);
    }
    loadConfig();
  }, []);

  // Salvar Configuração do Google Drive
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Tentar salvar no banco de dados primeiro
      const res = await saveGDriveConfig(folderId, serviceAccountJson);
      
      if (res.success) {
        setIsDbConfigured(true);
        showToast('Configurações de nuvem salvas no Banco de Dados com sucesso!', 'success');
      } else if (res.error === 'not_migrated') {
        // Fallback para localStorage se a tabela não existir
        localStorage.setItem('okka_gdrive_folder_id', folderId);
        localStorage.setItem('okka_gdrive_service_account_json', serviceAccountJson);
        setIsDbConfigured(false);
        showToast(
          'Configurações salvas localmente neste navegador! Nota: A tabela gdrive_config não foi detectada no banco de dados.',
          'success'
        );
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar configurações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Limpar configurações
  const handleClearConfig = () => {
    if (window.confirm('Deseja realmente limpar as configurações do Google Drive?')) {
      setFolderId('');
      setServiceAccountJson('');
      localStorage.removeItem('okka_gdrive_folder_id');
      localStorage.removeItem('okka_gdrive_service_account_json');
      showToast('Configurações locais limpas. Se houver dados no banco, salve vazio para limpar lá também.', 'success');
    }
  };

  // Disparar download local do arquivo CSV
  const handleLocalDownload = async (table: 'leads' | 'visitas_agendadas' | 'historico_visitas' | 'projetos_detalhado') => {
    setIsDownloading(table);
    try {
      const res = await getBackupCSV(table);
      if (res.success && res.csv && res.filename) {
        // Forçar download no navegador
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', res.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Download de ${table.replace('_', ' ')} concluído com sucesso!`, 'success');
      } else {
        throw new Error(res.error || 'Erro desconhecido ao obter backup.');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao baixar arquivo.', 'error');
    } finally {
      setIsDownloading(null);
    }
  };

  // Upload individual ou geral para o Google Drive
  const handleGDriveUpload = async (table: 'leads' | 'visitas_agendadas' | 'historico_visitas' | 'projetos_detalhado' | 'all') => {
    if (!folderId || !serviceAccountJson) {
      showToast('Por favor, preencha as configurações do Google Drive antes de tentar o backup.', 'error');
      return;
    }

    setIsUploading(table);
    try {
      // Se não estiver configurado no banco de dados, enviamos a configuração do localStorage/state local na própria chamada
      const localConfig = isDbConfigured 
        ? undefined 
        : { folderId, serviceAccountJson };

      const res = await uploadBackupToGDrive(table, localConfig);
      
      if (res.success) {
        showToast(
          `Backup enviado com sucesso! Arquivo(s) enviado(s): ${res.uploadedFiles?.join(', ')}`,
          'success'
        );
      } else {
        throw new Error(res.error || 'Erro ao enviar backup para o Google Drive.');
      }
    } catch (err: any) {
      showToast(err.message || 'Falha no backup do Google Drive. Verifique suas credenciais.', 'error');
    } finally {
      setIsUploading(null);
    }
  };

  // Testar conexão geral do Google Drive
  const handleTestConnection = async () => {
    if (!folderId || !serviceAccountJson) {
      showToast('Preencha os campos do Google Drive antes de testar a conexão.', 'error');
      return;
    }
    setIsTesting(true);
    try {
      const localConfig = isDbConfigured ? undefined : { folderId, serviceAccountJson };
      const res = await uploadBackupToGDrive('leads', localConfig);
      if (res.success) {
        showToast('Conexão estabelecida com sucesso! Um backup de teste de Leads foi gravado na sua pasta.', 'success');
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      showToast(`Falha na conexão: ${err.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-orange-650 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Administração
            </span>
            <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">Backups do Sistema</h1>
            <p className="text-sm text-gray-500 mt-1">
              Baixe as planilhas locais do CRM ou automatize o envio direto para a sua nuvem do Google Drive.
            </p>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-350 text-white text-xs font-bold max-w-md ${
            toast.type === 'error' ? 'bg-rose-600 border border-rose-500' : 'bg-gray-900 border border-gray-800'
          }`}>
            {toast.type === 'error' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="flex-1">{toast.msg}</span>
          </div>
        )}

        {/* Grid de Seções */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Esquerda & Central: Backups & Downloads (2/3 de largura) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Seção 1: Backup Local (Download para o PC) */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900">1. Backup Local (Salvar no Computador)</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Baixe os dados estruturados em formato CSV para visualização em Excel ou outros softwares.</p>
                </div>
              </div>

              {/* Grid de Tabelas para Download */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: 'leads',
                    title: 'Cadastro de Leads',
                    desc: 'Inclui nomes, e-mails, telefones, endereços e status de qualificação do pipeline.',
                  },
                  {
                    id: 'visitas_agendadas',
                    title: 'Cronograma de Visitas',
                    desc: 'Apenas as visitas agendadas ativas com respectivos técnicos, datas e endereços.',
                  },
                  {
                    id: 'historico_visitas',
                    title: 'Histórico de Visitas',
                    desc: 'Relatório completo de visitas técnicas com status finalizadas (realizadas ou canceladas).',
                  },
                  {
                    id: 'projetos_detalhado',
                    title: 'Tabela de Projetos Detalhada',
                    desc: 'Contratos, endereços das obras, valores fechados e vínculos completos com os Leads.',
                  }
                ].map((item) => (
                  <div 
                    key={item.id} 
                    className="border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-orange-250 p-4.5 rounded-2xl transition-all duration-200 flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-950 text-sm group-hover:text-orange-600 transition-colors leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-[10.5px] text-gray-450 leading-relaxed font-semibold">{item.desc}</p>
                    </div>

                    <button
                      onClick={() => handleLocalDownload(item.id as any)}
                      disabled={isDownloading !== null}
                      className="w-full bg-white hover:bg-orange-500 border border-gray-200 hover:border-orange-500 text-gray-600 hover:text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isDownloading === item.id ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Baixando...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Baixar CSV (.csv)
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção 2: Enviar Backup para o Google Drive */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 shrink-0 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-black text-base text-gray-900">2. Backup na Nuvem (Google Drive)</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Envie relatórios estruturados instantaneamente para a pasta configurada do seu Google Drive.</p>
                  </div>
                </div>

                {/* Status Indicator */}
                {configLoaded && (
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm ${
                    folderId && serviceAccountJson
                      ? isDbConfigured
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    {folderId && serviceAccountJson
                      ? isDbConfigured
                        ? 'Nuvem Conectada'
                        : 'Salvo Local (Navegador)'
                      : 'Não Configurado'}
                  </span>
                )}
              </div>

              {/* Se o Drive não estiver configurado, exibe aviso explicativo */}
              {(!folderId || !serviceAccountJson) ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800 leading-relaxed font-semibold">
                  ⚠️ Google Drive não está configurado ainda. Para habilitar o envio à nuvem, preencha e salve a chave de acesso da Conta de Serviço e o ID da Pasta no painel à direita.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Backup Geral */}
                  <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-gray-950 text-sm">Backup Geral Unificado</h4>
                      <p className="text-[10.5px] text-gray-450 leading-relaxed font-semibold">
                        Gera e envia todas as tabelas (Leads, Visitas Agendadas, Histórico de Visitas e Projetos) de uma só vez para o Google Drive.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleGDriveUpload('all')}
                      disabled={isUploading !== null}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5 py-3 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 disabled:opacity-50"
                    >
                      {isUploading === 'all' ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Enviando Backups...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Fazer Backup Geral na Nuvem
                        </>
                      )}
                    </button>
                  </div>

                  {/* Grid de Envio Individual */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'leads', title: 'Enviar Leads' },
                      { id: 'visitas_agendadas', title: 'Enviar Visitas Agendadas' },
                      { id: 'historico_visitas', title: 'Enviar Histórico de Visitas' },
                      { id: 'projetos_detalhado', title: 'Enviar Projetos Detalhados' }
                    ].map((item) => (
                      <div key={item.id} className="border border-gray-100 p-4 rounded-2xl flex items-center justify-between bg-gray-50/30">
                        <span className="text-xs font-bold text-gray-800">{item.title}</span>
                        <button
                          onClick={() => handleGDriveUpload(item.id as any)}
                          disabled={isUploading !== null}
                          className="px-3.5 py-2 border border-indigo-200 hover:bg-indigo-50 text-indigo-650 hover:text-indigo-755 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isUploading === item.id ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Enviar
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Configurações do Google Drive (1/3 de largura) */}
          <div className="space-y-6">
            
            {/* Bloco de Configuração */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="font-black text-base text-gray-900">Configurações do Google Drive</h3>
                <p className="text-[10px] text-gray-400 mt-0.5 font-bold">Credenciais da Conta de Serviço do Google Cloud</p>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="folderId" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    ID da Pasta no Drive
                  </label>
                  <input
                    type="text"
                    id="folderId"
                    required
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value.trim())}
                    placeholder="Ex: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all font-semibold focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="serviceAccountJson" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Arquivo JSON da Conta de Serviço
                  </label>
                  <textarea
                    id="serviceAccountJson"
                    required
                    rows={8}
                    value={serviceAccountJson}
                    onChange={(e) => setServiceAccountJson(e.target.value)}
                    placeholder='Cole o conteúdo do arquivo JSON aqui (começa com {"type": "service_account"...})'
                    className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all font-mono focus:bg-white resize-y"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="px-3 py-2.5 bg-white border border-gray-200 hover:border-rose-350 text-gray-500 hover:text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Limpar
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-gray-900 hover:bg-gray-850 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Salvando...
                      </>
                    ) : 'Salvar Credenciais'}
                  </button>
                </div>
              </form>

              {/* Botão para testar conexão com o Drive */}
              {folderId && serviceAccountJson && (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || isUploading !== null}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isTesting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-indigo-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Testando Conectividade...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Testar Conexão e Backup Geral
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Passo a Passo Informativo */}
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="font-black text-xs text-indigo-900 uppercase tracking-wider">Como Integrar ao Google Drive:</h4>
              <ol className="list-decimal pl-4.5 text-[11px] text-indigo-950 font-semibold space-y-3">
                <li>
                  Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-indigo-700">Google Cloud Console</a> e crie ou selecione um projeto.
                </li>
                <li>
                  Vá em **Biblioteca de APIs** e ative a **Google Drive API**.
                </li>
                <li>
                  Vá em **APIs e Serviços &gt; Credenciais**. Clique em **Criar Credenciais &gt; Conta de Serviço (Service Account)**.
                </li>
                <li>
                  Copie o e-mail da conta de serviço gerada (ex: <code className="bg-white border px-1 py-0.5 rounded text-[10px]">bkp-okka@projeto.iam.gserviceaccount.com</code>).
                </li>
                <li>
                  Acesse a conta de serviço criada, clique na aba **Chaves &gt; Adicionar Chave &gt; Criar Nova Chave &gt; JSON**. O download do arquivo será feito no seu PC.
                </li>
                <li>
                  Crie ou acesse uma pasta no seu **Google Drive pessoal**, clique em **Compartilhar** e adicione o e-mail da conta de serviço (do passo 4) com permissão de **Editor**.
                </li>
                <li>
                  Copie o **ID da Pasta** da URL do navegador (o código longo que aparece após <code className="bg-white border px-1 py-0.5 rounded text-[10px]">/folders/</code>).
                </li>
                <li>
                  Cole o ID da pasta e abra o arquivo JSON baixado no bloco de notas, copie o conteúdo e cole no campo ao lado. Salve e teste a conexão!
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
