-- OKKA Platform - Migration: SaaS Billing (Planos & Faturas)
-- Execute este script no SQL Editor do seu projeto Supabase.

-- =========================================================================
-- 1. CRIAR TABELA DE PLANOS SAAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.planos_saas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  valor numeric(12,2) NOT NULL,
  mp_plan_id text NOT NULL,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 2. CRIAR TABELA DE FATURAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.faturas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  valor numeric(12,2) NOT NULL,
  data_vencimento timestamp with time zone NOT NULL,
  status text NOT NULL CHECK (status IN ('Pendente', 'Paga', 'Falhou')),
  mp_payment_id text,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 3. HABILITAR E CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =========================================================================

-- Planos SaaS RLS
ALTER TABLE public.planos_saas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer usuario autenticado pode ver planos" ON public.planos_saas;
CREATE POLICY "Qualquer usuario autenticado pode ver planos" ON public.planos_saas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Apenas super admin pode gerenciar planos" ON public.planos_saas;
CREATE POLICY "Apenas super admin pode gerenciar planos" ON public.planos_saas
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Faturas RLS
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios podem ver faturas de sua propria empresa" ON public.faturas;
CREATE POLICY "Usuarios podem ver faturas de sua propria empresa" ON public.faturas
  FOR SELECT TO authenticated 
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id());

-- Observação: INSERT e UPDATE para faturas não possuem política pública ativa,
-- logo, só podem ocorrer via service_role_key no backend ou webhooks.

-- =========================================================================
-- 4. INSERIR PLANO SAAS PADRÃO (PRO MENSAL)
-- =========================================================================
INSERT INTO public.planos_saas (id, nome, valor, mp_plan_id)
VALUES (
  'd3b07384-d113-49d5-a50d-bf4cf166a012', 
  'Pro Mensal', 
  99.90, 
  '2c93808486987c2b01869cbbf9020478' -- ID de exemplo de plano recorrente no MP
)
ON CONFLICT (id) DO NOTHING;
