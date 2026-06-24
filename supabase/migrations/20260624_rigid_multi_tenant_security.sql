-- OKKA Platform - Migration: Rigid Multi-Tenant Security & Optimizations
-- Execute este script no SQL Editor do seu projeto Supabase.

-- =========================================================================
-- 1. OTIMIZAÇÃO DAS FUNÇÕES DE AUXÍLIO (JWT CLAIMS COM FALLBACK)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS uuid AS $$
DECLARE
  _empresa_id text;
BEGIN
  -- 1. Tentar ler do JWT metadata (mais rápido e evita loops de recursão)
  _empresa_id := auth.jwt() -> 'user_metadata' ->> 'empresa_id';
  IF _empresa_id IS NOT NULL THEN
    RETURN _empresa_id::uuid;
  END IF;

  -- 2. Fallback para query na tabela perfis_usuarios
  RETURN (SELECT empresa_id FROM public.perfis_usuarios WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
DECLARE
  _role text;
BEGIN
  -- 1. Tentar ler do JWT metadata
  _role := auth.jwt() -> 'user_metadata' ->> 'role';
  IF _role IS NOT NULL THEN
    RETURN _role = 'super_admin';
  END IF;

  -- 2. Fallback
  RETURN COALESCE((SELECT role = 'super_admin' FROM public.perfis_usuarios WHERE id = auth.uid()), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =========================================================================
-- 2. TRIGGER DE SINCRONIZAÇÃO BIDIRECIONAL (Perfis -> Auth metadata)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_users()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'empresa_id', NEW.empresa_id,
      'role', NEW.role,
      'name', NEW.nome_completo,
      'nome_completo', NEW.nome_completo,
      'status_acesso', NEW.status_acesso
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_profile_to_auth_users ON public.perfis_usuarios;
CREATE TRIGGER tr_sync_profile_to_auth_users
  AFTER INSERT OR UPDATE OF empresa_id, role, nome_completo, status_acesso ON public.perfis_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_auth_users();

-- =========================================================================
-- 3. PREVENÇÃO DE ESCALONAMENTO DE PRIVILÉGIOS (Trigger de Role)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.check_profile_role_changes()
RETURNS trigger AS $$
BEGIN
  -- Se o perfil está tentando se tornar ou definir alguém como 'super_admin'
  IF NEW.role = 'super_admin' THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Não autorizado: Apenas SuperAdmins podem atribuir a role super_admin.';
    END IF;
  END IF;

  -- Se a role antiga era 'super_admin' e está mudando para outra
  IF OLD.role = 'super_admin' AND NEW.role <> 'super_admin' THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Não autorizado: Apenas SuperAdmins podem remover a role super_admin.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_profile_role_changes ON public.perfis_usuarios;
CREATE TRIGGER tr_check_profile_role_changes
  BEFORE INSERT OR UPDATE OF role ON public.perfis_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_role_changes();

-- =========================================================================
-- 4. REESTRUTURAÇÃO DAS POLÍTICAS DA TABELA DE VISITAS (`visits`)
-- =========================================================================

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Visits multi-tenant policy" ON public.visits;
DROP POLICY IF EXISTS "Admins e Mestres têm permissão total em visits" ON public.visits;
DROP POLICY IF EXISTS "Tecnicos e Instaladores podem ver suas visitas" ON public.visits;
DROP POLICY IF EXISTS "Tecnicos podem atualizar suas visitas" ON public.visits;
DROP POLICY IF EXISTS "Técnicos podem ver suas próprias visitas" ON public.visits;
DROP POLICY IF EXISTS "Técnicos podem atualizar suas próprias visitas" ON public.visits;
DROP POLICY IF EXISTS "Administradores têm permissão total em visits" ON public.visits;

-- Super Admin
CREATE POLICY "Super admin can do all on visits" ON public.visits
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Admins e Mestres
CREATE POLICY "Admins e Mestres total access within company" ON public.visits
  FOR ALL TO authenticated
  USING (
    empresa_id = public.get_my_empresa_id() 
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
      OR EXISTS (
        SELECT 1 FROM public.perfis_usuarios 
        WHERE perfis_usuarios.id = auth.uid() 
        AND perfis_usuarios.role IN ('admin', 'mestre')
      )
    )
  )
  WITH CHECK (
    empresa_id = public.get_my_empresa_id() 
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
      OR EXISTS (
        SELECT 1 FROM public.perfis_usuarios 
        WHERE perfis_usuarios.id = auth.uid() 
        AND perfis_usuarios.role IN ('admin', 'mestre')
      )
    )
  );

-- Técnicos / Instaladores
CREATE POLICY "Tecnicos e Instaladores can view their assigned visits within company" ON public.visits
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_my_empresa_id() AND tecnico_id = auth.uid());

CREATE POLICY "Tecnicos e Instaladores can update their assigned visits within company" ON public.visits
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_my_empresa_id() AND tecnico_id = auth.uid())
  WITH CHECK (empresa_id = public.get_my_empresa_id() AND tecnico_id = auth.uid());

-- =========================================================================
-- 5. REESTRUTURAÇÃO DAS POLÍTICAS DE RESPONSÁVEIS TÉCNICOS (`responsaveis_tecnicos`)
-- =========================================================================

ALTER TABLE public.responsaveis_tecnicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ver responsaveis_tecnicos" ON public.responsaveis_tecnicos;
DROP POLICY IF EXISTS "Apenas administradores podem gerenciar responsaveis_tecnicos" ON public.responsaveis_tecnicos;
DROP POLICY IF EXISTS "Responsaveis tecnicos multi-tenant policy" ON public.responsaveis_tecnicos;

CREATE POLICY "Super admin can do all on responsaveis_tecnicos" ON public.responsaveis_tecnicos
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view responsaveis_tecnicos of their own company" ON public.responsaveis_tecnicos
  FOR SELECT TO authenticated USING (empresa_id = public.get_my_empresa_id());

CREATE POLICY "Admins can manage responsaveis_tecnicos of their own company" ON public.responsaveis_tecnicos
  FOR ALL TO authenticated
  USING (
    empresa_id = public.get_my_empresa_id()
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
      OR EXISTS (
        SELECT 1 FROM public.perfis_usuarios 
        WHERE perfis_usuarios.id = auth.uid() 
        AND perfis_usuarios.role IN ('admin', 'mestre')
      )
    )
  )
  WITH CHECK (
    empresa_id = public.get_my_empresa_id()
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
      OR EXISTS (
        SELECT 1 FROM public.perfis_usuarios 
        WHERE perfis_usuarios.id = auth.uid() 
        AND perfis_usuarios.role IN ('admin', 'mestre')
      )
    )
  );

-- =========================================================================
-- 6. REESTRUTURAÇÃO DAS POLÍTICAS DE PERFIS DE USUÁRIOS (`perfis_usuarios`)
-- =========================================================================

ALTER TABLE public.perfis_usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Perfis usuarios multi-tenant policy" ON public.perfis_usuarios;
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os perfis" ON public.perfis_usuarios;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.perfis_usuarios;

-- SELECT
CREATE POLICY "Perfis usuarios select policy" ON public.perfis_usuarios
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id() OR id = auth.uid());

-- INSERT/DELETE (Admins)
CREATE POLICY "Perfis usuarios insert/delete policy" ON public.perfis_usuarios
  FOR ALL TO authenticated
  USING (
    public.is_super_admin() 
    OR (
      empresa_id = public.get_my_empresa_id() 
      AND (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
        OR EXISTS (
          SELECT 1 FROM public.perfis_usuarios 
          WHERE perfis_usuarios.id = auth.uid() 
          AND perfis_usuarios.role IN ('admin', 'mestre')
        )
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() 
    OR (
      empresa_id = public.get_my_empresa_id() 
      AND (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
        OR EXISTS (
          SELECT 1 FROM public.perfis_usuarios 
          WHERE perfis_usuarios.id = auth.uid() 
          AND perfis_usuarios.role IN ('admin', 'mestre')
        )
      )
    )
  );

-- UPDATE
CREATE POLICY "Perfis usuarios update policy" ON public.perfis_usuarios
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR id = auth.uid()
    OR (
      empresa_id = public.get_my_empresa_id()
      AND (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
        OR EXISTS (
          SELECT 1 FROM public.perfis_usuarios 
          WHERE perfis_usuarios.id = auth.uid() 
          AND perfis_usuarios.role IN ('admin', 'mestre')
        )
      )
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      id = auth.uid()
      AND (empresa_id = public.get_my_empresa_id() OR empresa_id IS NULL)
    )
    OR (
      empresa_id = public.get_my_empresa_id()
      AND (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
        OR EXISTS (
          SELECT 1 FROM public.perfis_usuarios 
          WHERE perfis_usuarios.id = auth.uid() 
          AND perfis_usuarios.role IN ('admin', 'mestre')
        )
      )
    )
  );

-- =========================================================================
-- 7. AJUSTES FINAIS DE LEADS (LANDING PAGE SECURITY)
-- =========================================================================

-- Restringir inserção pública de leads para apenas a Empresa Padrão (evita spam e injeção em outros tenants)
DROP POLICY IF EXISTS "Público pode criar leads pela Landing Page" ON public.leads;
CREATE POLICY "Público pode criar leads pela Landing Page" ON public.leads
  FOR INSERT TO public WITH CHECK (empresa_id = '00000000-0000-0000-0000-000000000000');
