-- OKKA Platform - Migration: Tabela de Materiais Pré-definidos
-- Execute este script no SQL Editor do seu projeto Supabase.

CREATE TABLE IF NOT EXISTS public.materiais_predefinidos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text UNIQUE NOT NULL,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.materiais_predefinidos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Qualquer autenticado pode ver materiais" ON public.materiais_predefinidos;
CREATE POLICY "Qualquer autenticado pode ver materiais"
  ON public.materiais_predefinidos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Qualquer autenticado pode gerenciar materiais" ON public.materiais_predefinidos;
CREATE POLICY "Qualquer autenticado pode gerenciar materiais"
  ON public.materiais_predefinidos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed de materiais padrão para preencher a tabela no início
INSERT INTO public.materiais_predefinidos (nome) VALUES
  ('Cabo Calefator 15W/m'),
  ('Cabo Calefator 20W/m'),
  ('Termostato Wifi Black'),
  ('Termostato Wifi White'),
  ('Termostato Digital Programável'),
  ('Isolamento Térmico (Refletivo)'),
  ('Sensor de Piso NTC'),
  ('Malha Metálica de Fixação'),
  ('Fita de Fixação Adesiva')
ON CONFLICT (nome) DO NOTHING;
