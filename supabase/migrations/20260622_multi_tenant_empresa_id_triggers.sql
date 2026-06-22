-- OKKA Platform - Migration: Multi-Tenant empresa_id Triggers and Cleanup
-- This script sets up triggers to automatically set the empresa_id for rows if not provided,
-- using the authenticated user's profile company ID or falling back to the default company ID.

-- 1. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.set_empresa_id_on_insert_or_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := COALESCE(
      public.get_my_empresa_id(),
      '00000000-0000-0000-0000-000000000000'::uuid
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind triggers to operational tables
-- Projects
DROP TRIGGER IF EXISTS tr_set_projects_empresa_id ON public.projects;
CREATE TRIGGER tr_set_projects_empresa_id
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_empresa_id_on_insert_or_update();

-- Leads
DROP TRIGGER IF EXISTS tr_set_leads_empresa_id ON public.leads;
CREATE TRIGGER tr_set_leads_empresa_id
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_empresa_id_on_insert_or_update();

-- Visits
DROP TRIGGER IF EXISTS tr_set_visits_empresa_id ON public.visits;
CREATE TRIGGER tr_set_visits_empresa_id
  BEFORE INSERT OR UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_empresa_id_on_insert_or_update();

-- Responsáveis Técnicos
DROP TRIGGER IF EXISTS tr_set_responsaveis_tecnicos_empresa_id ON public.responsaveis_tecnicos;
CREATE TRIGGER tr_set_responsaveis_tecnicos_empresa_id
  BEFORE INSERT OR UPDATE ON public.responsaveis_tecnicos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_empresa_id_on_insert_or_update();

-- WhatsApp Config
DROP TRIGGER IF EXISTS tr_set_whatsapp_config_empresa_id ON public.whatsapp_config;
CREATE TRIGGER tr_set_whatsapp_config_empresa_id
  BEFORE INSERT OR UPDATE ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_empresa_id_on_insert_or_update();

-- Materiais Pré-definidos
DROP TRIGGER IF EXISTS tr_set_materiais_predefinidos_empresa_id ON public.materiais_predefinidos;
CREATE TRIGGER tr_set_materiais_predefinidos_empresa_id
  BEFORE INSERT OR UPDATE ON public.materiais_predefinidos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_empresa_id_on_insert_or_update();

-- 3. Cleanup existing records that have NULL company IDs to restore visibility and integrity
UPDATE public.leads SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;
UPDATE public.projects SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;
UPDATE public.visits SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;
UPDATE public.responsaveis_tecnicos SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;
UPDATE public.whatsapp_config SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;
UPDATE public.materiais_predefinidos SET empresa_id = '00000000-0000-0000-0000-000000000000' WHERE empresa_id IS NULL;
