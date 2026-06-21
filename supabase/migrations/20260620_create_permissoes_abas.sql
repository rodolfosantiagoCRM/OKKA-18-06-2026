-- OKKA Platform - Migration: Controle de Acesso Dinâmico por Abas
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Criar a tabela de permissões de abas
CREATE TABLE IF NOT EXISTS public.permissoes_abas (
  role text PRIMARY KEY CHECK (role IN ('admin', 'instalador', 'tecnico', 'mestre', 'vendedor')),
  dashboard boolean DEFAULT true NOT NULL,
  leads boolean DEFAULT true NOT NULL,
  visitas boolean DEFAULT true NOT NULL,
  projetos boolean DEFAULT true NOT NULL,
  equipe boolean DEFAULT true NOT NULL,
  eficiencia boolean DEFAULT true NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.permissoes_abas ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas RLS
DROP POLICY IF EXISTS "Qualquer autenticado pode ler abas" ON public.permissoes_abas;
CREATE POLICY "Qualquer autenticado pode ler abas"
  ON public.permissoes_abas FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Apenas gestores alteram abas" ON public.permissoes_abas;
CREATE POLICY "Apenas gestores alteram abas"
  ON public.permissoes_abas FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'mestre'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'mestre'
  );

INSERT INTO public.permissoes_abas (role, dashboard, leads, visitas, projetos, equipe, eficiencia) VALUES
  ('admin', true, true, true, true, true, true),
  ('mestre', true, true, true, true, true, true),
  ('vendedor', true, true, true, true, false, false),
  ('tecnico', false, false, true, false, false, false),
  ('instalador', false, false, true, false, false, false)
ON CONFLICT (role) DO UPDATE SET
  dashboard = EXCLUDED.dashboard,
  leads = EXCLUDED.leads,
  visitas = EXCLUDED.visitas,
  projetos = EXCLUDED.projetos,
  equipe = EXCLUDED.equipe,
  eficiencia = EXCLUDED.eficiencia,
  updated_at = timezone('utc'::text, now());
