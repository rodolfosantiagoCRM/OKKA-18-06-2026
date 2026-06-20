-- OKKA Platform - Migration: SaaS Multi-Tenant & RLS Isolation
-- Execute este script no SQL Editor do seu projeto Supabase.

-- =========================================================================
-- 1. CRIAR ENUM E TABELA DE EMPRESAS
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_assinatura_enum') THEN
    CREATE TYPE public.status_assinatura_enum AS ENUM ('ativa', 'inadimplente', 'cancelada');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_fantasia text NOT NULL,
  cnpj text UNIQUE NOT NULL,
  status_assinatura public.status_assinatura_enum DEFAULT 'ativa'::public.status_assinatura_enum NOT NULL,
  assinatura_mp_id text,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir empresa padrão para vincular registros existentes (prevenir quebras de integridade)
INSERT INTO public.empresas (id, nome_fantasia, cnpj, status_assinatura)
VALUES ('00000000-0000-0000-0000-000000000000', 'Empresa Padrão', '00000000000000', 'ativa')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 2. ALTERAR TABELA DE PERFIS DE USUÁRIOS (perfis_usuarios)
-- =========================================================================
-- Liberar restrição de role antiga
ALTER TABLE public.perfis_usuarios DROP CONSTRAINT IF EXISTS perfis_usuarios_role_check;

-- Adicionar nova restrição incluindo o role 'super_admin'
ALTER TABLE public.perfis_usuarios ADD CONSTRAINT perfis_usuarios_role_check 
  CHECK (role IN ('admin', 'instalador', 'tecnico', 'mestre', 'vendedor', 'super_admin'));

-- Adicionar coluna empresa_id
ALTER TABLE public.perfis_usuarios ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;

-- Vincular perfis antigos à Empresa Padrão
UPDATE public.perfis_usuarios SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;

-- =========================================================================
-- 3. ADICIONAR COLUNA empresa_id NAS TABELAS OPERACIONAIS
-- =========================================================================

-- Tabela LEADS
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
UPDATE public.leads SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;

-- Tabela PROJECTS
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
UPDATE public.projects SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;

-- Tabela VISITS
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
UPDATE public.visits SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;

-- Tabela RESPONSAVEIS_TECNICOS
ALTER TABLE public.responsaveis_tecnicos ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
UPDATE public.responsaveis_tecnicos SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;

-- Tabela WHATSAPP_CONFIG
ALTER TABLE public.whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_id_check;
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_empresa_id_unique;
ALTER TABLE public.whatsapp_config ADD CONSTRAINT whatsapp_config_empresa_id_unique UNIQUE(empresa_id);
UPDATE public.whatsapp_config SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;

-- Tabela MATERIAIS_PREDEFINIDOS
ALTER TABLE public.materiais_predefinidos ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
UPDATE public.materiais_predefinidos SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;
-- Permitir nomes de materiais duplicados desde que sejam de empresas diferentes
ALTER TABLE public.materiais_predefinidos DROP CONSTRAINT IF EXISTS materiais_predefinidos_nome_key;
ALTER TABLE public.materiais_predefinidos DROP CONSTRAINT IF EXISTS materiais_predefinidos_empresa_id_nome_key;
ALTER TABLE public.materiais_predefinidos ADD CONSTRAINT materiais_predefinidos_empresa_id_nome_key UNIQUE(empresa_id, nome);

-- =========================================================================
-- 4. CRIAR HELPER FUNCTIONS DE SEGURANÇA (SECURITY DEFINER)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS uuid AS $$
  SELECT empresa_id FROM public.perfis_usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM public.perfis_usuarios WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER;

-- =========================================================================
-- 5. ATUALIZAR TRIGGER DE CRIAÇÃO AUTOMÁTICA DE USUÁRIO (handle_new_user)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis_usuarios (id, nome_completo, email, role, status_acesso, empresa_id)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuário OKKA'),
    coalesce(new.email, 'sem-email@okka.com'),
    coalesce(new.raw_user_meta_data->>'role', 'instalador'),
    coalesce((new.raw_user_meta_data->>'status_acesso')::boolean, true),
    (new.raw_user_meta_data->>'empresa_id')::uuid
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 6. POLÍTICAS DE RLS DE MULTI-TENANCY E BYPASS DE SUPER ADMIN
-- =========================================================================

-- Empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admin can do all on empresas" ON public.empresas;
DROP POLICY IF EXISTS "Users can view their own empresa" ON public.empresas;

CREATE POLICY "Super admin can do all on empresas" ON public.empresas
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view their own empresa" ON public.empresas
  FOR SELECT TO authenticated USING (id = public.get_my_empresa_id());

-- Perfis Usuários
ALTER TABLE public.perfis_usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Perfis usuarios multi-tenant policy" ON public.perfis_usuarios;
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os perfis" ON public.perfis_usuarios;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.perfis_usuarios;

CREATE POLICY "Perfis usuarios multi-tenant policy" ON public.perfis_usuarios
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id() OR id = auth.uid())
  WITH CHECK (public.is_super_admin() OR empresa_id = public.get_my_empresa_id() OR id = auth.uid());

-- Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leads multi-tenant policy" ON public.leads;
DROP POLICY IF EXISTS "Usuários autenticados podem ver leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar leads" ON public.leads;
DROP POLICY IF EXISTS "Público pode criar leads pela Landing Page" ON public.leads;

CREATE POLICY "Público pode criar leads pela Landing Page" ON public.leads
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Leads multi-tenant policy" ON public.leads
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id())
  WITH CHECK (public.is_super_admin() OR empresa_id = public.get_my_empresa_id());

-- Projetos (Projects)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Projects multi-tenant policy" ON public.projects;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar projetos" ON public.projects;

CREATE POLICY "Projects multi-tenant policy" ON public.projects
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id())
  WITH CHECK (public.is_super_admin() OR empresa_id = public.get_my_empresa_id());

-- Visitas (Visits)
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Visits multi-tenant policy" ON public.visits;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar visitas" ON public.visits;
DROP POLICY IF EXISTS "Administradores têm permissão total em visits" ON public.visits;

CREATE POLICY "Visits multi-tenant policy" ON public.visits
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id())
  WITH CHECK (public.is_super_admin() OR empresa_id = public.get_my_empresa_id());

-- Responsáveis Técnicos
ALTER TABLE public.responsaveis_tecnicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Responsaveis tecnicos multi-tenant policy" ON public.responsaveis_tecnicos;
DROP POLICY IF EXISTS "Apenas administradores podem gerenciar responsaveis_tecnicos" ON public.responsaveis_tecnicos;

CREATE POLICY "Responsaveis tecnicos multi-tenant policy" ON public.responsaveis_tecnicos
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id())
  WITH CHECK (public.is_super_admin() OR empresa_id = public.get_my_empresa_id());

-- Configuração WhatsApp (whatsapp_config)
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Whatsapp config multi-tenant policy" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ver whatsapp_config" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Apenas administradores podem gerenciar whatsapp_config" ON public.whatsapp_config;

CREATE POLICY "Whatsapp config multi-tenant policy" ON public.whatsapp_config
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id())
  WITH CHECK (public.is_super_admin() OR empresa_id = public.get_my_empresa_id());

-- Materiais Pré-definidos (materiais_predefinidos)
ALTER TABLE public.materiais_predefinidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Materiais predefinidos multi-tenant policy" ON public.materiais_predefinidos;
DROP POLICY IF EXISTS "Qualquer autenticado pode ver materiais" ON public.materiais_predefinidos;
DROP POLICY IF EXISTS "Qualquer autenticado pode gerenciar materiais" ON public.materiais_predefinidos;

CREATE POLICY "Materiais predefinidos multi-tenant policy" ON public.materiais_predefinidos
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id())
  WITH CHECK (public.is_super_admin() OR empresa_id = public.get_my_empresa_id());
